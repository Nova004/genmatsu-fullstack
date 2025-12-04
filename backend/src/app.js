const express = require("express");
const cors = require("cors");
const config = require("./config/env");

// --- 1. แก้ไข Import (ต้องมี ./ นำหน้า) ---
// ตรวจสอบดูว่าโฟลเดอร์ของคุณชื่อ "api" หรือ "routes" นะครับ
// ถ้าโฟลเดอร์ชื่อ api ใช้แบบนี้:
const authRoutes = require("./api/auth.routes");
const formRoutes = require("./api/form.routes");
const masterRoutes = require("./api/master.routes");
const userRoutes = require("./api/user.routes");
const naclRoutes = require('./api/nacl.routes'); 
const submissionRoutes = require('./api/submission.routes');
const approvalRoutes = require("./api/approval.routes");

const app = express();
const port = config.port;

app.use(cors());
app.use(express.json());

// --- 2. แก้ไข Route Path (ต้องมี / นำหน้า) ---
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/users", userRoutes);
app.use('/api/submissions', submissionRoutes);
app.use("/api/approvals", approvalRoutes); 
app.use('/api/nacl', naclRoutes); 

// Handle Unhandled Routes
app.use((req, res, next) => {
  // ตรวจสอบว่าไฟล์ AppError อยู่ที่ไหน (ถ้าไม่มีไฟล์นี้จะ error นะครับ)
  try {
      const AppError = require('./utils/AppError');
      next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  } catch (err) {
      // กันเหนียว เผื่อหาไฟล์ AppError ไม่เจอ
      res.status(404).json({ status: 'fail', message: `Can't find ${req.originalUrl} on this server!` });
  }
});

// Global Error Handler
// ตรวจสอบว่าไฟล์นี้มีอยู่จริงไหม
try {
    const globalErrorHandler = require('./middlewares/error.middleware');
    app.use(globalErrorHandler);
} catch (err) {
    console.warn("Warning: Error middleware not found, using default.");
}

app.get("/", (req, res) => {
  res.send("Hello from organized Backend!");
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});