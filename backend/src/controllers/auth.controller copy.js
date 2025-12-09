// backend/src/controllers/auth.controller.js
const { sql, poolConnect } = require("../db");
const jwt = require("jsonwebtoken");
const fs = require("fs"); // ✅ ต้องใช้ fs เพื่ออ่านไฟล์
const path = require("path"); // ✅ ต้องใช้ path จัดการที่อยู่ไฟล์
require("dotenv").config();

// ----------------------------------------------------------------
// 1. ฟังก์ชัน Login (เหมือนเดิม)
// ----------------------------------------------------------------
const login = async (req, res) => {
  try {
    const { userId, password } = req.body;
    await poolConnect;

    const result = await pool
      .request()
      .input("agt_member_id", sql.NVarChar, userId).query(`
        SELECT 
            a.agt_member_id, a.agt_member_password, a.agt_member_nameTH, 
            a.agt_member_nameEN, a.agt_member_email, m.LV_Approvals 
        FROM AGT_SMART_SY.dbo.agt_member AS a
        LEFT JOIN AGT_SMART_SY.dbo.Gen_Manu_Member AS m 
            ON a.agt_member_id COLLATE DATABASE_DEFAULT = m.Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT
        WHERE a.agt_member_id COLLATE DATABASE_DEFAULT = @agt_member_id COLLATE DATABASE_DEFAULT
      `);

    if (result.recordset.length === 0)
      return res.status(401).json({ message: "ไม่พบผู้ใช้งาน" });
    const user = result.recordset[0];

    if (password !== user.agt_member_password)
      return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    const payload = {
      user: {
        id: user.agt_member_id,
        username: user.agt_member_nameTH,
        nameEN: user.agt_member_nameEN,
        LV_Approvals: user.LV_Approvals,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Success", token, user: payload.user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ----------------------------------------------------------------
// 2. ฟังก์ชัน GetUserPhoto (อ่านจาก Drive 192.168.1.68)
// ⭐️ แก้ไขให้ส่งเป็นไฟล์รูป เพื่อให้ <img src> ทำงานได้
// ----------------------------------------------------------------
const getUserPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    // กำหนด Path รูปภาพ (ตามที่คุณให้มา)
    // หมายเหตุ: ในเครื่อง Server ที่รัน Node.js ต้องมองเห็น Path นี้ด้วยนะครับ
    const photoPath = `\\\\192.168.1.68\\PhotoHRC\\${id}.jpg`;

    // เช็คว่ามีไฟล์อยู่จริงไหม
    if (fs.existsSync(photoPath)) {
      // ✅ ส่งไฟล์รูปกลับไปตรงๆ (Browser จะเข้าใจว่าเป็นรูปภาพ)
      res.sendFile(photoPath);
    } else {
      // ถ้าไม่เจอ ส่ง 404 (Frontend จะไปโชว์รูป Default เอง)
      res.status(404).send("Image not found");
    }
  } catch (error) {
    console.error("Error fetching user photo:", error);
    res.status(500).send("Server error");
  }
};

// ----------------------------------------------------------------
// 3. Export (สำคัญมาก ห้ามลืม!)
// ----------------------------------------------------------------
module.exports = {
  login,
  getUserPhoto,
};
