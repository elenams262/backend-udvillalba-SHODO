// routes/matchday.js

const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const { protect } = require("../middleware/authmiddleware");

// Obtenemos el nombre del equipo desde las variables de entorno
const NUESTRO_EQUIPO = process.env.NUESTRO_EQUIPO;

router.get("/", async (req, res) => {
  try {
    // 1. Encontrar partidos que aún no se han jugado (isPlayed: false)
    // 2. Donde nuestro equipo sea el local O el visitante
    // 3. Ordenar por la fecha más cercana (dateTime: 1)
    const nextMatch = await Match.findOne({
      $or: [
        { equipoLocal: NUESTRO_EQUIPO },
        { equipoVisitante: NUESTRO_EQUIPO },
      ],
      isPlayed: false,
    }).sort({ fecha: 1 }); // 1 para orden ascendente (el más cercano)

    if (!nextMatch) {
      return res
        .status(404)
        .json({ msg: "No se encontró ningún partido próximo." });
    }

    // Determinar quién es el rival y si jugamos en casa o fuera
    const partidoCasa = nextMatch.equipoLocal === NUESTRO_EQUIPO;
    const rival = partidoCasa
      ? nextMatch.equipoVisitante
      : nextMatch.equipoLocal;
    const ubicacion = partidoCasa
      ? nextMatch.ubicacion
      : `Campo del rival: ${rival}`;

    // Devolver solo la información clave
    res.json({
      jornada: nextMatch.jornada,
      fecha: nextMatch.fecha,
      ubicacion: ubicacion,
      rival: rival,
      partidoCasa: partidoCasa,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor al obtener el partido.");
  }
});

router.post("/", protect, async (req, res) => {
  // Aquí se asume que se envía toda la información necesaria para un partido
  const { jornada, equipoLocal, equipoVisitante, ubicacion, fecha } = req.body;

  try {
    const newMatch = new Match({
      jornada,
      equipoLocal,
      equipoVisitante,
      ubicacion,
      fecha,
    });

    const match = await newMatch.save();
    res.status(201).json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor al crear el partido.");
  }
});

module.exports = router;
