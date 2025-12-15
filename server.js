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

// Configuración de CORS (Para que el Frontend pueda hablar con el Backend)
const corsOptions = {
  origin: "*", // ' * ' permite que cualquiera se conecte (ideal para desarrollo/estudiantes)
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
