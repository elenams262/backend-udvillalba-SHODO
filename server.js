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

connectDB();
const app = express();

const cron = require("node-cron");
const {
  actualizarClasificacion,
  actualizarPartidos,
} = require("./services/scrapingService");

cron.schedule("0 * * * *", () => {
  console.log("⏰ Ejecutando cron: Clasificación y Partidos");
  actualizarClasificacion();
  actualizarPartidos();
});

setTimeout(() => {
  console.log("🚀 Ejecución inicial: Clasificación y Partidos");
  actualizarClasificacion();
  actualizarPartidos();
}, 5000);

const allowedOrigins = [
  "https://infantil-femenino-udvillalba.vercel.app",
  "http://localhost:4200",
];

app.use(
  cors({
    origin: function (origin, callback) {
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/api/upload", upload.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se ha subido ningún archivo." });
  }
  res.json({ filename: req.file.filename });
});

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

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clasificacion", clasificacionRoutes);
app.use("/api/jornada", partidosRoutes);

app.get("/", (req, res) => {
  res.send("API UD Villalba funcionando...");
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Servidor en puerto ${PORT}`));
