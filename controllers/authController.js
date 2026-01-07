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


    const user = new User({
      username,
      nombre,
      apellidos,
      telefono,
      fechanacimiento,
      contraseña,
      role: "usuario",
    });


    await user.save();

    invite.used = true;
    invite.usedBy = user._id;
    await invite.save();


    return res.status(201).json({
      _id: user._id,
      username: user.username,
      rol: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {

    console.error("Error detectado:", err.message);

    return res.status(500).json({
      mensaje: "Error en el servidor al registrar usuario",
      error: err.message,
    });
  }
};


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


const getInviteCodes = async (req, res) => {
  try {

    const codes = await InviteCode.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (err) {
    console.error("Error obteniendo códigos:", err.message);
    res.status(500).json({ mensaje: "Error al obtener los códigos" });
  }
};


module.exports = {
  registerUser,
  loginUser,
  generateInviteCode,
  getInviteCodes,
};
