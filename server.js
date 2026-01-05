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

// --- CRON JOBS (Tareas programadas) ---
const cron = require("node-cron");
const actualizarClasificacion = require("./services/scrapingService");

// Programar la actualización automática
// "0 * * * *" significa "en el minuto 0 de cada hora"
cron.schedule("0 * * * *", () => {
  actualizarClasificacion();
});

// Opción para ejecutarlo al arrancar (para probar que funciona ya)
setTimeout(() => {
  actualizarClasificacion();
}, 5000); // 5 segundos después de iniciar

// --- CONFIGURACIÓN DE CORS ---
// Se ha añadido explícitamente tu URL de Vercel

// server.js (en Render)
const allowedOrigins = [
  "https://infantil-femenino-udvillalba.vercel.app", // Tu URL real
  "http://localhost:4200",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir si no hay origen (como apps móviles) o si está en la lista o si es de vercel
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Bloqueado por CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// --- CONFIGURACIÓN DE MULTER ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.test(file.originalname)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Solo se aceptan imágenes (JPG, PNG, GIF, WEBP)"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite 5MB
  fileFilter: fileFilter,
});

// --- SERVIR IMÁGENES ESTÁTICAS ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- ENDPOINTS DE SUBIDA ---
// Este endpoint es el que usa ApiService.subirImagen
app.post("/api/upload", upload.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se ha subido ningún archivo." });
  }
  res.json({ filename: req.file.filename });
});

// Endpoints multi-subida para el panel de administración
app.post("/api/jugadoras/multi", upload.array("jugadoras", 20), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ error: "Sin archivos" });
  res.json({ files: req.files.map((f) => f.filename) });
});

app.post("/api/escudos/multi", upload.array("escudos", 20), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ error: "Sin archivos" });
  res.json({ files: req.files.map((f) => f.filename) });
});

// --- RUTAS DE LA API ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clasificacion", clasificacionRoutes);
app.use("/api/jornada", partidosRoutes);

app.get("/", (req, res) => {
  res.send("API UD Villalba funcionando...");
});

// Middleware de errores global
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "Archivo demasiado grande (Máx 5MB)" });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(500).json({ error: err.message });
  next();
});

// Cambia esto:
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Servidor en puerto ${PORT}`));
// El "0.0.0.0" ayuda a Render a encontrar el servicio más rápido.
