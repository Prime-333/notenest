const express = require("express");
const router = express.Router();

const {
  oauth2Client,
  getAuthUrl,
  setOAuthCredentials,
} = require("../utils/googleOAuth");

const GoogleToken = require("../models/GoogleToken.model");

/*
---------------------------------------
Redirect to Google OAuth
---------------------------------------
*/
router.get("/auth/google", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

/*
---------------------------------------
Google OAuth Callback
---------------------------------------
*/
router.get("/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("No code provided");
    }

    const { tokens } = await oauth2Client.getToken(code);

    console.log("🎯 Google Tokens Received:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    setOAuthCredentials(tokens);

    await GoogleToken.deleteMany({});
    await GoogleToken.create({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
    });

    console.log("✅ Google OAuth token saved to MongoDB");

    res.send("Google Drive connected successfully. You can close this tab now.");
  } catch (error) {
    console.error("❌ Google OAuth Error:", error.response?.data || error.message);
    res.status(500).send("Google OAuth failed");
  }
});

module.exports = router;