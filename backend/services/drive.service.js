const { google } = require("googleapis");
const fs = require("fs");
const stream = require("stream");
const { oauth2Client } = require("../utils/googleOAuth");

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

/**
 * Convert buffer to readable stream
 */
const bufferToStream = (buffer) => {
  const readable = new stream.PassThrough();
  readable.end(buffer);
  return readable;
};

/**
 * Upload file to Google Drive
 */
const uploadFileToDrive = async (file) => {
  try {
    if (!file) {
      throw new Error("No file received in uploadFileToDrive");
    }

    const fileMetadata = {
      name: file.originalname || "uploaded-file",
      parents: [process.env.DRIVE_FOLDER_ID],
    };

    let fileStream;

    // Case 1: file.buffer exists (memory storage / deployed env)
    if (file.buffer) {
      fileStream = bufferToStream(file.buffer);
    }
    // Case 2: file.path exists (disk storage / local env)
    else if (file.path) {
      fileStream = fs.createReadStream(file.path);
    } else {
      throw new Error("Neither file.buffer nor file.path is available");
    }

    const media = {
      mimeType: file.mimetype || "application/octet-stream",
      body: fileStream,
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

    // Delete temp file only if it exists
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

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
    await drive.files.delete({ fileId });
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