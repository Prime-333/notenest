const express = require("express");
const Router = express.Router();

const fs = require("fs");
const path = require("path");

const { oauth2Client, getAuthUrl, setOAuthCredentials } = require("../utils/googleOAuth");
const GoogleToken = require("../models/GoogleToken.model");

const router = express.Router();

/**
 * Redirect user to Google OAuth
 */
router.get("/auth/google", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

/**
 * Google OAuth callback
 */
router.get("/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("No code provided");

    const { tokens } = await oauth2Client.getToken(code);

    setOAuthCredentials(tokens);

    // Save latest token in MongoDB
    await GoogleToken.deleteMany({});
    await GoogleToken.create(tokens);

    res.send("Google Drive connected successfully");
  } catch (error) {
    console.error("Google OAuth Error:", error);
    res.status(500).send("Google OAuth failed");
  }
});

module.exports = router;