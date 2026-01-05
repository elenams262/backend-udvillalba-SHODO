const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const actualizarClasificacion = require("./services/scrapingService");

// Cargar variables de entorno
dotenv.config();

// Ejecutar prueba
const runTest = async () => {
  console.log("🧪 Iniciando prueba de scraping manual...");

  // Conectar a BD
  await connectDB();

  // Ejecutar servicio
  await actualizarClasificacion();

  console.log("✅ Prueba finalizada.");
  process.exit();
};

runTest();
