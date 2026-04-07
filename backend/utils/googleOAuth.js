const { google } = require("googleapis");
const GoogleToken = require("../models/GoogleToken.model");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/*
---------------------------------------
Generate Google OAuth URL
---------------------------------------
*/
const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive"],
  });
};

/*
---------------------------------------
Set OAuth Credentials
---------------------------------------
*/
const setOAuthCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

/*
---------------------------------------
Load Saved Token From MongoDB
---------------------------------------
*/
const loadSavedGoogleToken = async () => {
  try {
    const savedToken = await GoogleToken.findOne();

    if (!savedToken) {
      console.log("⚠️ No saved Google token found in MongoDB");
      return;
    }

    oauth2Client.setCredentials({
      access_token: savedToken.access_token,
      refresh_token: savedToken.refresh_token,
      scope: savedToken.scope,
      token_type: savedToken.token_type,
      expiry_date: savedToken.expiry_date,
    });

    console.log("✅ Google OAuth token loaded from MongoDB");
  } catch (error) {
    console.error("❌ Failed to load Google token:", error.message);
  }
};

module.exports = {
  oauth2Client,
  getAuthUrl,
  setOAuthCredentials,
  loadSavedGoogleToken,
};