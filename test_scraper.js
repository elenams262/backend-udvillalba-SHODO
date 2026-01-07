const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const {
  actualizarClasificacion,
  actualizarPartidos,
} = require("./services/scrapingService");

// Cargar variables de entorno
dotenv.config();

// Ejecutar prueba
const runTest = async () => {
  console.log("🧪 Iniciando prueba de scraping manual...");

  // Conectar a BD
  await connectDB();

  // Ejecutar servicio de clasificación
  console.log("-- Clasificación --");
  await actualizarClasificacion();

  // Ejecutar servicio de partidos
  console.log("-- Partidos --");
  await actualizarPartidos();

  console.log("✅ Prueba finalizada.");
  process.exit();
};

runTest();
