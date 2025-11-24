// backend/src/app.js
const express = require("express");
const cors = require("cors");
const config = require("./config/env"); // Import config

const authRoutes = require("./api/auth.routes");
const formRoutes = require("./api/form.routes");
const masterRoutes = require("./api/master.routes");
const userRoutes = require("./api/user.routes");
const naclRoutes = require('./api/nacl.routes'); 
const submissionRoutes = require('./api/submission.routes');
const approvalRoutes = require("./api/approval.routes");

const app = express();
const port = config.port; // Use port from config

app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/users", userRoutes);
app.use('/api/submissions', submissionRoutes);
app.use("/api/approvals", approvalRoutes); 
app.use('/api/nacl', naclRoutes); 

// Handle Unhandled Routes (Fixed: use app.use instead of app.all)
app.use((req, res, next) => {
  const AppError = require('./utils/AppError');
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
const globalErrorHandler = require('./middlewares/error.middleware');
app.use(globalErrorHandler);

app.get("/", (req, res) => {
  res.send("Hello from organized Backend!");
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});