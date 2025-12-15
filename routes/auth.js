const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Función auxiliar para generar el token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d", // El token expira en 30 días
  });
};

// ----------------------------------------------------
// @route   POST /api/auth/register
// @desc    Registrar un nuevo usuario
// @access  Public
// ----------------------------------------------------
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }

    user = new User({ name, email, password });
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// ----------------------------------------------------
// @route   POST /api/auth/login
// @desc    Autenticar usuario y obtener token
// @access  Public
// ----------------------------------------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ msg: "Credenciales inválidas" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

module.exports = router;
