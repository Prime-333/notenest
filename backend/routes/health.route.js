const express = require("express");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      status: "OK",
      message: "Backend is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  })
);

module.exports = router;
