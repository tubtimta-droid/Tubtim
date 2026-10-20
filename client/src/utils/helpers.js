// แปลงวันเวลาจากฐานข้อมูลเป็นรูปแบบไทย เช่น { date: '9 ตุลาคม 2569', time: '14:30 น.' }
// ปีบวก 543 เพื่อเป็น พ.ศ. ถ้าไม่มีค่าหรือรูปแบบผิดจะคืน '-'
export const formatDateTime = (dateString) => {
    if (!dateString) return { date: '-', time: '-' };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { date: '-', time: '-' };
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return { date: `${day} ${month} ${year}`, time: `${hours}:${minutes} น.` };
};