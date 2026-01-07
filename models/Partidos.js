const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema(
  {
    jornada: {
      type: String,
      required: true,
    },
    numeroJornada: {
      type: Number,
      required: true,
    },
    equipoLocal: {
      type: String,
      required: true,
    },
    escudoLocal: {
      type: String,
    },
    equipoVisitante: {
      type: String,
      required: true,
    },
    escudoVisitante: {
      type: String,
    },
    ubicacion: {
      type: String,
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    hora: {
      type: String,
      required: true,
    },
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
