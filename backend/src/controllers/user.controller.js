// backend/src/controllers/user.controller.js

const { pool, sql, poolConnect } = require("../db.js");


// --- ฟังก์ชันดึงข้อมูล User ทั้งหมด ---

exports.getAllUsers = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        m.agt_member_id,
        m.agt_member_nameTH,
        m.agt_member_nameEN,
        m.agt_member_nickname,
        p.agt_position_name,
        s.name_fullsection,
        m.agt_member_type,
        m.agt_member_shift,
        m.agt_status_job,
        m.agt_member_location,
        gm.Gen_Manu_mem_No  -- 2. เลือกคอลัมน์ Gen_Manu_mem_No ที่ต้องการ
      FROM 
        dbo.agt_member AS m
      LEFT JOIN 
        dbo.agt_position AS p ON m.agt_member_position = p.agt_position_id COLLATE DATABASE_DEFAULT
      LEFT JOIN 
        dbo.agt_section AS s ON m.agt_member_section = s.id_section COLLATE DATABASE_DEFAULT
      -- 1. เพิ่ม LEFT JOIN ตาราง Gen_Manu_Member เข้ามา --
      LEFT JOIN 
        dbo.Gen_Manu_Member AS gm ON m.agt_member_id = gm.Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT
      WHERE
         m.agt_status_job = 'Working'
        AND m.agt_member_position IN ('P012', 'P013', 'P015')
      ORDER BY 
        m.agt_member_id;
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// --- ฟังก์ชันค้นหา User ---
exports.searchUsers = async (req, res) => {
  const { term } = req.query;
  try {
    await poolConnect;
    const result = await pool.request().input("term", sql.NVarChar, `%${term}%`)
      .query(`
        SELECT 
          agt_member_id as id, 
          agt_member_nameEN as name,
          agt_member_id as number
        FROM agt_member 
        WHERE agt_member_nameEN LIKE @term OR agt_member_nameTH LIKE @term OR agt_member_id LIKE @term
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// =============================================================
// === ฟังก์ชันใหม่สำหรับ Update หรือ Insert (Upsert) Employee No. ===
// =============================================================
exports.updateUserEmployeeNo = async (req, res) => {
  try {
    const { id } = req.params;
    const { Gen_Manu_mem_No } = req.body;

    if (Gen_Manu_mem_No === undefined) {
      return res
        .status(400)
        .json({ message: "Employee number (Gen_Manu_mem_No) is required." });
    }

    await poolConnect;

    const existingRecord = await pool
      .request()
      .input("id", sql.NVarChar, id)
      .query("SELECT * FROM Gen_Manu_Member WHERE Gen_Manu_mem_Memid = @id");

    if (existingRecord.recordset.length > 0) {
      // ถ้ามี, ให้อัปเดต
      await pool
        .request()
        .input("id", sql.NVarChar, id)
        .input("no", sql.NVarChar, Gen_Manu_mem_No)
        .query(
          "UPDATE Gen_Manu_Member SET Gen_Manu_mem_No = @no WHERE Gen_Manu_mem_Memid = @id"
        );
    } else {
      // ถ้าไม่มี, ให้เพิ่มใหม่ (INSERT)
      // 1. ดึงข้อมูลที่จำเป็นทั้งหมดจาก agt_member พร้อม JOIN
      const memberDataResult = await pool
        .request()
        .input("id", sql.NVarChar, id).query(`
          SELECT 
            m.agt_member_nameEN,
            p.agt_position_name, -- ดึงชื่อเต็มของ Position
            m.agt_member_shift
          FROM 
            dbo.agt_member AS m
          LEFT JOIN 
            dbo.agt_position AS p ON m.agt_member_position = p.agt_position_id COLLATE DATABASE_DEFAULT
          WHERE 
            m.agt_member_id = @id
        `);

      if (memberDataResult.recordset.length === 0) {
        return res
          .status(404)
          .json({ message: "Member not found in agt_member table." });
      }

      const memberData = memberDataResult.recordset[0];

      // 2. ใช้ข้อมูลชื่อเต็ม (agt_position_name) ในการ INSERT
      await pool
        .request()
        .input("id", sql.NVarChar, id)
        .input("no", sql.NVarChar, Gen_Manu_mem_No)
        .input("nameEN", sql.NVarChar, memberData.agt_member_nameEN)
        .input("position", sql.NVarChar, memberData.agt_position_name) // <-- ใช้ชื่อเต็มแล้ว
        .input("shift", sql.NVarChar, memberData.agt_member_shift).query(`
          INSERT INTO Gen_Manu_Member (Gen_Manu_mem_Memid, Gen_Manu_mem_No, Gen_Manu_mem_NamEN, Gen_Manu_mem_Position, Gen_Manu_mem_Shift) 
          VALUES (@id, @no, @nameEN, @position, @shift)
        `);
    }

    res.status(200).json({ message: "Employee number updated successfully." });
  } catch (error) {
    console.error("Error in updateUserEmployeeNo:", error);
    res
      .status(500)
      .json({
        message: "Error updating employee number",
        error: error.message,
      });
  }
};


// =============================================================
// === ฟังก์ชันสำหรับค้นหา User จาก ID ===
// =============================================================
exports.findUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "กรุณาระบุรหัสพนักงาน" });
    }

    // 2. "รอ" ให้สัญญาณไฟเขียว (poolConnect) ทำงานเสร็จก่อน
    await poolConnect;

    // 3. เมื่อเชื่อมต่อสำเร็จแล้ว ก็สามารถใช้ "pool" ได้เลย
    const result = await pool
      .request()
      .input("employeeId", sql.VarChar, id)
      .query(
        "SELECT Gen_Manu_mem_NamEN, Gen_Manu_mem_No FROM Gen_Manu_Member WHERE Gen_Manu_mem_Memid = @employeeId"
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลพนักงาน" });
    }

    const user = result.recordset[0];

    res.status(200).json({
      fullName: user.Gen_Manu_mem_NamEN,
      userNumber: user.Gen_Manu_mem_No,
    });
  } catch (error) {
    console.error("Error in findUserById:", error); // เพิ่ม context ให้ error log
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};
