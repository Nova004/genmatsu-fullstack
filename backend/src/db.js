// backend/src/db.js
const sql = require("mssql");
const dbConfig = require("./config/db.config.js");

// สร้าง pool แต่ยังไม่ connect
const pool = new sql.ConnectionPool(dbConfig);

// การทำแบบนี้จะทำให้ทั้งแอปพลิเคชันของเรารอจนกว่าฐานข้อมูลจะเชื่อมต่อเสร็จจริงๆ
const poolConnect = pool.connect().then(p => {
    console.log("Database Connected!");
    return p;
}).catch(err => {
    console.error("Database Connection Failed!", err);
    // ถ้าเชื่อมต่อไม่ได้ ให้ปิดโปรแกรมไปเลย ป้องกันการทำงานผิดพลาด
    process.exit(1);
});

module.exports = {
    sql,
    pool,
    poolConnect // เราจะ export promise นี้ไปด้วย
};