// backend/src/app.js
const express = require("express");
const cors = require("cors");
const authRoutes = require("./api/auth.routes");
const formRoutes = require("./api/form.routes"); 

const app = express();
const port = 4000; // แนะนำให้ใช้ port 4000 ตาม package.json ของคุณ

app.use(cors());
app.use(express.json());

// api ของเดิมสำหรับ login
app.use("/api", authRoutes);

// api ใหม่สำหรับจัดการฟอร์ม
app.use("/api", formRoutes); 

app.get("/", (req, res) => {
  res.send("Hello from organized Backend!");
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});