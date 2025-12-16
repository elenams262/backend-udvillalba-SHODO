const express = require("express");
const router = express.Router();

// Importamos las funciones desde el controlador
// (Aquí es donde está la lógica corregida que incluye el 'rol')
const { registerUser, loginUser } = require("../controllers/authController");

// Definimos las rutas apuntando al controlador
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;
