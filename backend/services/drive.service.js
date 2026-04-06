const { google } = require("googleapis");
const fs = require("fs");
const GoogleToken = require("../models/GoogleToken.model");
const { oauth2Client } = require("../utils/googleOAuth");

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

const loadGoogleToken = async () => {
  const tokenDoc = await GoogleToken.findOne().sort({ createdAt: -1 });

  if (!tokenDoc) {
    throw new Error("Google Drive is not connected. Please reconnect OAuth.");
  }

  oauth2Client.setCredentials({
    access_token: tokenDoc.access_token,
    refresh_token: tokenDoc.refresh_token,
    scope: tokenDoc.scope,
    token_type: tokenDoc.token_type,
    expiry_date: tokenDoc.expiry_date,
  });
};

const uploadToDrive = async (file) => {
  await loadGoogleToken();

  const response = await drive.files.create({
    requestBody: {
      name: file.originalname,
      parents: [process.env.DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    },
    fields: "id, webViewLink, webContentLink",
  });

  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return response.data;
};

const deleteFromDrive = async (fileId) => {
  await loadGoogleToken();
  await drive.files.delete({ fileId });
};

module.exports = {
  uploadToDrive,
  deleteFromDrive,
};