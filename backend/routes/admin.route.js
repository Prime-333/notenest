const express = require("express");
const router = express.Router();

const isAdmin = require("../middlewares/admin.middleware");
const verifyAdminToken = require("../middlewares/adminToken.middleware");

const {
  adminLogin,
  getDashboardStats,
  getAnalytics,
  getReportedNotes,
  getAllNotesAdmin,
  approveNote,
  deleteNote,
  getAllUsers,
  deactivateUser,
  reactivateUser,
  changeUserRole,
  deleteUser,
  clearReports,
} = require("../controllers/admin.controller");

// ─────────────────────────────────────────────────
// Public: Admin login (no Clerk, no token needed)
// ─────────────────────────────────────────────────
router.post("/admin/login", adminLogin);

// ─────────────────────────────────────────────────
// Protected: all routes below require admin JWT
// ─────────────────────────────────────────────────

// Dashboard & Analytics
router.get("/admin/stats",     verifyAdminToken, getDashboardStats);
router.get("/admin/analytics", verifyAdminToken, getAnalytics);

// Notes
router.get("/admin/notes",                    verifyAdminToken, getAllNotesAdmin);
router.get("/admin/reported",                 verifyAdminToken, getReportedNotes);
router.delete("/admin/notes/:id",             verifyAdminToken, deleteNote);
router.patch("/admin/notes/:id/approve",      verifyAdminToken, approveNote);
router.patch("/admin/notes/:id/clear-reports",verifyAdminToken, clearReports);

// Users
router.get("/admin/users",                    verifyAdminToken, getAllUsers);
router.patch("/admin/users/:id/deactivate",   verifyAdminToken, deactivateUser);
router.patch("/admin/users/:id/reactivate",   verifyAdminToken, reactivateUser);
router.patch("/admin/users/:id/role",         verifyAdminToken, changeUserRole);
router.delete("/admin/users/:id",             verifyAdminToken, deleteUser);

module.exports = router;
