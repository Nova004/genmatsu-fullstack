const sql = require('mssql');
const dbConfig = require('./config/db.config'); // ดึงค่า config ที่สร้างไว้

// สร้าง Connection Pool เพื่อใช้เชื่อมต่อฐานข้อมูล
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL successfully!');
    return pool;
  })
  .catch(err => console.log('Database Connection Failed! Error: ', err));

// ส่งออก pool และ sql เพื่อให้ไฟล์อื่นนำไปใช้ query ได้
module.exports = {
  sql, poolPromise
};