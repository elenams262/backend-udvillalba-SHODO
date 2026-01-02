const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("node:fs");
const dotenv = require("dotenv");
const path = require("path"); // <--- ESTA ES LA LÍNEA QUE TE FALTABA
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const clasificacionRoutes = require("./routes/clasificacion");
const partidosRoutes = require("./routes/partidos");

dotenv.config();

const upload = multer({ dest: "uploads/" });

// Conectar a la base de datos
connectDB();
const app = express();

// Configuración de CORS
// Configuración de CORS
const corsOptions = {
  // Es vital poner el https:// al principio
  origin: "https://front-udvillalba-shodo.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsOptions));

// Middleware para JSON
app.use(express.json());

// --- AQUÍ ESTÁ LA LÍNEA MÁGICA PARA LAS FOTOS ---
// Ahora funcionará porque hemos importado 'path' arriba
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- RUTAS DE SUBIDA DE ARCHIVOS ---
app.post("/images/single", upload.single("imagenPerfil"), (req, res) => {
  console.log(req.file);
  saveImage(req.file);
  res.send("Termina");
});

app.post("/jugadoras/multi", upload.array("jugadoras", 20), (req, res) => {
  req.files.map(saveImage);
  res.send("Se han subido archivos de jugadoras");
});
app.post("/escudos/multi", upload.array("escudos", 20), (req, res) => {
  req.files.map(saveImage);
  res.send("Se han subido archivos de escudos");
});

app.post("/otros/multi", upload.array("otros", 20), (req, res) => {
  req.files.map(saveImage);
  res.send("Se han subido archivos otros");
});

function saveImage(file) {
  // Aseguramos que se guarde en la carpeta uploads
  const newPatch = `./uploads/${file.originalname}`;
  fs.renameSync(file.path, newPatch);
  return newPatch;
}

// --- RESTO DE RUTAS DE LA API ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clasificacion", clasificacionRoutes);
app.use("/api/jornada", partidosRoutes);
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("API funcionando...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
