const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const registerUser = async (req, res) => {
  const { nombre, apellidos, correo, telefono, fechanacimiento, contraseña } =
    req.body;

  try {
    let user = await User.findOne({ correo });

    if (user) {
      return res.status(400).json({ mensaje: "El usuario ya existe" });
    }

    if (!fechanacimiento) {
      return res
        .status(400)
        .json({ mensaje: "La fecha de nacimiento es obligatoria" });
    }

    let birthDateISO;
    console.log("Fecha recibida:", fechanacimiento);

    if (fechanacimiento && fechanacimiento.includes("/")) {
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

    console.log("Fecha ISO:", birthDateISO);
    const dateObject = new Date(birthDateISO);
    console.log("Objeto Date:", dateObject);

    if (isNaN(dateObject.getTime())) {
      return res.status(400).json({ mensaje: "Fecha de nacimiento inválida" });
    }

    user = new User({
      nombre,
      apellidos,
      correo,
      telefono,
      fechanacimiento: dateObject,
      contraseña,
    });
    await user.save();

    res.status(201).json({
      _id: user._id,
      nombre: user.nombre,
      correo: user.correo,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
};

// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
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
};

module.exports = {
  registerUser,
  loginUser,
};
