const { sql, pool, poolConnect } = require("../db");
// const bcrypt = require('bcryptjs'); // ไม่ได้ใช้ bcrypt แล้ว สามารถลบออกได้
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// (ใน auth.controller.js)

const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    // === 2. รอให้การเชื่อมต่อเสร็จสมบูรณ์ โดยใช้ poolConnect ===
    await poolConnect; // (โค้ดเดิมของคุณ - ถูกต้อง)

    // 🚀 [แก้ไข] เปลี่ยน Query ให้ JOIN 2 ตาราง
    const result = await pool
      .request()
      .input("agt_member_id", sql.NVarChar, userId).query(`
        SELECT 
            a.agt_member_id, 
            a.agt_member_password, 
            a.agt_member_nameTH, 
            a.agt_member_nameEN, 
            a.agt_member_email, 
            a.agt_member_position, 
            a.agt_member_section, 
            a.agt_member_shift, 
            a.agt_status_job,
            m.LV_Approvals -- 👈 [ใหม่] ดึง LV มาด้วย
        FROM 
            AGT_SMART_SY.dbo.agt_member AS a
        LEFT JOIN 
            AGT_SMART_SY.dbo.Gen_Manu_Member AS m 
            -- (แก้ Collate Conflict ที่นี่ด้วย)
            ON a.agt_member_id COLLATE DATABASE_DEFAULT = m.Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT
        WHERE 
            a.agt_member_id COLLATE DATABASE_DEFAULT = @agt_member_id COLLATE DATABASE_DEFAULT
      `);

    if (result.recordset.length === 0) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
    const user = result.recordset[0];

    // 4. เปรียบเทียบรหัสผ่าน
    if (password !== user.agt_member_password) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // 5. สร้าง JWT Token
    const payload = {
      user: {
        id: user.agt_member_id,
        username: user.agt_member_nameTH,
        email: user.agt_member_email,
        nameTH: user.agt_member_nameTH,
        nameEN: user.agt_member_nameEN,
        LV_Approvals: user.LV_Approvals, // 👈 [ใหม่] เพิ่ม LV เข้าไปใน Payload
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
      user: payload.user, // 👈 (Frontend จะได้รับ user object ที่มี LV แล้ว)
    });
  } catch (error) {
    console.error("!!! SERVER ERROR DURING LOGIN !!!");
    console.error("Error Details:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};

const getUserPhoto = async (req, res) => {
  try {
    // ... (โค้ดส่วนนี้เหมือนเดิม แต่เพิ่ม await poolConnect เข้าไปด้วยจะปลอดภัยที่สุด)
    await poolConnect;
    const userId = req.params.id;
    const photoPath = path.join(
      "\\\\192.168.1.68",
      "PhotoHRC",
      `${userId}.jpg`
    );

    if (fs.existsSync(photoPath)) {
      const imageFile = fs.readFileSync(photoPath);
      const base64Image = Buffer.from(imageFile).toString("base64");
      res.status(200).json({
        imageData: `data:image/jpeg;base64,${base64Image}`,
      });
    } else {
      res.status(404).json({ message: "Image not found." });
    }
  } catch (error) {
    console.error("Error fetching user photo:", error);
    res.status(500).json({ message: "Server error while fetching photo." });
  }
};

module.exports = {
  login,
  getUserPhoto,
};
