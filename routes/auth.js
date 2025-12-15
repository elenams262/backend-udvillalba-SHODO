const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Función auxiliar para generar el token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

router.post("/register", async (req, res) => {
  const { nombre, apellidos, correo, telefono, fechanacimiento, contraseña } =
    req.body;

  try {
    let user = await User.findOne({ correo });

    if (user) {
      return res.status(400).json({ mensaje: "El usuario ya existe" });
    }

    user = new User({
      nombre,
      apellidos,
      correo,
      telefono,
      fechanacimiento,
      contraseña,
    });
    await user.save();

    res.status(201).json({
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

router.post("/login", async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    const user = await User.findOne({ correo });

    if (user && (await user.matchPassword(contraseña))) {
      res.json({
        _id: user._id,
        nombre: user.nombre,
        correo: user.correo,
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
