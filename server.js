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

// --- CONFIGURACIÓN AVANZADA DE MULTER ---
// Usamos diskStorage para controlar el nombre y la extensión del archivo
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
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// --- SERVIR IMÁGENES ESTÁTICAS ---
// Permite ver las imágenes en http://localhost:PORT/uploads/nombre-archivo.png
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- NUEVO ENDPOINT PARA TU FRONTEND (Clasificación, etc.) ---
app.post("/api/upload", upload.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se ha subido ningún archivo.");
  }
  // Devolvemos el nombre generado para que el frontend lo guarde en la BBDD
  res.json({ filename: req.file.filename });
});

// --- RUTA LEGACY (Mantenida por compatibilidad, pero mejorada) ---
app.post("/images/single", upload.single("imagenPerfil"), (req, res) => {
  // Con la nueva configuración, el archivo ya tiene el nombre correcto y extensión.
  console.log("Archivo subido:", req.file);
  res.send("Imagen subida correctamente");
});

// --- RUTAS MÚLTIPLES ---
app.post("/jugadoras/multi", upload.array("jugadoras", 20), (req, res) => {
  res.send("Se han subido archivos de jugadoras");
});
app.post("/escudos/multi", upload.array("escudos", 20), (req, res) => {
  res.send("Se han subido archivos de escudos");
});
app.post("/otros/multi", upload.array("otros", 20), (req, res) => {
  res.send("Se han subido archivos otros");
});

// --- RESTO DE RUTAS DE LA API ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clasificacion", clasificacionRoutes);
app.use("/api/jornada", partidosRoutes);

app.get("/", (req, res) => {
  res.send("API funcionando...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
// --- FIN DE LA CONFIGURACIÓN ---
