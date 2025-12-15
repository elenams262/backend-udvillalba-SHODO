const Team = require("../models/Equipos");

const getClasificacion = async (req, res) => {
  try {
    // Obtenemos todos los equipos y los ordenamos por Puntos (descendente)
    // Si hay empate en puntos, se usa la Diferencia de Goles (GF - GC) pero como no tenemos campo DG, usamos GF como criterio secundario
    const equipos = await Team.find({}).sort({ puntos: -1, GF: -1 });

    res.json(equipos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor al obtener la clasificación.");
  }
};

const createEquipo = async (req, res) => {
  const { equipo } = req.body;

  try {
    let team = await Team.findOne({ equipo });
    if (team) {
      return res
        .status(400)
        .json({ msg: "Este equipo ya existe en la clasificación." });
    }

    team = new Team({ equipo });
    await team.save();

    res.status(201).json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor al crear el equipo.");
  }
};

const updateEquipo = async (req, res) => {
  // Mapeamos los campos que vienen del frontend (posiblemente en inglés o español) al esquema en español
  // Asumimos que el input puede venir como 'played', 'wins' o 'partidosJugados', 'partidosGanados'
  const {
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    partidosJugados,
    partidosGanados,
    partidosEmpatados,
    partidosPerdidos,
    GF,
    GC,
  } = req.body;

  // Construir objeto de actualización usando los nombres correctos del Schema
  const datosTeam = {};
  if (played !== undefined) datosTeam.partidosJugados = played;
  if (wins !== undefined) datosTeam.partidosGanados = wins;
  if (draws !== undefined) datosTeam.partidosEmpatados = draws;
  if (losses !== undefined) datosTeam.partidosPerdidos = losses;
  if (goalsFor !== undefined) datosTeam.GF = goalsFor;
  if (goalsAgainst !== undefined) datosTeam.GC = goalsAgainst;

  // Si vienen con los nombres en español
  if (partidosJugados !== undefined)
    datosTeam.partidosJugados = partidosJugados;
  if (partidosGanados !== undefined)
    datosTeam.partidosGanados = partidosGanados;
  if (partidosEmpatados !== undefined)
    datosTeam.partidosEmpatados = partidosEmpatados;
  if (partidosPerdidos !== undefined)
    datosTeam.partidosPerdidos = partidosPerdidos;
  if (GF !== undefined) datosTeam.GF = GF;
  if (GC !== undefined) datosTeam.GC = GC;

  try {
    let team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ msg: "Equipo no encontrado." });

    // Actualizar el equipo
    // Nota: findByIdAndUpdate no dispara pre-save middleware por defecto para recalcular puntos,
    // así que lo hacemos manualmente o usamos el método save().
    // Vamos a actualizar los campos y luego guardar para que el pre-save (si funciona) recalcule.
    // O mejor, calculamos aquí para asegurar.

    // Asignar nuevos valores
    Object.keys(datosTeam).forEach((key) => {
      team[key] = datosTeam[key];
    });

    // Puntos se calculan en el Pre-save, así que solo hacemos save()
    await team.save();

    res.json(team);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Equipo no encontrado." });
    }
    res.status(500).send("Error en el servidor al actualizar el equipo.");
  }
};

const deleteEquipo = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: "Equipo no encontrado." });
    }

    await Team.findByIdAndDelete(req.params.id);

    res.json({ msg: "Equipo eliminado de la clasificación." });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Equipo no encontrado." });
    }
    res.status(500).send("Error en el servidor al eliminar el equipo.");
  }
};

module.exports = {
  getClasificacion,
  createEquipo,
  updateEquipo,
  deleteEquipo,
};
