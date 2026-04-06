const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const TOKEN_PATH = path.join(__dirname, "../config/google-tokens.json");

/**
 * Generate Google OAuth login URL
 */
const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });
};

/**
 * Set credentials manually
 */
const setOAuthCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

/**
 * Load saved tokens when server starts
 */
if (fs.existsSync(TOKEN_PATH)) {
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oauth2Client.setCredentials(tokens);
}

module.exports = {
  oauth2Client,
  getAuthUrl,
  setOAuthCredentials,
};