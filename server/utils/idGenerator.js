const db = require('../config/db');

// หาเลขรันสูงสุดที่ใช้ไปแล้วจริงๆ (กรอง id ที่ไม่ตรงรูปแบบ PREFIX+ตัวเลขทิ้ง แทนที่จะพึ่ง ORDER BY ... DESC
// ซึ่งเรียงแบบ string ทำให้ id แปลกๆ เช่น 'RT01' โผล่มาก่อน 'R0099' แล้วพัง parseInt จนวนกลับไปชน 0001 ซ้ำ)
const getMaxNum = async (prefix, tableName, idColName) => {
    const [results] = await db.promise().query(
        `SELECT ${idColName} FROM ${tableName} WHERE ${idColName} LIKE ?`,
        [`${prefix}%`]
    );
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapedPrefix}(\\d+)$`);
    let maxNum = 0;
    for (const row of results) {
        const match = pattern.exec(row[idColName]);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
        }
    }
    return maxNum;
};

/**
 * สร้างรหัสใหม่แบบรันเลขต่อจากเลขที่มากที่สุดที่ใช้อยู่
 * @param {string} prefix ตัวอักษรนำหน้ารหัส (เช่น 'U', 'M', 'B')
 * @param {string} tableName ชื่อตาราง
 * @param {string} idColName ชื่อคอลัมน์รหัส
 * @returns {Promise<string>} รหัสใหม่ที่สร้างได้ (เช่น 'U0042')
 */
const generateId = async (prefix, tableName, idColName) => {
    const maxNum = await getMaxNum(prefix, tableName, idColName);
    const nextNum = maxNum + 1;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
};

/**
 * สร้างรหัสใหม่หลายตัวพร้อมกัน (ใช้ตอนเพิ่มข้อมูลหลายแถว)
 */
const generateBulkIds = async (prefix, tableName, idColName, count) => {
    const maxNum = await getMaxNum(prefix, tableName, idColName);
    const newIds = [];
    for (let i = 1; i <= count; i++) {
        newIds.push(`${prefix}${(maxNum + i).toString().padStart(4, '0')}`);
    }
    return newIds;
};

// ส่งออกให้ routes ใช้ เช่น const { generateId } = require('../utils/idGenerator')
module.exports = { generateId, generateBulkIds };
