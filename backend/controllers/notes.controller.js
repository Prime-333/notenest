const { deleteFileFromDrive, uploadFileToDrive } = require("../services/drive.service");
const Note = require("../models/Note.model");
const User = require("../models/User.model");

const asyncHandler = require("../middlewares/asyncHandler");

/*
---------------------------------------
Upload Note
---------------------------------------
*/
exports.uploadNote = asyncHandler(async (req, res) => {

  const { title, description, branch, semester, subject, noteType } = req.body;
  

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const { userId: clerkId } = req.auth();

  const user = await User.findOne({ clerkId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found. Please sync your account first.",
    });
  }

  const driveData = await uploadFileToDrive(req.file);

  const driveFileId = driveData.fileId;
  const fileUrl = driveData.fileUrl;

  const note = await Note.create({
    title,
    description,
    branch,
    semester,
    subject,
    type: noteType,
    uploadedBy: user._id,
    driveFileId,
    fileUrl,
  });

  res.status(201).json({
    success: true,
    message: "Note uploaded successfully",
    note,
  });
});

/*
---------------------------------------
Get All Notes
---------------------------------------
*/
exports.getAllNotes = asyncHandler(async (req, res) => {
  const { branch, semester, subject, type, search, sort } = req.query;

  let filter = { isApproved: true };

  if (branch) filter.branch = branch;
  if (semester) filter.semester = Number(semester);
  if (subject) filter.subject = subject;
  if (type) filter.type = type;
  if (search) filter.$text = { $search: search };

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  let sortOption = { createdAt: -1 };
  if (sort === "downloads") sortOption = { downloads: -1 };
  else if (sort === "likes") sortOption = { likes: -1 };
  else if (sort === "views") sortOption = { views: -1 };

  const totalNotes = await Note.countDocuments(filter);

  const notes = await Note.find(filter)
    .populate("uploadedBy", "fullName profileImage clerkId")
    .sort(sortOption)
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
Get Trending Notes
---------------------------------------
*/
exports.getTrendingNotes = asyncHandler(async (req, res) => {
  const notes = await Note.aggregate([
    { $match: { isApproved: true } },
    {
      $addFields: {
        score: { $add: ["$views", "$downloads", "$likes"] },
      },
    },
    { $sort: { score: -1 } },
    { $limit: 8 },
    {
      $lookup: {
        from: "users",
        localField: "uploadedBy",
        foreignField: "_id",
        as: "uploadedBy",
      },
    },
    { $unwind: { path: "$uploadedBy", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        title: 1,
        description: 1,
        branch: 1,
        semester: 1,
        subject: 1,
        fileUrl: 1,
        driveFileId: 1,
        views: 1,
        downloads: 1,
        likes: 1,
        likedBy: 1,
        createdAt: 1,
        score: 1,
        "uploadedBy.fullName": 1,
        "uploadedBy.profileImage": 1,
        "uploadedBy.clerkId": 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    notes,
  });
});

/*
---------------------------------------
Get My Uploaded Notes
---------------------------------------
*/
exports.getMyNotes = asyncHandler(async (req, res) => {
  const { userId: clerkId } = req.auth();

  const user = await User.findOne({ clerkId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const notes = await Note.find({ uploadedBy: user._id })
    .populate("uploadedBy", "fullName profileImage clerkId")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    notes,
  });
});

/*
---------------------------------------
Get Bookmarked Notes
---------------------------------------
*/
exports.getBookmarkedNotes = asyncHandler(async (req, res) => {
  const { userId: clerkId } = req.auth();

  const user = await User.findOne({ clerkId }).populate({
    path: "bookmarks",
    populate: { path: "uploadedBy", select: "fullName profileImage" },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    notes: user.bookmarks,
  });
});

/*
---------------------------------------
Increment Views
---------------------------------------
*/
exports.incrementViews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const note = await Note.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
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
    views: note.views,
  });
});

/*
---------------------------------------
Increment Downloads
---------------------------------------
*/
exports.incrementDownloads = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const note = await Note.findByIdAndUpdate(
    id,
    { $inc: { downloads: 1 } },
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
    downloads: note.downloads,
  });
});

/*
---------------------------------------
Toggle Like
---------------------------------------
*/
exports.toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: clerkId } = req.auth();

  const note = await Note.findById(id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: "Note not found",
    });
  }

  const alreadyLiked = note.likedBy.includes(clerkId);

  if (alreadyLiked) {
    note.likedBy.pull(clerkId);
    note.likes = Math.max(0, note.likes - 1);
  } else {
    note.likedBy.push(clerkId);
    note.likes += 1;
  }

  await note.save();

  res.status(200).json({
    success: true,
    likes: note.likes,
    isLiked: !alreadyLiked,
  });
});

/*
---------------------------------------
Toggle Bookmark
---------------------------------------
*/
exports.toggleBookmark = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: clerkId } = req.auth();

  const user = await User.findOne({ clerkId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const isBookmarked = user.bookmarks.includes(id);

  if (isBookmarked) {
    user.bookmarks.pull(id);
  } else {
    user.bookmarks.push(id);
  }

  await user.save();

  res.status(200).json({
    success: true,
    isBookmarked: !isBookmarked,
  });
});

/*
---------------------------------------
Report Note with Reason
---------------------------------------
*/
exports.reportNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const { userId: clerkId } = req.auth();

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: "Please provide a reason for reporting",
    });
  }

  const note = await Note.findById(id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: "Note not found",
    });
  }

  const alreadyReported = note.reports.some((r) => r.userId === clerkId);

  if (alreadyReported) {
    return res.status(400).json({
      success: false,
      message: "You have already reported this note",
    });
  }

  note.reports.push({ userId: clerkId, reason });
  await note.save();

  res.status(200).json({
    success: true,
    message: "Note reported successfully",
  });
});

/*
---------------------------------------
Delete My Note
---------------------------------------
*/
exports.deleteMyNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: clerkId } = req.auth();

  const user = await User.findOne({ clerkId });
  const note = await Note.findById(id);

  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }

  if (note.uploadedBy.toString() !== user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only delete your own notes" });
  }

  try {
    const { deleteFileFromDrive } = require("../services/drive.service");
    await deleteFileFromDrive(note.driveFileId);
  } catch (err) {
    console.error("Drive delete error:", err.message);
  }

  await Note.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: "Note deleted successfully" });
});