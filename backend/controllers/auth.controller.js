const User = require("../models/User.model");
const { clerkClient } = require("@clerk/express");

exports.syncUser = async (req, res) => {
  try {
    console.log("========== SYNC USER START ==========");
    console.log("REQ AUTH OBJECT:", req.auth);

    const authData =
      typeof req.auth === "function" ? req.auth() : req.auth;

    console.log("PARSED AUTH DATA:", authData);

    const userId = authData?.userId;

    console.log("USER ID FROM CLERK:", userId);

    if (!userId) {
      console.log("❌ No userId found in auth");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No userId",
      });
    }

    console.log("📡 Fetching Clerk user...");

    const clerkUser = await clerkClient.users.getUser(userId);

    console.log("✅ Clerk user fetched:", {
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
    });

    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
    const firstName = clerkUser.firstName || "";
    const lastName = clerkUser.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || "User";
    const profileImage = clerkUser.imageUrl || "";

    console.log("📝 Upserting user into MongoDB...");

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

    console.log("✅ USER SAVED IN MONGODB:", user);
    console.log("========== SYNC USER END ==========");

    return res.status(200).json({
      success: true,
      message: "User synced successfully",
      user,
    });
  } catch (error) {
    console.error("❌ SYNC ERROR FULL:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};