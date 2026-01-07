const getUserProfile = (req, res) => {

  res.json({
    _id: req.user._id,
    nombre: req.user.nombre,
    apellidos: req.user.apellidos,
    correo: req.user.correo,
    telefono: req.user.telefono,
    fechanacimiento: req.user.fechanacimiento,
    rol: req.user.rol,

  });
};

module.exports = {
  getUserProfile,
};
