const User = require("../models/User");
const InviteCode = require("../models/InvitacionCodigo");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const registerUser = async (req, res) => {
  const {
    username,
    nombre,
    apellidos,
    telefono,
    fechanacimiento,
    contraseña,
    codigoInvitacion,
  } = req.body;

  try {
    // 1. VALIDAR CÓDIGO DE INVITACIÓN
    if (!codigoInvitacion) {
      return res
        .status(400)
        .json({ mensaje: "El código de invitación es obligatorio" });
    }

    const invite = await InviteCode.findOne({
      code: codigoInvitacion,
      used: false,
    });
    if (!invite) {
      return res
        .status(400)
        .json({ mensaje: "Código inválido o ya utilizado" });
    }

    // 2. VERIFICAR SI EL USERNAME YA EXISTE
    let userExists = await User.findOne({ username });
    if (userExists) {
      return res
        .status(400)
        .json({ mensaje: "El nombre de usuario ya está en uso" });
    }

    // 3. PROCESAR FECHA DE NACIMIENTO
    const dateObject = new Date(fechanacimiento);
    if (isNaN(dateObject.getTime())) {
      return res.status(400).json({ mensaje: "Fecha de nacimiento inválida" });
    }

    // 4. CREAR EL USUARIO
    const user = new User({
      username,
      nombre,
      apellidos,
      telefono,
      fechanacimiento: dateObject,
      contraseña,
      role: "usuario",
    });

    await user.save();

    // 5. MARCAR CÓDIGO COMO USADO
    invite.used = true;
    invite.usedBy = user._id;
    await invite.save();

    res.status(201).json({
      _id: user._id,
      username: user.username,
      rol: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    // ✅ CORRECCIÓN FINAL: Manejo de error sin usar 'next'
    console.error("Error crítico en Registro:", err.message);

    // Si el error es por duplicado (código 11000 de MongoDB)
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ mensaje: "Ese nombre de usuario ya existe" });
    }

    return res.status(500).json({
      mensaje: "Error en el servidor al registrar usuario",
      detalles: err.message,
    });
  }
};

// ... resto de funciones (loginUser, generateInviteCode, getInviteCodes) se mantienen igual
module.exports = {
  registerUser,
  loginUser,
  generateInviteCode,
  getInviteCodes,
};
