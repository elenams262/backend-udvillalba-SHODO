const express = require("express");
const router = express.Router();
// ✅ Se importa 'admin'
const { protect, admin } = require("../middleware/authmiddleware");
const {
  getNextMatch,
  getAllMatches,
  createMatch,
  updateMatch,
  deleteMatch,
} = require("../controllers/partidosController");

router.get("/", getNextMatch);
router.get("/all", getAllMatches); // Ruta para ver todos los partidos (Admin/Calendario)

// ✅ Se añade 'admin' a las rutas protegidas
router.post("/", protect, admin, createMatch);
router.put("/:id", protect, admin, updateMatch);
router.delete("/:id", protect, admin, deleteMatch);

module.exports = router;
