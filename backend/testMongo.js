const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:notesplatform@notessharingplatform.wqtkk4x.mongodb.net/onlineNotesDB")
.then(() => {
  console.log("MongoDB connected");
  process.exit();
})
.catch(err => {
  console.error("MongoDB error:", err.message);
});