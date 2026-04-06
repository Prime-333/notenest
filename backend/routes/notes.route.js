const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");

const {
  uploadNote,
  getAllNotes,
  getTrendingNotes,
  getMyNotes,
  getBookmarkedNotes,
  incrementViews,
  incrementDownloads,
  toggleLike,
  toggleBookmark,
  reportNote,
  deleteMyNote,
} = require("../controllers/notes.controller");

const upload = require("../middlewares/upload.middleware");

router.get("/notes/trending", getTrendingNotes);
router.get("/notes/my", requireAuth(), getMyNotes);
router.get("/notes/bookmarks", requireAuth(), getBookmarkedNotes);
router.get("/notes", getAllNotes);

router.post("/notes/upload", requireAuth(), upload.single("file"), uploadNote);
router.post("/notes/:id/view", incrementViews);
router.post("/notes/:id/download", incrementDownloads);
router.post("/notes/:id/toggle-like", requireAuth(), toggleLike);
router.post("/notes/:id/bookmark", requireAuth(), toggleBookmark);
router.post("/notes/:id/report", requireAuth(), reportNote);

router.delete("/notes/:id", requireAuth(), deleteMyNote);

module.exports = router;