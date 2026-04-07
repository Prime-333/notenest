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

const allowedOrigins = [
  "http://localhost:5173",
  "https://notenest-sigma-neon.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

// Clerk bypass for Google OAuth routes
app.use((req, res, next) => {
  if (req.path.startsWith("/auth/google")) {
    return next();
  }
  clerkMiddleware()(req, res, next);
});

app.get("/", (req, res) => {
  res.send("NoteNest backend is running");
});

app.use("/", healthRoutes);
app.use("/", protectedRoutes);
app.use("/", authRoutes);
app.use("/", notesRoutes);
app.use("/", adminRoutes);
app.use("/", googleAuthRoutes);

// 404 route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;