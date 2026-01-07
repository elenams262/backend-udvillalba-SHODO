const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-contraseña");
      if (!req.user)
        return res.status(401).json({ msg: "Usuario no encontrado" });
      next();
    } catch (error) {
      return res.status(401).json({ msg: "Token no válido" });
    }
  }
  if (!token) return res.status(401).json({ msg: "No hay token" });
};

const admin = (req, res, next) => {

  const userRole = (req.user.role || req.user.rol || "").toLowerCase();

  if (req.user && userRole === "admin") {
    next();
  } else {
    res.status(403).json({
      msg: "Acceso denegado: Se requiere rol de administrador",
      rolDetectado: userRole,
    });
  }
};

module.exports = { protect, admin };
