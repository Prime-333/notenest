require("dotenv").config({ path: __dirname + "/../.env" });
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  const result = await mongoose.connection.db
    .collection("notes")
    .updateMany(
      { viewedBy: { $exists: false } },
      { $set: { viewedBy: [] } }
    );

  console.log(`Fixed ${result.modifiedCount} documents`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});