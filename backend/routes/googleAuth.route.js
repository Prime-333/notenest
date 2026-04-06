const express = require("express");
const router = express.Router();

/*
---------------------------------------
Google OAuth Disabled
---------------------------------------
Service Account is now used instead of OAuth
---------------------------------------
*/

router.get("/auth/google", (req, res) => {
  return res.status(410).json({
    success: false,
    message: "Google OAuth is disabled. NoteNest now uses Google Service Account.",
  });
});

router.get("/auth/google/callback", (req, res) => {
  return res.status(410).json({
    success: false,
    message: "Google OAuth callback is disabled. NoteNest now uses Google Service Account.",
  });
});

module.exports = router;