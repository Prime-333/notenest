const { google } = require("googleapis");
const stream = require("stream");
const { oauth2Client } = require("../utils/googleOAuth");

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

/*
---------------------------------------
Upload File To Google Drive
---------------------------------------
*/
const uploadFileToDrive = async (file) => {
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

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

    return {
      fileId,
      fileUrl,
    };
  } catch (error) {
    console.error("❌ Drive Upload Error:", error.response?.data || error.message);
    throw new Error("Failed to upload file to Google Drive");
  }
};

/*
---------------------------------------
Delete File From Google Drive
---------------------------------------
*/
const deleteFileFromDrive = async (fileId) => {
  try {
    if (!fileId) return;

    await drive.files.delete({
      fileId,
    });

    console.log("🗑 File deleted from Google Drive:", fileId);
  } catch (error) {
    console.error("❌ Drive Delete Error:", error.response?.data || error.message);
  }
};

module.exports = {
  uploadFileToDrive,
  deleteFileFromDrive,
};