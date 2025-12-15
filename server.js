const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const clasificacionRoutes = require("./routes/clasificacion");

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
