const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const { oauth2Client } = require("../utils/googleOAuth");

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

/**
 * Upload file to Google Drive
 */
const uploadFileToDrive = async (file) => {
  try {
    const fileMetadata = {
      name: file.originalname,
      parents: [process.env.DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id, webViewLink, webContentLink",
    });

    // Make file public
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Delete local temp file after upload
    fs.unlinkSync(file.path);

    return {
      fileId: response.data.id,
      fileUrl: response.data.webViewLink,
      downloadUrl: response.data.webContentLink,
    };
  } catch (error) {
    console.error("❌ Drive Upload Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete file from Google Drive
 */
const deleteFileFromDrive = async (fileId) => {
  try {
    await drive.files.delete({
      fileId,
    });
    console.log("🗑️ File deleted from Google Drive");
  } catch (error) {
    console.error("❌ Drive Delete Error:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  uploadFileToDrive,
  deleteFileFromDrive,
};