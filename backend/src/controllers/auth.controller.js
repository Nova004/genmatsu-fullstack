const { sql, poolPromise } = require("../db");
// const bcrypt = require('bcryptjs'); // ไม่ได้ใช้ bcrypt แล้ว สามารถลบออกได้
const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');

// ฟังก์ชันสำหรับเข้าสู่ระบบ (Login) ที่ปรับแก้สำหรับตาราง agt_member
const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    //console.log("Backend received:", { userId, password });

    const pool = await poolPromise;

    // 1. ค้นหาผู้ใช้ด้วย agt_member_id
    const result = await pool
      .request()
      .input("agt_member_id", sql.NVarChar, userId)
      .query("SELECT * FROM agt_member WHERE agt_member_id = @agt_member_id");

    if (result.recordset.length === 0) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
    const user = result.recordset[0];

    //console.log("Password from DB:", user.agt_member_password);
    //console.log("Password from Form:", password);

    // 2. เปรียบเทียบรหัสผ่านแบบตรงๆ (Plain Text Comparison)
    const isMatch = password === user.agt_member_password;

    if (!isMatch) {
      // รหัสผ่านไม่ตรงกัน
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // 3. ถ้ารหัสผ่านถูกต้อง: สร้าง JWT Token
    const payload = {
      user: {
        id: user.agt_member_id,
        name: user.agt_member_nameTH,
      },
    };

    // สร้าง Token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({
          message: "เข้าสู่ระบบสำเร็จ!",
          token: token,
          user: payload.user,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};

const getUserPhoto = (req, res) => {
  try {
    const userId = req.params.id; // ดึง id จาก URL ที่ส่งมา

    // สร้าง Path ไปยังไฟล์รูปภาพบน Network Share
    // **สำคัญ:** Node.js ที่รัน Backend ต้องมีสิทธิ์เข้าถึง Path นี้ได้
    const photoPath = path.join(
      "\\\\192.168.1.68",
      "PhotoHRC",
      `${userId}.jpg`
    );
    console.log("Attempting to access photo at:", photoPath);
    // ตรวจสอบว่ามีไฟล์รูปภาพจริงหรือไม่
    if (fs.existsSync(photoPath)) {
      
       console.log('File exists. Attempting to read file...');

      // อ่านไฟล์รูปภาพ
      const imageFile = fs.readFileSync(photoPath);

       console.log(`File read successfully. Size: ${imageFile.length} bytes.`);
      // แปลงเป็น Base64
      const base64Image = Buffer.from(imageFile).toString("base64");
      // ส่งกลับไปให้ Frontend
      res.status(200).json({
        imageData: `data:image/jpeg;base64,${base64Image}`,
      });
    } else {
      // ถ้าไม่พบรูปภาพ ส่ง 404
      res.status(404).json({ message: "Image not found." });
    }
  } catch (error) {
    console.error("Error fetching user photo:", error);
    res.status(500).json({ message: "Server error while fetching photo." });
  }
};

// ส่งออกเฉพาะฟังก์ชัน login
module.exports = {
  login,
  getUserPhoto,
};
