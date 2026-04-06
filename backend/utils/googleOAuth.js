const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

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

module.exports = {
  oauth2Client,
  getAuthUrl,
  setOAuthCredentials,
};