// backend/src/controllers/auth.controller.js

// ฟังก์ชันสำหรับจัดการ Logic การ Login
const login = (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password });

  if (email === 'admin@test.com' && password === '123456') {
    res.status(200).json({
      message: 'Login successful!',
      user: { email: email, name: 'Admin User' },
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// ฟังก์ชันสำหรับ Register (ทำเพิ่มในอนาคต)
const register = (req, res) => {
  // ... Logic การสมัครสมาชิก ...
};


// ส่งออกฟังก์ชันเพื่อให้ route เรียกใช้ได้
module.exports = {
  login,
  register,
};