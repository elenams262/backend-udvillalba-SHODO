const express = require("express");
const router = express.Router();
// ✅ CORRECCIÓN: Importar también 'admin'
const { protect, admin } = require("../middleware/authmiddleware");

const {
  getNextMatch,
  createMatch,
  updateMatch,
  deleteMatch,
} = require("../controllers/partidosController");

// Ruta pública
router.get("/", getNextMatch);

// ✅ CORRECCIÓN: Añadir 'admin' a estas rutas
router.post("/", protect, admin, createMatch);
router.put("/:id", protect, admin, updateMatch);
router.delete("/:id", protect, admin, deleteMatch);

module.exports = router;
