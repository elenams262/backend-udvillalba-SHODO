const Match = require("../models/Partidos");

const getNextMatch = async (req, res) => {
  const NUESTRO_EQUIPO = process.env.NUESTRO_EQUIPO;

  try {
    // 1. Encontrar partidos que aún no se han jugado (isPlayed: false)
    // 2. Donde nuestro equipo sea el local O el visitante
    // 3. Ordenar por la fecha más cercana (fecha: 1)
    const nextMatch = await Match.findOne({
      $or: [
        { equipoLocal: NUESTRO_EQUIPO },
        { equipoVisitante: NUESTRO_EQUIPO },
      ],
      isPlayed: false,
    }).sort({ fecha: 1 });

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

    // Usamos los escudos si están disponibles
    const escudoRival = partidoCasa
      ? nextMatch.escudoVisitante
      : nextMatch.escudoLocal;

    res.json({
      jornada: nextMatch.jornada,
      fecha: nextMatch.fecha,
      hora: nextMatch.hora,
      ubicacion: ubicacion,
      rival: rival,
      escudoRival: escudoRival,
      partidoCasa: partidoCasa,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor al obtener el partido.");
  }
};

const createMatch = async (req, res) => {
  const {
    jornada,
    equipoLocal,
    escudoLocal,
    equipoVisitante,
    escudoVisitante,
    ubicacion,
    fecha,
    hora,
  } = req.body;

  try {
    const newMatch = new Match({
      jornada,
      equipoLocal,
      escudoLocal,
      equipoVisitante,
      escudoVisitante,
      ubicacion,
      fecha,
      hora,
    });

    const match = await newMatch.save();
    res.status(201).json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor al crear el partido.");
  }
};

module.exports = {
  getNextMatch,
  createMatch,
};
