const Match = require("../models/Partidos");

const getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find({}).sort({ fecha: 1 });
    res.json(matches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener los partidos");
  }
};

const getNextMatch = async (req, res) => {
  const NUESTRO_EQUIPO = process.env.NUESTRO_EQUIPO || "UD Villalba"; // Fallback por seguridad

  try {
    // 1. Prioridad: Buscar si hay un partido marcado manualmente como "seleccionado"
    let nextMatch = await Match.findOne({ seleccionado: true });

    // 2. Si no hay seleccionado, buscamos el partido más próximo que NO se haya jugado
    if (!nextMatch) {
      nextMatch = await Match.findOne({
        $or: [
          { equipoLocal: { $regex: "VILLALBA", $options: "i" } }, // Busca semánticamente
          { equipoVisitante: { $regex: "VILLALBA", $options: "i" } },
        ],
        isPlayed: false,
      }).sort({ fecha: 1 });
    }

    if (!nextMatch) {
      // Si no hay partido, devolvemos null pero con status 200 para que el front no de error rojo
      return res.status(200).json(null);
    }

    // Lógica visual para el frontend
    // Chequear si "UD Villalba" está en local o visitante usando includes para ser más flexibles
    const isLocal = nextMatch.equipoLocal.toUpperCase().includes("VILLALBA");

    const rival = isLocal ? nextMatch.equipoVisitante : nextMatch.equipoLocal;

    const ubicacion = isLocal
      ? nextMatch.ubicacion
      : `Campo del rival: ${rival}`;

    const escudoRival = isLocal
      ? nextMatch.escudoVisitante
      : nextMatch.escudoLocal;

    // Devolvemos todos los datos, incluido el _id
    res.json({
      _id: nextMatch._id, // IMPRESCINDIBLE para poder editarlo después
      jornada: nextMatch.jornada,
      fecha: nextMatch.fecha,
      hora: nextMatch.hora,
      ubicacion: nextMatch.ubicacion, // Enviamos un raw location también si se quiere
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

    // 1. Deseleccionar todos los partidos primero
    await Match.updateMany({}, { seleccionado: false });

    // 2. Seleccionar el indicado
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

// --- ESTA ES LA FUNCIÓN QUE FALTABA ---
const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    // Buscamos por ID y actualizamos
    const partidoActualizado = await Match.findByIdAndUpdate(id, req.body, {
      new: true, // Para que devuelva el objeto ya actualizado
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

// ... código anterior ...

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

// IMPORTANTE: Añade 'deleteMatch' a la lista de exportaciones
module.exports = {
  getNextMatch,
  getAllMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  selectMatchForJornada, // <--- NUEVA FUNCIÓN
};
