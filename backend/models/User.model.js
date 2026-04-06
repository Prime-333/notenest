const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    profileImage: {
      type: String,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ── NEW: bookmarked notes ──────────────
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);