const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    branch: {
      type: String,
      required: true,
    },

    semester: {
      type: Number,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },
    
    type: {
  type: String,
  required: true,
  default: "Handwritten Notes",
},

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driveFileId: {
      type: String,
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    ocrText: {
      type: String,
    },

    // ── Stats ──────────────────────────────
    viewedBy: {
      type: [String],
      default: [],
    },

    downloads: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },

    // ── NEW: stores clerkIds of users who liked ──
    likedBy: {
      type: [String],
      default: [],
    },

    // ── NEW: reports with reasons ──────────
    reports: {
      type: [
        {
          userId: { type: String },
          reason: { type: String },
          reportedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Text search index
noteSchema.index({
  title: "text",
  subject: "text",
  ocrText: "text",
});

// Academic filtering index
noteSchema.index({
  branch: 1,
  semester: 1,
  subject: 1,
});

module.exports = mongoose.model("Note", noteSchema);