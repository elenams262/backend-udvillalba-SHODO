const express = require("express");
const router = express.Router();
const equipos = require("../models/Equipos");
const { protect } = require("../middleware/authmiddleware");

router.get("/", async (req, res) => {
  try {
    // Obtenemos todos los equipos y los ordenamos por Puntos (descendente)
    // Si hay empate en puntos, se puede usar la Diferencia de Goles (goalsFor - goalsAgainst)
    const equipos = await Team.find({}).sort({ puntos: -1, GF: -1 });

    res.json(equipos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor al obtener la clasificación.");
  }
});

router.post("/", protect, async (req, res) => {
  // Solo necesitamos el nombre al crear, los demás campos inician en 0
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
});

router.put("/:id", protect, async (req, res) => {
  const { played, wins, draws, losses, goalsFor, goalsAgainst } = req.body;

  // Nota: El campo 'points' se calculará automáticamente en el modelo antes de guardarse.
  const datosTeam = { played, wins, draws, losses, goalsFor, goalsAgainst };

  try {
    let team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ msg: "Equipo no encontrado." });

    // Actualizar el equipo
    team = await Team.findByIdAndUpdate(
      req.params.id,
      { $set: datosTeam },
      { new: true } // Para devolver el documento actualizado
    );

    // El middleware 'pre-save' se ejecuta y actualiza los puntos
    await team.save();

    res.json(team);
  } catch (err) {
    console.error(err.message);
    // Si el ID no es válido (ej: no tiene el formato de ObjectID)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Equipo no encontrado." });
    }
    res.status(500).send("Error en el servidor al actualizar el equipo.");
  }
});

router.delete("/:id", protect, async (req, res) => {
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
});

module.exports = router;
