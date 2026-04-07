const Note = require("../models/Note.model");
const User = require("../models/User.model");
const asyncHandler = require("../middlewares/asyncHandler");
const { deleteFileFromDrive } = require("../services/drive.service");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "notenest-admin-super-secret-2024";

/* ─────────────────────────────────────────────────
   Admin Login (standalone — no Clerk required)
───────────────────────────────────────────────── */
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied. Admins only." });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: "Your account has been deactivated" });
  }

  // If admin has a password hash stored, verify it; otherwise allow env-based master password
  let passwordValid = false;

  if (user.passwordHash) {
    passwordValid = await bcrypt.compare(password, user.passwordHash);
  } else {
    // fallback: check against ADMIN_MASTER_PASSWORD env var
    const masterPassword = process.env.ADMIN_MASTER_PASSWORD || "admin@notenest2024";
    passwordValid = password === masterPassword;
  }

  if (!passwordValid) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user._id, clerkId: user.clerkId, role: "admin" },
    ADMIN_JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.status(200).json({
    success: true,
    token,
    admin: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
    },
  });
});

/* ─────────────────────────────────────────────────
   Dashboard Stats
───────────────────────────────────────────────── */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalNotes,
    totalUsers,
    totalReported,
    downloadsAgg,
    viewsAgg,
    likesAgg,
    topSubjects,
    topNotes,
    branchDistribution,
    recentNotes,
    recentUsers,
  ] = await Promise.all([
    Note.countDocuments(),
    User.countDocuments(),
    Note.countDocuments({ "reports.0": { $exists: true } }),
    Note.aggregate([{ $group: { _id: null, total: { $sum: "$downloads" } } }]),
    Note.aggregate([{ $group: { _id: null, total: { $sum: { $size: "$viewedBy" } } } }]),
    Note.aggregate([{ $group: { _id: null, total: { $sum: "$likes" } } }]),
    Note.aggregate([
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    Note.find().sort({ likes: -1 }).limit(5).select("title likes").lean(),
    Note.aggregate([
      { $group: { _id: "$branch", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Note.find().sort({ createdAt: -1 }).limit(5).populate("uploadedBy", "fullName").select("title createdAt uploadedBy").lean(),
    User.find().sort({ createdAt: -1 }).limit(5).select("fullName createdAt").lean(),
  ]);

  // Merge recent activity feed
  const recentActivity = [
    ...recentNotes.map((n) => ({
      message: `"${n.title}" uploaded by ${n.uploadedBy?.fullName || "unknown"}`,
      createdAt: n.createdAt,
      type: "note",
    })),
    ...recentUsers.map((u) => ({
      message: `${u.fullName} joined NoteNest`,
      createdAt: u.createdAt,
      type: "user",
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  res.status(200).json({
    success: true,
    stats: {
      totalNotes,
      totalUsers,
      totalReported,
      totalDownloads: downloadsAgg[0]?.total || 0,
      totalViews: viewsAgg[0]?.total || 0,
      totalLikes: likesAgg[0]?.total || 0,
      topSubjects,
      topNotes,
      branchDistribution,
      recentActivity,
    },
  });
});

/* ─────────────────────────────────────────────────
   Analytics (charts data)
───────────────────────────────────────────────── */
exports.getAnalytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [uploadsOverTime, usersOverTime, noteTypeBreakdown, engagementStats] =
    await Promise.all([
      // Notes uploaded per day (last 30 days)
      Note.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),

      // Users registered per day (last 30 days)
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),

      // Note type breakdown (Handwritten vs Printed vs Assignment etc.)
      Note.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Engagement per semester
      Note.aggregate([
        {
          $group: {
            _id: "$semester",
            views: { $sum: { $size: "$viewedBy" } },
            downloads: { $sum: "$downloads" },
            likes: { $sum: "$likes" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: { $concat: ["Sem ", { $toString: "$_id" }] }, views: 1, downloads: 1, likes: 1 } },
      ]),
    ]);

  res.status(200).json({
    success: true,
    uploadsOverTime,
    usersOverTime,
    noteTypeBreakdown,
    engagementStats,
  });
});

/* ─────────────────────────────────────────────────
   Get All Reported Notes
───────────────────────────────────────────────── */
exports.getReportedNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ "reports.0": { $exists: true } })
    .populate("uploadedBy", "fullName email profileImage")
    .sort({ "reports.length": -1 })
    .lean();

  const notesWithCount = notes.map((note) => ({
    ...note,
    reportCount: note.reports.length,
  }));

  res.status(200).json({ success: true, notes: notesWithCount });
});

/* ─────────────────────────────────────────────────
   Get All Notes (paginated + search)
───────────────────────────────────────────────── */
exports.getAllNotesAdmin = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 15;
  const skip = (page - 1) * limit;
  const search = req.query.search?.trim() || "";

  const query = search
    ? { $or: [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ]}
    : {};

  const [totalNotes, notes] = await Promise.all([
    Note.countDocuments(query),
    Note.find(query)
      .populate("uploadedBy", "fullName email profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    totalNotes,
    currentPage: page,
    totalPages: Math.ceil(totalNotes / limit),
    notes,
  });
});

