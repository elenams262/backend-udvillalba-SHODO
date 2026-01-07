const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authmiddleware");
const {
  getNextMatch,
  getAllMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  selectMatchForJornada,
} = require("../controllers/partidosController");

router.get("/", getNextMatch);
router.get("/all", getAllMatches);

router.post("/", protect, admin, createMatch);
router.put("/:id", protect, admin, updateMatch);
router.delete("/:id", protect, admin, deleteMatch);
router.put("/select/:id", protect, admin, selectMatchForJornada);

module.exports = router;
