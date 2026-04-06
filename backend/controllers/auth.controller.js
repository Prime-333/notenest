const User = require("../models/User.model");
const { clerkClient } = require("@clerk/express");

exports.syncUser = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    /**
     * Fetch full user from Clerk directly
     */
    const clerkUser = await clerkClient.users.getUser(userId);

    const email =
      clerkUser.emailAddresses[0]?.emailAddress || "";

    const firstName = clerkUser.firstName || "";
    const lastName = clerkUser.lastName || "";

    const fullName =
      `${firstName} ${lastName}`.trim() || "User";

    const profileImage = clerkUser.imageUrl || "";

    /**
     * Atomic upsert
     */
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        clerkId: userId,
        email,
        fullName,
        profileImage,
      },
      {
        new: true,
        upsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("SYNC ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};