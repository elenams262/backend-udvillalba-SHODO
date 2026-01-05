const User = require("../models/User");
const InviteCode = require("../models/InvitacionCodigo");
const jwt = require("jsonwebtoken");

// Función para generar el token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// --- REGISTRO DE USUARIO ---
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

    let userExists = await User.findOne({ username });
    if (userExists) {
      return res
        .status(400)
        .json({ mensaje: "El nombre de usuario ya está en uso" });
    }

    const dateObject = new Date(fechanacimiento);
    if (isNaN(dateObject.getTime())) {
      return res.status(400).json({ mensaje: "Fecha de nacimiento inválida" });
    }

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

    invite.used = true;
    invite.usedBy = user._id;
    await invite.save();

    res.status(201).json({
      _id: user._id,
      username: user.username,
      nombre: user.nombre,
      rol: user.role, // Enviamos el campo 'role' de la DB como 'rol' para Angular
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Error en Registro:", err.message);
    res.status(500).json({
      mensaje: "Error en el servidor al registrar usuario",
      error: err.message,
    });
  }
};

// --- LOGIN DE USUARIO (Esta es la función que faltaba) ---
const loginUser = async (req, res) => {
  const { username, contraseña } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(contraseña))) {
      res.json({
        _id: user._id,
        username: user.username,
        nombre: user.nombre,
        rol: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ mensaje: "Credenciales inválidas" });
    }
  } catch (err) {
    console.error("Error en Login:", err.message);
    res.status(500).json({ mensaje: "Error en el servidor al iniciar sesión" });
  }
};

// --- GENERAR CÓDIGO DE INVITACIÓN (Solo Admin) ---
const generateInviteCode = async (req, res) => {
  try {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const invite = new InviteCode({ code: newCode });
    await invite.save();
    res.status(201).json(invite);
  } catch (err) {
    console.error("Error generando código:", err.message);
    res.status(500).json({ mensaje: "Error al generar el código" });
  }
};

// --- LISTAR CÓDIGOS (Solo Admin) ---
const getInviteCodes = async (req, res) => {
  try {
    const codes = await InviteCode.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (err) {
    console.error("Error obteniendo códigos:", err.message);
    res.status(500).json({ mensaje: "Error al obtener los códigos" });
  }
};

// Exportar todas las funciones
module.exports = {
  registerUser,
  loginUser,
  generateInviteCode,
  getInviteCodes,
};
