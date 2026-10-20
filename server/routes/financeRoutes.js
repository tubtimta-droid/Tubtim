const express = require('express');
const router = express.Router();
const db = require('../config/db');
const upload = require('../config/upload');

// รายการถอนเงินทั้งหมด พร้อมชื่อ/เบอร์/รูปแม่บ้าน (เชื่อม withdrawal_requests → maid_wallets → maids)
router.get('/admin/withdrawals', (req, res) => {
    db.query(`
        SELECT w.withdrawal_id, w.amount, w.bank_name, w.bank_account_number, w.bank_account_name, w.status, w.requested_at as request_date,
               IF(w.status = 'rejected', w.admin_note, NULL) as reject_reason,
               CONCAT(IFNULL(m.title_prefix,''), IFNULL(m.first_name,''), ' ', IFNULL(m.last_name,'')) as maid_name, 
               m.phone, m.profile_pic, m.maid_id 
        FROM withdrawal_requests w 
        LEFT JOIN maid_wallets mw ON w.wallet_id = mw.wallet_id 
        LEFT JOIN maids m ON mw.maid_id = m.maid_id 
        ORDER BY w.requested_at DESC
    `, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// อนุมัติ = แค่เปลี่ยนสถานะเป็น approved (เงินถูกหักออกจากกระเป๋าไปแล้วตั้งแต่ตอนแม่บ้านขอถอน)
router.put('/admin/withdrawals/:id/approve', (req, res) => {
    db.query('UPDATE withdrawal_requests SET status = "approved", processed_at = NOW() WHERE withdrawal_id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ปฏิเสธ = ต้องระบุเหตุผล และคืนเงินกลับเข้ากระเป๋าแม่บ้าน ทำใน transaction เดียวกัน
router.put('/admin/withdrawals/:id/reject', (req, res) => {
    const withdrawalId = req.params.id;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
        return res.status(400).json({ error: 'กรุณาระบุเหตุผลในการปฏิเสธ' });
    }
    
    db.getConnection((errConn, connection) => {
        if (errConn) return res.status(500).json({ error: errConn.message });
        
        connection.beginTransaction(errTx => {
            if (errTx) { connection.release(); return res.status(500).json({ error: errTx.message }); }

            // 1. ดึงข้อมูลการถอนเพื่อหา wallet_id และ amount
            connection.query('SELECT wallet_id, amount, status FROM withdrawal_requests WHERE withdrawal_id = ?', [withdrawalId], (e1, resW) => {
                if (e1 || resW.length === 0) return connection.rollback(() => { connection.release(); res.status(404).json({ error: 'Withdrawal not found' }); });
                
                const { wallet_id, amount, status } = resW[0];
                if (status !== 'pending') return connection.rollback(() => { connection.release(); res.status(400).json({ error: 'Only pending withdrawals can be rejected' }); });

                // 2. อัปเดตสถานะเป็น rejected พร้อมเหตุผล
                connection.query('UPDATE withdrawal_requests SET status = "rejected", admin_note = ?, processed_at = NOW() WHERE withdrawal_id = ?', [reason.trim(), withdrawalId], (e2) => {
                    if (e2) return connection.rollback(() => { connection.release(); res.status(500).json({ error: e2.message }); });

                    // 3. คืนเงินเข้า Wallet ของแม่บ้าน
                    connection.query('UPDATE maid_wallets SET wallet_balance = wallet_balance + ? WHERE wallet_id = ?', [amount, wallet_id], (e3) => {
                        if (e3) return connection.rollback(() => { connection.release(); res.status(500).json({ error: e3.message }); });

                        connection.commit(errCommit => {
                            if (errCommit) return connection.rollback(() => { connection.release(); res.status(500).json({ error: errCommit.message }); });
                            connection.release();
                            res.json({ success: true, message: 'ปฏิเสธการถอนและคืนเงินเข้า Wallet เรียบร้อย' });
                        });
                    });
                });
            });
        });
    });
});

const { generateId } = require('../utils/idGenerator');
const { notifyWithdrawalRequested } = require('../utils/notify');

// แจ้งถอนเงินจาก Wallet (สำหรับแม่บ้าน)
// ขั้นตอน (ใน transaction): ตรวจยอดเงินและบัญชีธนาคาร → หักเงินจากกระเป๋า → สร้างคำขอถอน (pending)
// → บันทึกประวัติเงินออกใน wallet_transactions → ส่งอีเมลแจ้งแอดมิน
router.post('/maids/:maid_id/withdraw', (req, res) => {
    const maidId = req.params.maid_id;
    const { amount } = req.body || {};
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'กรุณาระบุจำนวนเงินที่ต้องการถอนให้ถูกต้อง' });
    }

    db.getConnection((errConn, connection) => {
        if (errConn) return res.status(500).json({ error: errConn.message });
        
        connection.beginTransaction(async errTx => {
            if (errTx) { connection.release(); return res.status(500).json({ error: errTx.message }); }

            try {
                // 1. ตรวจสอบกระเป๋าเงินแม่บ้าน
                const [wallet] = await new Promise((resolve, reject) => {
                    connection.query('SELECT wallet_id, wallet_balance, bank_name, account_number, account_name FROM maid_wallets WHERE maid_id = ?', [maidId], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });

                if (!wallet) {
                    throw new Error('ไม่พบกระเป๋าเงินของแม่บ้านคนนี้');
                }

                if (wallet.wallet_balance < amount) {
                    throw new Error('ยอดเงินในกระเป๋าไม่เพียงพอ');
                }

                if (!wallet.bank_name || !wallet.account_number || !wallet.account_name) {
                    throw new Error('กรุณาตั้งค่าบัญชีธนาคารก่อนทำรายการถอนเงิน');
                }

                // 2. หักเงินออกจากกระเป๋า
                await new Promise((resolve, reject) => {
                    connection.query('UPDATE maid_wallets SET wallet_balance = wallet_balance - ? WHERE wallet_id = ?', [amount, wallet.wallet_id], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });

                // 3. สร้างคำขอถอนเงิน
                const withdrawalId = await generateId('W', 'withdrawal_requests', 'withdrawal_id');
                await new Promise((resolve, reject) => {
                    connection.query(
                        'INSERT INTO withdrawal_requests (withdrawal_id, wallet_id, amount, bank_name, bank_account_number, bank_account_name, status) VALUES (?, ?, ?, ?, ?, ?, "pending")',
                        [withdrawalId, wallet.wallet_id, amount, wallet.bank_name, wallet.account_number, wallet.account_name],
                        (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        }
                    );
                });

                // 4. บันทึกประวัติ Transaction (-เงินออก) รหัสรายการแบบ T0001, T0002, ...
                const transactionId = await generateId('T', 'wallet_transactions', 'transaction_id');
                await new Promise((resolve, reject) => {
                    connection.query(
                        'INSERT INTO wallet_transactions (transaction_id, wallet_id, amount, type, reference_id, note) VALUES (?, ?, ?, "withdrawal", ?, "ถอนเงินเข้าบัญชีธนาคาร")',
                        [transactionId, wallet.wallet_id, -Math.abs(amount), withdrawalId],
                        (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        }
                    );
                });

                // ยืนยันการบันทึกทั้งหมด (commit transaction)
                connection.commit(errCommit => {
                    if (errCommit) throw errCommit;
                    connection.release();
                    notifyWithdrawalRequested(maidId, amount, withdrawalId);
                    res.json({ success: true, message: 'ส่งคำขอถอนเงินสำเร็จ', withdrawal_id: withdrawalId });
                });

            } catch (error) {
                connection.rollback(() => {
                    connection.release();
                    res.status(400).json({ error: error.message || 'เกิดข้อผิดพลาดในการทำรายการ' });
                });
            }
        });
    });
});

module.exports = router;

