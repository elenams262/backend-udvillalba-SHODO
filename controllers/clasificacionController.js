const Team = require("../models/Equipos");

const getClasificacion = async (req, res) => {
  try {
    // Ordenamos por Puntos y luego por Goles a Favor
    const equipos = await Team.find({}).sort({ puntos: -1, GF: -1 });
    res.json(equipos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener la clasificación.");
  }
};

const createEquipo = async (req, res) => {
  // AÑADIDO: Extraemos también 'escudo' y el resto de datos
  const {
    equipo,
    escudo,
    partidosJugados,
    partidosGanados,
    partidosEmpatados,
    partidosPerdidos,
    GF,
    GC,
  } = req.body;

  try {
    let team = await Team.findOne({ equipo });
    if (team) {
      return res.status(400).json({ msg: "Este equipo ya existe." });
    }

    // Creamos el equipo con TODOS los datos, incluido el escudo
    team = new Team({
      equipo, // Esto es el nombre
      escudo, // <--- IMPORTANTE: Guardamos el escudo
      partidosJugados,
      partidosGanados,
      partidosEmpatados,
      partidosPerdidos,
      GF,
      GC,
      // Los puntos se calculan solos en el modelo, pero podemos pasarlos si queremos
      puntos: partidosGanados * 3 + partidosEmpatados * 1,
    });

    await team.save();
    res.status(201).json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al crear el equipo.");
  }
};

const updateEquipo = async (req, res) => {
  // AÑADIDO: Extraemos 'escudo' del cuerpo de la petición
  const {
    equipo,
    escudo,
    partidosJugados,
    partidosGanados,
    partidosEmpatados,
    partidosPerdidos,
    GF,
    GC,
  } = req.body;

  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: "Equipo no encontrado." });
    }

    // Actualizamos los campos manualmente
    team.equipo = equipo;
    team.escudo = escudo; // <--- AQUÍ ESTABA EL PROBLEMA: No se estaba actualizando
    team.partidosJugados = partidosJugados;
    team.partidosGanados = partidosGanados;
    team.partidosEmpatados = partidosEmpatados;
    team.partidosPerdidos = partidosPerdidos;
    team.GF = GF;
    team.GC = GC;

    // Recalculamos puntos por seguridad
    team.puntos = partidosGanados * 3 + partidosEmpatados * 1;

    await team.save();

    res.json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al actualizar el equipo.");
  }
};

const deleteEquipo = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ msg: "Equipo no encontrado." });
    }
    res.json({ msg: "Equipo eliminado." });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al eliminar equipo.");
  }
};

module.exports = {
  getClasificacion,
  createEquipo,
  updateEquipo,
  deleteEquipo,
};
