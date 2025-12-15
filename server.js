const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const clasificacionRoutes = require("./routes/clasificacion");
const partidosRoutes = require("./routes/partidos");

dotenv.config();

// Conectar a la base de datos
connectDB();
const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    // Si el origen está en nuestra lista de permitidos O si la petición no tiene origen (ej: Postman)
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsOptions));

// Cargar variables de entorno

// Middleware para poder leer JSON en el body de las peticiones
app.use(express.json());

// Definir la ruta de Autenticación
app.use("/api/auth", authRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API funcionando...");
});

// Definir la ruta de Usuarios
app.use("/api/users", userRoutes);

// Definir la ruta de Clasificación
app.use("/api/clasificacion", clasificacionRoutes);

// Definir la ruta de Partidos
app.use("/api/jornada", partidosRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
