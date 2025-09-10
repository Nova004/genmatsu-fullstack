// src/controllers/user.controller.js

// 1. Import ของมา 3 อย่างให้เหมือนกับ form.controller.js
const { pool, sql, poolConnect } = require('../db.js');

exports.findUserById = async (req, res) => {
  try {
    const { id } = req.params; 

    if (!id) {
      return res.status(400).json({ message: 'กรุณาระบุรหัสพนักงาน' });
    }

    // 2. "รอ" ให้สัญญาณไฟเขียว (poolConnect) ทำงานเสร็จก่อน
    await poolConnect;

    // 3. เมื่อเชื่อมต่อสำเร็จแล้ว ก็สามารถใช้ "pool" ได้เลย
    const result = await pool.request()
      .input('employeeId', sql.VarChar, id)
      .query('SELECT Gen_Manu_mem_NamEN, Gen_Manu_mem_No FROM Gen_Manu_Member WHERE Gen_Manu_mem_Memid = @employeeId'); 

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงาน' });
    }

    const user = result.recordset[0];
    
    res.status(200).json({
      fullName: user.Gen_Manu_mem_NamEN,
      userNumber: user.Gen_Manu_mem_No
    });

  } catch (error) {
    console.error("Error in findUserById:", error); // เพิ่ม context ให้ error log
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
};