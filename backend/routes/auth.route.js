const express = require("express");
const { requireAuth } = require("@clerk/express");
const { syncUser } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/auth/sync", requireAuth(), syncUser);

module.exports = router;