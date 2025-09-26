const { sql, pool, poolConnect } = require("../db");
// const bcrypt = require('bcryptjs'); // ไม่ได้ใช้ bcrypt แล้ว สามารถลบออกได้
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    // === 2. รอให้การเชื่อมต่อเสร็จสมบูรณ์ โดยใช้ poolConnect ===
    await poolConnect;

    // 3. ค้นหาผู้ใช้ด้วย agt_member_id (ตอนนี้เราใช้ pool ที่พร้อมใช้งานแล้ว)
    const result = await pool
      .request()
      .input("agt_member_id", sql.NVarChar, userId)
      .query("SELECT agt_member_id, agt_member_password, agt_member_nameTH, agt_member_nameEN, agt_member_email, agt_member_position, agt_member_section, agt_member_shift, agt_status_job FROM agt_member WHERE agt_member_id = @agt_member_id");

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
      },
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "default_secret", // ควรมี JWT_SECRET ในไฟล์ .env
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ!",
      token: token,
      user: payload.user,
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
