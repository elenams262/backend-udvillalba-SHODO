const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
  getNextMatch,
  createMatch,
} = require("../controllers/partidosController");

router.get("/", getNextMatch);
router.post("/", protect, createMatch);

module.exports = router;
