const getUserProfile = (req, res) => {
  // req.user viene del middleware "protect"
  res.json({
    _id: req.user._id,
    nombre: req.user.nombre,
    apellidos: req.user.apellidos,
    correo: req.user.correo,
    telefono: req.user.telefono,
    fechanacimiento: req.user.fechanacimiento,
    rol: req.user.rol, // ✅ AÑADIDO: Ahora el frontend sabe si es admin
    // ❌ ELIMINADO: contraseña (NUNCA se debe enviar al frontend)
  });
};

module.exports = {
  getUserProfile,
};
