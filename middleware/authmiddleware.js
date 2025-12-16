const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // 1. Verificar si el token existe en los headers de la petición
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Obtener el token de la cadena 'Bearer token...'
      token = req.headers.authorization.split(" ")[1];

      // 2. Verificar el token (validar la firma y expiración)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Obtener el usuario del token y adjuntarlo al objeto request
      req.user = await User.findById(decoded.id).select("-password");

      next(); // Continuar a la siguiente función (la ruta protegida)
    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: "No autorizado, token fallido" });
    }
  }

  if (!token) {
    res.status(401).json({ msg: "No autorizado, no hay token" });
  }
};

const admin = (req, res, next) => {
  // Verificamos si existe el usuario y si su campo 'rol' es 'admin'
  if (req.user && req.user.rol === "admin") {
    next(); // Es admin, dejamos pasar
  } else {
    res.status(401).json({ msg: "No autorizado como administrador" });
  }
};

// Exportamos ambas funciones
module.exports = { protect, admin };
