const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const { sql, poolPromise } = require("./db");

// Routes
const authRoutes = require("./api/auth.routes");
const userRoutes = require("./api/user.routes");
const masterRoutes = require("./api/master.routes");
const naclRoutes = require("./api/nacl.routes");
const formRoutes = require("./api/form.routes");
const submissionRoutes = require("./api/submission.routes");
const reportRoutes = require("./api/report.routes");
const approvalRoutes = require("./api/approval.routes");
const ironpowderRoutes = require("./api/ironpowder.routes");
const weightRoutes = require("./api/weight.routes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  path: "/api/socket.io", // ✅ Custom Path เพื่อให้ผ่าน Proxy ได้ (/genmatsu/api/socket.io -> /api/socket.io)
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// ... (ส่วน Middleware เดิมของคุณ) ...
const compression = require("compression"); // 👈 เพิ่ม
app.use(compression()); // 👈 เปิดใช้งาน Compression
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// --- 2. แก้ไข Route Path (ต้องมี / นำหน้า) ---
// --- 2. แก้ไข Route Path (รองรับทั้ง /api และ /genmatsu/api) ---
const routes = [
  { path: "/auth", route: authRoutes },
  { path: "/forms", route: formRoutes },
  { path: "/master", route: masterRoutes },
  { path: "/users", route: userRoutes },
  { path: "/submissions", route: submissionRoutes },
  { path: "/approvals", route: approvalRoutes },
  { path: "/nacl", route: naclRoutes },
  { path: "/ironpowder", route: ironpowderRoutes },
  { path: "/weights", route: weightRoutes },
];

routes.forEach(({ path, route }) => {
  app.use(`/api${path}`, route);           // รองรับ http://localhost:4000/api/...
  app.use(`/genmatsu/api${path}`, route);  // รองรับ http://server/genmatsu/api/... (กรณี Proxy ไม่ตัด Path)
});

// Report Route (Special Case - Moving to root level for cleaner API)
app.use("/genmatsu/api/reports", reportRoutes);
app.use("/api/reports", reportRoutes);

// Error Handling
const errorMiddleware = require("./middlewares/error.middleware");
app.use(errorMiddleware);

const cronService = require("./services/cron.service");

// ✅ 6. เปลี่ยนจาก app.listen เป็น server.listen
const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  try {
    await poolPromise;
    console.log("Database Connected!");
    console.log("Socket.io is ready!");

    // ⏰ Start Cron Scheduler
    cronService.init();

  } catch (err) {
    console.error("Database Connection Failed! Bad Config: ", err);
  }
});