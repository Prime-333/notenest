require("dotenv").config({ path: __dirname + "/.env" });

const cors = require("cors");
const express = require("express");

const connectDB = require("./config/db");
const { loadSavedGoogleToken } = require("./utils/googleOAuth");
const { clerkMiddleware } = require("@clerk/express");

const healthRoutes = require("./routes/health.route");
const protectedRoutes = require("./routes/protected.route");
const authRoutes = require("./routes/auth.route");
const notesRoutes = require("./routes/notes.route");
const adminRoutes = require("./routes/admin.route");
const googleAuthRoutes = require("./routes/googleAuth.route");

const errorHandler = require("./middlewares/error.middleware");

const app = express();

require("./models/User.model");
require("./models/GoogleToken.model");

// ----------------------
// Startup DB + Google Token Load
// ----------------------
(async () => {
  try {
    await connectDB();
    await loadSavedGoogleToken();
    console.log("🚀 Server Ready with Google Drive OAuth");
  } catch (error) {
    console.error("❌ Startup Error:", error.message);
  }
})();

app.use(express.json());

// ----------------------
// CORS Configuration
// ----------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://notenest-sigma-neon.vercel.app",
  "https://notenest.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS Blocked Origin:", origin);
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

// ----------------------
// Request Logger (Debug)
// ----------------------
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl}`);
  next();
});

// ----------------------
// Clerk Middleware
// ----------------------
app.use(clerkMiddleware());

// ----------------------
// Root Route
// ----------------------
app.get("/", (req, res) => {
  res.send("NoteNest backend is running");
});

// ----------------------
// Routes
// ----------------------
app.use("/", healthRoutes);
app.use("/", protectedRoutes);
app.use("/", authRoutes);
app.use("/", notesRoutes);
app.use("/", adminRoutes);
app.use("/", googleAuthRoutes);

// ----------------------
// 404 Route
// ----------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ----------------------
// Global Error Handler
// ----------------------
app.use(errorHandler);

module.exports = app;