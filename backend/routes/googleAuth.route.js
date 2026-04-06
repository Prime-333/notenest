const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");

const { oauth2Client, getAuthUrl, setOAuthCredentials } = require("../utils/googleOAuth");

const TOKEN_PATH = path.join(__dirname, "../config/google-tokens.json");

router.get("/auth/google", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

router.get("/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code;

    const { tokens } = await oauth2Client.getToken(code);

    // Set tokens to OAuth client
    setOAuthCredentials(tokens);

    // Save tokens permanently
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

    res.send("Google Drive connected successfully");

  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).send("OAuth failed");
  }
});

module.exports = router;