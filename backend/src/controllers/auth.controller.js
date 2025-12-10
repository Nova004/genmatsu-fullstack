// backend/src/controllers/auth.controller.js

// ✅ แก้ไขบรรทัดนี้: เพิ่ม 'pool' กลับเข้ามาครับ
const { sql, pool, poolConnect } = require("../db");

const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// ----------------------------------------------------------------
// 1. ฟังก์ชัน Login
// ----------------------------------------------------------------
const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    // รอให้ Database เชื่อมต่อเสร็จก่อน
    await poolConnect;

    // ใช้ 'pool' ยิง Query
    const result = await pool
      .request()
      .input("agt_member_id", sql.NVarChar, userId).query(`
      SELECT 
          a.agt_member_id, 
          a.agt_member_password, 
          a.agt_member_nameTH, 
          a.agt_member_nameEN, 
          a.agt_member_email, 
          p.agt_position_name AS agt_member_position, 
          s.name_fullsection AS agt_member_section, 
          a.agt_member_shift, 
          a.agt_status_job,
          m.LV_Approvals,
          m.Gen_Manu_mem_No
      FROM 
          AGT_SMART_SY.dbo.agt_member AS a
      -- Join เดิม (LV_Approvals)
      LEFT JOIN 
          AGT_SMART_SY.dbo.Gen_Manu_Member AS m 
          ON a.agt_member_id COLLATE DATABASE_DEFAULT = m.Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT
      
      -- Join ใหม่ (เอาชื่อตำแหน่ง)
      LEFT JOIN 
          AGT_SMART_SY.dbo.agt_position AS p 
          ON a.agt_member_position COLLATE DATABASE_DEFAULT = p.agt_position_id COLLATE DATABASE_DEFAULT

      LEFT JOIN 
          AGT_SMART_SY.dbo.agt_section AS s 
          ON a.agt_member_section COLLATE DATABASE_DEFAULT = s.id_section COLLATE DATABASE_DEFAULT
          
      WHERE 
          a.agt_member_id COLLATE DATABASE_DEFAULT = @agt_member_id COLLATE DATABASE_DEFAULT
    `);

    if (result.recordset.length === 0) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
    const user = result.recordset[0];

    // ตรวจสอบรหัสผ่าน
    if (password !== user.agt_member_password) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // สร้าง Token
    const payload = {
      user: {
        id: user.agt_member_id,
        username: user.agt_member_nameTH,
        email: user.agt_member_email,
        nameTH: user.agt_member_nameTH,
        nameEN: user.agt_member_nameEN,
        position: user.agt_member_position,
        section: user.agt_member_section,
        LV_Approvals: user.LV_Approvals,
        shift: user.agt_member_shift,
        statusJob: user.agt_status_job,
        Gen_Manu_mem_No: user.Gen_Manu_mem_No,
      },
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ!",
      token: token,
      user: payload.user,
    });
  } catch (error) {
    console.error("!!! SERVER ERROR DURING LOGIN !!!", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};

// ----------------------------------------------------------------
// 2. ฟังก์ชัน GetUserPhoto (ดึงรูปจาก Network Drive)
// ----------------------------------------------------------------
const getUserPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    // Path ของรูปภาพ
    const photoPath = `\\\\192.168.1.68\\PhotoHRC\\${id}.jpg`;

    // เช็คว่ามีไฟล์จริงไหม
    if (fs.existsSync(photoPath)) {
      // ส่งไฟล์รูปกลับไป
      res.sendFile(photoPath);
    } else {
      res.status(404).send("Image not found");
    }
  } catch (error) {
    console.error("Error fetching user photo:", error);
    res.status(500).send("Server error");
  }
};

// Export
module.exports = {
  login,
  getUserPhoto,
};
