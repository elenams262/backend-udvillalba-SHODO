const Team = require("../models/Equipos");

const getClasificacion = async (req, res) => {
  try {

    const equipos = await Team.find({}).sort({ puntos: -1, GF: -1 });
    res.json(equipos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener la clasificación.");
  }
};

const createEquipo = async (req, res) => {

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


    team = new Team({
      equipo,
      escudo,
      partidosJugados,
      partidosGanados,
      partidosEmpatados,
      partidosPerdidos,
      GF,
      GC,

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


    team.equipo = equipo;
    team.escudo = escudo;
    team.partidosJugados = partidosJugados;
    team.partidosGanados = partidosGanados;
    team.partidosEmpatados = partidosEmpatados;
    team.partidosPerdidos = partidosPerdidos;
    team.GF = GF;
    team.GC = GC;


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
