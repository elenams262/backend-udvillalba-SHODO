const Match = require("../models/Partidos");

const getNextMatch = async (req, res) => {
  const NUESTRO_EQUIPO = process.env.NUESTRO_EQUIPO || "UD Villalba"; // Fallback por seguridad

  try {
    // Buscamos el partido más próximo que NO se haya jugado
    const nextMatch = await Match.findOne({
      $or: [
        { equipoLocal: NUESTRO_EQUIPO },
        { equipoVisitante: NUESTRO_EQUIPO },
      ],
      isPlayed: false,
    }).sort({ fecha: 1 }); // Ordenamos por fecha ascendente (el más cercano primero)

    if (!nextMatch) {
      // Si no hay partido, devolvemos null pero con status 200 para que el front no de error rojo
      return res.status(200).json(null);
    }

    // Lógica visual para el frontend
    const partidoCasa = nextMatch.equipoLocal === NUESTRO_EQUIPO;
    const rival = partidoCasa
      ? nextMatch.equipoVisitante
      : nextMatch.equipoLocal;
    const ubicacion = partidoCasa
      ? nextMatch.ubicacion
      : `Campo del rival: ${rival}`;

    const escudoRival = partidoCasa
      ? nextMatch.escudoVisitante
      : nextMatch.escudoLocal;

    // Devolvemos todos los datos, incluido el _id
    res.json({
      _id: nextMatch._id, // IMPRESCINDIBLE para poder editarlo después
      jornada: nextMatch.jornada,
      fecha: nextMatch.fecha,
      hora: nextMatch.hora,
      ubicacion: nextMatch.ubicacion, // Enviamos la ubicación real de la BBDD
      rival: rival,
      escudoRival: escudoRival,
      partidoCasa: partidoCasa,
      equipoLocal: nextMatch.equipoLocal,
      equipoVisitante: nextMatch.equipoVisitante,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor al obtener el partido.");
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
  createMatch,
  updateMatch,
  deleteMatch, // <--- AÑADIR ESTO
};