/* ─────────────────────────────────────────────────
   Approve Note
───────────────────────────────────────────────── */
exports.approveNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const note = await Note.findByIdAndUpdate(id, { isApproved: true }, { new: true });
  if (!note) return res.status(404).json({ success: false, message: "Note not found" });
  res.status(200).json({ success: true, message: "Note approved" });
});

/* ─────────────────────────────────────────────────
   Delete Note
───────────────────────────────────────────────── */
exports.deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const note = await Note.findById(id);
  if (!note) return res.status(404).json({ success: false, message: "Note not found" });

  try { await deleteFileFromDrive(note.driveFileId); } catch (err) {
    console.error("Drive delete error:", err.message);
  }

  await Note.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "Note deleted successfully" });
});

/* ─────────────────────────────────────────────────
   Get All Users (paginated)
───────────────────────────────────────────────── */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  const [totalUsers, users] = await Promise.all([
    User.countDocuments(),
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  res.status(200).json({
    success: true,
    totalUsers,
    currentPage: page,
    totalPages: Math.ceil(totalUsers / limit),
    users,
  });
});

/* ─────────────────────────────────────────────────
   Block / Unblock User
───────────────────────────────────────────────── */
exports.deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.status(200).json({ success: true, message: `${user.fullName} has been blocked` });
});

exports.reactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { isActive: true }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.status(200).json({ success: true, message: `${user.fullName} has been unblocked` });
});

/* ─────────────────────────────────────────────────
   Change User Role (promote / demote)
───────────────────────────────────────────────── */
exports.changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["student", "admin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role. Use 'student' or 'admin'" });
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  res.status(200).json({ success: true, message: `${user.fullName}'s role changed to ${role}`, user });
});

/* ─────────────────────────────────────────────────
   Delete User + their notes
───────────────────────────────────────────────── */
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  // Delete all their notes from Drive + DB
  const userNotes = await Note.find({ uploadedBy: id }).lean();
  for (const note of userNotes) {
    try { await deleteFileFromDrive(note.driveFileId); } catch (_) {}
  }
  await Note.deleteMany({ uploadedBy: id });
  await User.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: `${user.fullName} and all their notes have been deleted` });
});

/* ─────────────────────────────────────────────────
   Clear Reports on a Note
───────────────────────────────────────────────── */
exports.clearReports = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const note = await Note.findByIdAndUpdate(id, { $set: { reports: [] } }, { new: true });
  if (!note) return res.status(404).json({ success: false, message: "Note not found" });
  res.status(200).json({ success: true, message: "Reports cleared successfully" });
});
