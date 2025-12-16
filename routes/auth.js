const express = require("express");
const router = express.Router();

// IMPORTANTE: Importamos las funciones del controlador que YA TIENEN la lógica del rol
const { registerUser, loginUser } = require("../controllers/authController");

// Definimos las rutas usando esas funciones
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;
