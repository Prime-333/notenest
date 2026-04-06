const express = require("express");
const router = express.Router();

const {
  oauth2Client,
  getAuthUrl,
  setOAuthCredentials,
} = require("../utils/googleOAuth");

const GoogleToken = require("../models/GoogleToken.model");

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
    await GoogleToken.create({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
    });

    console.log("✅ Google OAuth token saved to MongoDB");

    res.send("Google Drive connected successfully");
  } catch (error) {
    console.error("Google OAuth Error:", error);
    res.status(500).send("Google OAuth failed");
  }
});

module.exports = router;