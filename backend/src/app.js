const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
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

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
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
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// --- 2. แก้ไข Route Path (ต้องมี / นำหน้า) ---
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/users", userRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/nacl", naclRoutes);
app.use("/api/ironpowder", ironpowderRoutes);
app.use("/genmatsu/api/submissions/reports", reportRoutes);

// Error Handling
const errorMiddleware = require("./middlewares/error.middleware");
app.use(errorMiddleware);

// ✅ 6. เปลี่ยนจาก app.listen เป็น server.listen
const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  try {
    await poolPromise;
    console.log("Database Connected!");
    console.log("Socket.io is ready!");
  } catch (err) {
    console.error("Database Connection Failed! Bad Config: ", err);
  }
});