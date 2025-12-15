const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");

router.get("/profile", protect, (req, res) => {
  // req.user viene del middleware "protect"
  res.json({
    _id: req.user._id,
    nombre: req.user.nombre,
    apellidos: req.user.apellidos,
    correo: req.user.correo,
    telefono: req.user.telefono,
    fechanacimiento: req.user.fechanacimiento,
    contraseña: req.user.contraseña,
  });
});

module.exports = router;
