const express = require("express");
const router = express.Router();

// 1. Importamos todas las funciones necesarias del controlador
const {
  registerUser,
  loginUser,
  generateInviteCode, // Nueva función
  getInviteCodes, // Nueva función
} = require("../controllers/authController");

// 2. Importamos los middlewares de protección
const { protect, admin } = require("../middleware/authmiddleware");

// --- RUTAS PÚBLICAS ---
// Cualquier persona puede intentar registrarse o loguearse
router.post("/register", registerUser);
router.post("/login", loginUser);

// --- RUTAS PRIVADAS (SOLO ADMINISTRADORES) ---
// Estas rutas requieren que el usuario esté logueado Y tenga rol 'admin'

// Endpoint para generar un nuevo código aleatorio
router.post("/invite-code", protect, admin, generateInviteCode);

// Endpoint para ver el listado de todos los códigos (usados y disponibles)
router.get("/invite-codes", protect, admin, getInviteCodes);

module.exports = router;
