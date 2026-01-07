const Match = require("../models/Partidos");

const getAllMatches = async (req, res) => {
  try {
    let matches = await Match.find({});

    matches.sort((a, b) => {
      if (a.fecha && b.fecha) {
        return new Date(a.fecha) - new Date(b.fecha);
      }
      if (!a.fecha && b.fecha) return 1;
      if (a.fecha && !b.fecha) return -1;

      return (a.numeroJornada || 0) - (b.numeroJornada || 0);
    });

    res.json(matches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener los partidos");
  }
};

const getNextMatch = async (req, res) => {
  const NUESTRO_EQUIPO = process.env.NUESTRO_EQUIPO || "UD Villalba";

  try {
    let nextMatch = await Match.findOne({ seleccionado: true });

    if (!nextMatch) {
      nextMatch = await Match.findOne({
        $or: [
          { equipoLocal: { $regex: "VILLALBA", $options: "i" } },
          { equipoVisitante: { $regex: "VILLALBA", $options: "i" } },
        ],
        isPlayed: false,
        // Excluir partidos fantasmas de descanso
        $nor: [
          {
            equipoLocal: {
              $regex: "No asignado|Equipo Fuera|Equipo Casa",
              $options: "i",
            },
          },
          {
            equipoVisitante: {
              $regex: "No asignado|Equipo Fuera|Equipo Casa",
              $options: "i",
            },
          },
        ],
      }).sort({ fecha: 1 });
    }

    if (!nextMatch) {
      return res.status(200).json(null);
    }

    const isLocal = nextMatch.equipoLocal.toUpperCase().includes("VILLALBA");

    const rival = isLocal ? nextMatch.equipoVisitante : nextMatch.equipoLocal;

    const ubicacion = isLocal
      ? nextMatch.ubicacion
      : `Campo del rival: ${rival}`;

    const escudoRival = isLocal
      ? nextMatch.escudoVisitante
      : nextMatch.escudoLocal;

    res.json({
      _id: nextMatch._id,
      jornada: nextMatch.jornada,
      fecha: nextMatch.fecha,
      hora: nextMatch.hora,
      ubicacion: nextMatch.ubicacion,
      rival: rival,
      escudoRival: escudoRival,
      partidoCasa: isLocal,
      equipoLocal: nextMatch.equipoLocal,
      equipoVisitante: nextMatch.equipoVisitante,
      seleccionado: nextMatch.seleccionado,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor al obtener el partido.");
  }
};

const selectMatchForJornada = async (req, res) => {
  try {
    const { id } = req.params;

    await Match.updateMany({}, { seleccionado: false });

    const partidoActivado = await Match.findByIdAndUpdate(
      id,
      { seleccionado: true },
      { new: true }
    );

    if (!partidoActivado) {
      return res.status(404).json({ msg: "Partido no encontrado" });
    }

    res.json(partidoActivado);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al seleccionar el partido");
  }
};

const createMatch = async (req, res) => {
  try {
    const newMatch = new Match(req.body);
    await newMatch.save();
    res.status(201).json(newMatch);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al crear el partido");
  }
};

const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const partidoActualizado = await Match.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!partidoActualizado) {
      return res.status(404).json({ msg: "Partido no encontrado" });
    }

    res.json(partidoActualizado);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al actualizar el partido");
  }
};

const deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const partidoBorrado = await Match.findByIdAndDelete(id);

    if (!partidoBorrado) {
      return res.status(404).json({ msg: "Partido no encontrado" });
    }

    res.json({ msg: "Partido eliminado correctamente" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al eliminar el partido");
  }
};

module.exports = {
  getNextMatch,
  getAllMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  selectMatchForJornada,
};
