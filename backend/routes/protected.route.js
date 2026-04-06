const express = require("express");
const { requireAuth } = require("@clerk/express");

const router = express.Router();

router.get(
  "/protected",
  requireAuth({ unauthenticatedResponse: "json" }),
  (req, res) => {
    res.json({
      success: true,
      message: "Protected route working",
      auth: req.auth(),
    });
  }
);

module.exports = router;