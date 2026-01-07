const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema(
  {
    // Número o nombre de la jornada (Ej: "Jornada 1", "Cuartos de Final")
    jornada: {
      type: String,
      required: true,
    },
    // Para ordenamiento numérico
    numeroJornada: {
      type: Number,
      required: true,
    },
    // Nombre del Equipo Local
    equipoLocal: {
      type: String,
      required: true,
    },
    escudoLocal: {
      type: String,
    },
    // Nombre del Equipo Visitante
    equipoVisitante: {
      type: String,
      required: true,
    },
    escudoVisitante: {
      type: String,
    },
    // Lugar donde se jugará el partido (Ej: "Estadio Santiago Bernabéu")
    ubicacion: {
      type: String,
      required: true,
    },
    // Fecha y hora del partido
    fecha: {
      type: Date,
      required: true,
    },
    hora: {
      type: String,
      required: true,
    },
    // Opcional: Si el partido ya se ha jugado
    isPlayed: {
      type: Boolean,
      default: false,
    },
    golesLocal: {
      type: Number,
      default: null,
    },
    golesVisitante: {
      type: Number,
      default: null,
    },
    // Para seleccionar manualmente qué partido se muestra en la web
    seleccionado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Partido", MatchSchema);
