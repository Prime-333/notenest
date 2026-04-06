const { google } = require("googleapis");
const stream = require("stream");
const path = require("path");
const fs = require("fs");

const TOKEN_PATH = path.join(__dirname, "../config/google-tokens.json");

const getOAuthClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oauth2Client.setCredentials(tokens);
  }

  // auto save refreshed tokens
  oauth2Client.on("tokens", (tokens) => {
    const existing = fs.existsSync(TOKEN_PATH)
      ? JSON.parse(fs.readFileSync(TOKEN_PATH))
      : {};
    const updated = { ...existing, ...tokens };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(updated, null, 2));
    console.log("Tokens auto-refreshed and saved");
  });

  return oauth2Client;
};

const FOLDER_ID = process.env.DRIVE_FOLDER_ID;

exports.uploadFileToDrive = async (fileBuffer, fileName, mimeType) => {
  const auth = getOAuthClient();
  const drive = google.drive({ version: "v3", auth });

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [FOLDER_ID],
    },
    media: {
      mimeType: mimeType || "application/pdf",
      body: bufferStream,
    },
    fields: "id",
    uploadType: "multipart",
  });

  const fileId = response.data.id;

  drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  }).catch(console.error);

  return fileId;
};

exports.deleteFileFromDrive = async (fileId) => {
  const auth = getOAuthClient();
  const drive = google.drive({ version: "v3", auth });
  await drive.files.delete({ fileId });
};