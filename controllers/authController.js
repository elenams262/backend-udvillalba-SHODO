const User = require("../models/User");
const InviteCode = require("../models/InvitacionCodigo");
const jwt = require("jsonwebtoken");

// Función para generar el token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// --- REGISTRO DE USUARIO ---
// ✅ Se incluyen req, res y next para evitar errores de referencia en el catch
const registerUser = async (req, res) => {
  // ✅ Eliminamos 'next' de aquí
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
    // 1. VALIDACIONES INICIALES
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

    // 2. CREAR EL USUARIO
    const user = new User({
      username,
      nombre,
      apellidos,
      telefono,
      fechanacimiento,
      contraseña,
      role: "usuario",
    });

    // 3. GUARDAR Y MARCAR CÓDIGO
    await user.save();

    invite.used = true;
    invite.usedBy = user._id;
    await invite.save();

    // 4. RESPUESTA ÉXITO
    return res.status(201).json({
      _id: user._id,
      username: user.username,
      rol: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    // ✅ MANEJO SEGURO: Sin usar la palabra 'next'
    console.error("Error detectado:", err.message);

    return res.status(500).json({
      mensaje: "Error en el servidor al registrar usuario",
      error: err.message, // Aquí nos dirá si falta un campo o la DB falló
    });
  }
};

// --- LOGIN DE USUARIO ---
const loginUser = async (req, res) => {
  const { username, contraseña } = req.body;

  try {
    const user = await User.findOne({ username });

    // Verificamos usuario y comparamos contraseña usando el método del modelo
    if (user && (await user.matchPassword(contraseña))) {
      res.json({
        _id: user._id,
        username: user.username,
        nombre: user.nombre,
        rol: user.role, // Mapeo consistente: role (DB) -> rol (Frontend)
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
    // Genera un código alfanumérico corto de 6 caracteres
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
    // Listamos todos los códigos, ordenando por los más recientes primero
    const codes = await InviteCode.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (err) {
    console.error("Error obteniendo códigos:", err.message);
    res.status(500).json({ mensaje: "Error al obtener los códigos" });
  }
};

// Exportar todas las funciones para ser usadas en routes/auth.js
module.exports = {
  registerUser,
  loginUser,
  generateInviteCode,
  getInviteCodes,
};
