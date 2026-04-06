const Note = require("../models/Note.model");
const User = require("../models/User.model");
const asyncHandler = require("../middlewares/asyncHandler");
const { deleteFileFromDrive } = require("../services/drive.service");

/*
---------------------------------------
Get Dashboard Stats
---------------------------------------
*/
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const totalNotes = await Note.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalReported = await Note.countDocuments({
    "reports.0": { $exists: true },
  });

  const totalDownloads = await Note.aggregate([
    { $group: { _id: null, total: { $sum: "$downloads" } } },
  ]);

  const totalViews = await Note.aggregate([
    { $group: { _id: null, total: { $sum: "$views" } } },
  ]);

  const totalLikes = await Note.aggregate([
    { $group: { _id: null, total: { $sum: "$likes" } } },
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalNotes,
      totalUsers,
      totalReported,
      totalDownloads: totalDownloads[0]?.total || 0,
      totalViews: totalViews[0]?.total || 0,
      totalLikes: totalLikes[0]?.total || 0,
    },
  });
});

/*
---------------------------------------
Get All Reported Notes
---------------------------------------
*/
exports.getReportedNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({
    "reports.0": { $exists: true },
  })
    .populate("uploadedBy", "fullName email profileImage")
    .sort({ "reports.length": -1 })
    .lean();

  // add report count to each note
  const notesWithCount = notes.map((note) => ({
    ...note,
    reportCount: note.reports.length,
  }));

  res.status(200).json({
    success: true,
    notes: notesWithCount,
  });
});

/*
---------------------------------------
Get All Notes (admin view - all notes)
---------------------------------------
*/
exports.getAllNotesAdmin = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const totalNotes = await Note.countDocuments();

  const notes = await Note.find()
    .populate("uploadedBy", "fullName email profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    totalNotes,
    currentPage: page,
    totalPages: Math.ceil(totalNotes / limit),
    notes,
  });
});

/*
---------------------------------------
Delete Note
---------------------------------------
*/
exports.deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const note = await Note.findById(id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: "Note not found",
    });
  }

  // delete from Google Drive
  try {
    await deleteFileFromDrive(note.driveFileId);
  } catch (err) {
    console.error("Drive delete error:", err.message);
    // continue even if drive delete fails
  }

  await Note.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Note deleted successfully",
  });
});

/*
---------------------------------------
Get All Users
---------------------------------------
*/
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const totalUsers = await User.countDocuments();

  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    totalUsers,
    currentPage: page,
    totalPages: Math.ceil(totalUsers / limit),
    users,
  });
});

/*
---------------------------------------
Deactivate User
---------------------------------------
*/
exports.deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: `User ${user.fullName} has been deactivated`,
  });
});

/*
---------------------------------------
Reactivate User
---------------------------------------
*/
exports.reactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: `User ${user.fullName} has been reactivated`,
  });
});

/*
---------------------------------------
Clear Reports on a Note
---------------------------------------
*/
exports.clearReports = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const note = await Note.findByIdAndUpdate(
    id,
    { $set: { reports: [] } },
    { new: true }
  );

  if (!note) {
    return res.status(404).json({
      success: false,
      message: "Note not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Reports cleared successfully",
  });
});