const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("node:fs");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const clasificacionRoutes = require("./routes/clasificacion");
const partidosRoutes = require("./routes/partidos");

dotenv.config();

// Conectar a la base de datos
connectDB();
const app = express();

// --- CONFIGURACIÓN DE CORS ---
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        origin.includes("vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("onrender.com")
      ) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// --- CONFIGURACIÓN MEJORADA DE MULTER ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/";
    // Crear carpeta uploads si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generamos un nombre único: timestamp + número aleatorio + extensión original
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // ✅ MEJORA: Sanitizamos la extensión
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  },
});

// ✅ AÑADIDO: Filtro de archivos para seguridad
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  // Extensiones permitidas
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;

  const mimeTypeValid = allowedMimeTypes.includes(file.mimetype);
  const extValid = allowedExtensions.test(file.originalname);

  if (mimeTypeValid && extValid) {
    cb(null, true); // ✅ Archivo válido
  } else {
    cb(
      new Error(
        "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF, WEBP)"
      ),
      false
    );
  }
};

// ✅ CONFIGURACIÓN COMPLETA DE MULTER
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // ✅ Límite de 5MB por archivo
  },
  fileFilter: fileFilter, // ✅ Validación de tipo de archivo
});

// --- SERVIR IMÁGENES ESTÁTICAS ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- ENDPOINT PARA SUBIR IMÁGENES (Clasificación, etc.) ---
app.post("/api/upload", upload.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se ha subido ningún archivo." });
  }
  // Devolvemos el nombre generado para que el frontend lo guarde en la BBDD
  res.json({ filename: req.file.filename });
});

// --- RUTA LEGACY (Perfil de usuario) ---
app.post("/images/single", upload.single("imagenPerfil"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se ha subido ningún archivo." });
  }
  console.log("Archivo subido:", req.file);
  res.json({
    message: "Imagen subida correctamente",
    filename: req.file.filename,
  });
});

// --- RUTAS MÚLTIPLES ---
app.post("/jugadoras/multi", upload.array("jugadoras", 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No se han subido archivos." });
  }
  res.json({
    message: "Se han subido archivos de jugadoras",
    files: req.files.map((f) => f.filename),
  });
});

app.post("/escudos/multi", upload.array("escudos", 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No se han subido archivos." });
  }
  res.json({
    message: "Se han subido archivos de escudos",
    files: req.files.map((f) => f.filename),
  });
});

app.post("/otros/multi", upload.array("otros", 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No se han subido archivos." });
  }
  res.json({
    message: "Se han subido archivos otros",
    files: req.files.map((f) => f.filename),
  });
});

// --- RESTO DE RUTAS DE LA API ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clasificacion", clasificacionRoutes);
app.use("/api/jornada", partidosRoutes);

app.get("/", (req, res) => {
  res.send("API funcionando...");
});

// ✅ AÑADIDO: Middleware de manejo de errores global
app.use((err, req, res, next) => {
  // Errores de Multer
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "El archivo es demasiado grande. Tamaño máximo: 5MB",
      });
    }
    return res.status(400).json({ error: err.message });
  }

  // Otros errores
  if (err) {
    return res.status(500).json({ error: err.message });
  }

  next();
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
