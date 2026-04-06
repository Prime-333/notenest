const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");

const { oauth2Client, getAuthUrl, setOAuthCredentials } = require("../utils/googleOAuth");

const TOKEN_PATH = path.join(__dirname, "../config/google-tokens.json");

router.get("/auth/google", (req, res) => {
  const url = getAuthUrl();

  // TEMP DEBUG: print exact URL + exact redirect URI being used
  console.log("GOOGLE AUTH URL:", url);
  console.log("GOOGLE_REDIRECT_URI ENV:", process.env.GOOGLE_REDIRECT_URI);

  // TEMP DEBUG: show it in browser so we can inspect it
  res.send(`
    <h2>Google OAuth Debug</h2>
    <p><strong>GOOGLE_REDIRECT_URI:</strong> ${process.env.GOOGLE_REDIRECT_URI}</p>
    <p><strong>Generated Auth URL:</strong></p>
    <textarea style="width:100%;height:200px;">${url}</textarea>
    <br/><br/>
    <a href="${url}" target="_blank">Continue to Google</a>
  `);
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