// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import controllers and middleware
const {
  authController,
  registerController,
  getEntity,
  getStudents,
  updateEntity,
} = require("./controllers/apiController");
const verifyToken = require("./middlewares/verifyToken");
const upload = require("./middlewares/imageUpload");

const app = express();
app.use(express.json());

// Serve static files from the uploads directory at /uploads route
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- CORS Configuration ---
// For debugging/dev: allow all origins (remove in production)
app.use(cors());
// For production, use below (set your origin instead of '*')
// app.use(cors({
//   origin: process.env.CLIENT_URL || "http://localhost:3000",
//   credentials: true,
// }));

// --- Simple Test Endpoint for Debugging ---
app.get("/test", (req, res) => {
  res.json({ msg: "ok", body: req.body });
});

// --- API Routes ---
app.post("/api/register", upload, registerController);
app.post("/api/auth", authController);
app.get("/api/entity", verifyToken, getEntity);
app.get("/api/students", verifyToken, getStudents);
app.put("/api/entity", verifyToken, upload, updateEntity);

// --- MongoDB Connection ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env!");
  process.exit(1);
}

async function connectToMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error(" Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}
connectToMongo();

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Try GET /test for connectivity check.`);
});
