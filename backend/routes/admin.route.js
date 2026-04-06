const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const isAdmin = require("../middlewares/admin.middleware");

const {
  getDashboardStats,
  getReportedNotes,
  getAllNotesAdmin,
  deleteNote,
  getAllUsers,
  deactivateUser,
  reactivateUser,
  clearReports,
} = require("../controllers/admin.controller");

router.get("/admin/stats", requireAuth(), isAdmin, getDashboardStats);
router.get("/admin/notes", requireAuth(), isAdmin, getAllNotesAdmin);
router.get("/admin/reported", requireAuth(), isAdmin, getReportedNotes);
router.delete("/admin/notes/:id", requireAuth(), isAdmin, deleteNote);
router.patch("/admin/notes/:id/clear-reports", requireAuth(), isAdmin, clearReports);
router.get("/admin/users", requireAuth(), isAdmin, getAllUsers);
router.patch("/admin/users/:id/deactivate", requireAuth(), isAdmin, deactivateUser);
router.patch("/admin/users/:id/reactivate", requireAuth(), isAdmin, reactivateUser);

module.exports = router;