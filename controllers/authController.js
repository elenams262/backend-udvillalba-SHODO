const User = require("../models/User");
const InviteCode = require("../models/InviteCode"); // Importante crear este modelo
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const registerUser = async (req, res) => {
  const {
    username, // Ahora usamos username en lugar de correo
    nombre,
    apellidos,
    telefono,
    fechanacimiento,
    contraseña,
    codigoInvitacion, // El código que le dio el admin
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
    if (!fechanacimiento) {
      return res
        .status(400)
        .json({ mensaje: "La fecha de nacimiento es obligatoria" });
    }

    let birthDateISO;
    if (typeof fechanacimiento === "string" && fechanacimiento.includes("/")) {
      const parts = fechanacimiento.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        birthDateISO = `${year}-${month}-${day}`;
      } else {
        birthDateISO = fechanacimiento;
      }
    } else {
      birthDateISO = fechanacimiento;
    }

    const dateObject = new Date(birthDateISO);
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
      rol: "usuario", // Rol por defecto
    });

    await user.save();

    // 5. MARCAR CÓDIGO COMO USADO
    invite.used = true;
    invite.usedBy = user._id; // Opcional: guardar quién lo usó
    await invite.save();

    res.status(201).json({
      _id: user._id,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Error en Registro:", err.message);
    res.status(500).send("Error en el servidor");
  }
};

const loginUser = async (req, res) => {
  const { username, contraseña } = req.body; // Login ahora por username

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(contraseña))) {
      res.json({
        _id: user._id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ mensaje: "Credenciales inválidas" });
    }
  } catch (err) {
    console.error("Error en Login:", err.message);
    res.status(500).send("Error en el servidor");
  }
};

module.exports = {
  registerUser,
  loginUser,
};
