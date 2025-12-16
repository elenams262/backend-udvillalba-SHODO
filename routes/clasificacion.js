const express = require("express");
const router = express.Router();
// 1. IMPORTANTE: Importamos 'admin' aquí
const { protect, admin } = require("../middleware/authmiddleware");
const {
  getClasificacion,
  createEquipo,
  updateEquipo,
  deleteEquipo,
} = require("../controllers/clasificacionController");

// Esta ruta es pública (cualquiera la ve)
router.get("/", getClasificacion);

// Estas rutas son solo para ADMIN (necesitan los dos candados)
router.post("/", protect, admin, createEquipo);
router.put("/:id", protect, admin, updateEquipo);
router.delete("/:id", protect, admin, deleteEquipo);

module.exports = router;
