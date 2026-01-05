const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware para proteger rutas.
 * Verifica que el JWT sea válido y adjunta el usuario a la petición.
 */
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
      // ✅ Usamos "-contraseña" porque así se llama el campo en tu modelo
      req.user = await User.findById(decoded.id).select("-contraseña");

      if (!req.user) {
        return res
          .status(401)
          .json({ msg: "No autorizado, usuario no encontrado" });
      }

      return next(); // Continuar a la siguiente función
    } catch (error) {
      console.error("Error en Protect Middleware:", error.message);
      return res
        .status(401)
        .json({ msg: "No autorizado, token fallido o expirado" });
    }
  }

  // 4. Si no se encontró ningún token en los headers
  if (!token) {
    return res.status(401).json({ msg: "No autorizado, no hay token" });
  }
};

/**
 * Middleware para restringir acceso solo a administradores.
 * Debe usarse SIEMPRE después del middleware 'protect'.
 */
const admin = (req, res, next) => {
  // Verificamos si existe el usuario (cargado por 'protect') y si su campo 'rol' es 'admin'
  if (req.user && req.user.role === "admin") {
    return next(); // Es admin, dejamos pasar
  } else {
    // 403 Forbidden es el error correcto cuando el usuario está autenticado pero no tiene permisos
    return res
      .status(403)
      .json({ msg: "Acceso denegado: Se requiere rol de administrador" });
  }
};

// Exportamos ambas funciones para usarlas en las rutas
module.exports = { protect, admin };
