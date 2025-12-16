const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
// Importamos la nueva función deleteMatch
const {
  getNextMatch,
  createMatch,
  updateMatch,
  deleteMatch, // <--- AÑADIR
} = require("../controllers/partidosController");

router.get("/", getNextMatch);
router.post("/", protect, createMatch);
router.put("/:id", protect, updateMatch);
router.delete("/:id", protect, deleteMatch); // <--- NUEVA RUTA

module.exports = router;
