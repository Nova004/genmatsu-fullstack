// backend/src/app.js
const express = require("express");
const cors = require("cors");
const authRoutes = require("./api/auth.routes");
const formRoutes = require("./api/form.routes");
const masterRoutes = require("./api/master.routes");
const userRoutes = require("./api/user.routes"); // นำเข้า user routes
const naclRoutes = require('./api/nacl.routes'); 

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/users", userRoutes); // <-- เหลือแค่บรรทัดนี้สำหรับ User


app.use('/api/nacl', naclRoutes); 


app.get("/", (req, res) => {
  res.send("Hello from organized Backend!");
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});