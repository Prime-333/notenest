const { google } = require("googleapis");
const stream = require("stream");

// Google Service Account Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({
  version: "v3",
  auth,
});

// Upload file to Google Drive
const uploadFile = async (file) => {
  try {
    if (!file) {
      throw new Error("No file provided for upload");
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [process.env.DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
      fields: "id, name",
    });

    const fileId = response.data.id;

    // Make uploaded file public
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return {
      fileId,
      fileUrl: `https://drive.google.com/uc?id=${fileId}`,
    };
  } catch (error) {
    console.error("❌ Drive Upload Error:", error.message);
    throw new Error("Failed to upload file to Google Drive");
  }
};

// Delete file from Google Drive
const deleteFile = async (fileId) => {
  try {
    if (!fileId) return;

    await drive.files.delete({
      fileId,
    });

    console.log("🗑 File deleted from Google Drive:", fileId);
  } catch (error) {
    console.error("❌ Drive Delete Error:", error.message);
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};