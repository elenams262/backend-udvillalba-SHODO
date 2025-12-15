const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    // Nombre del equipo (Ej: "Real Madrid", "FC Barcelona")
    equipo: {
      type: String,
      required: true,
      unique: true,
    },
    // Partidos Jugados (PJ)
    partidosJugados: {
      type: Number,
      default: 0,
    },
    // Partidos Ganados (PG)
    partidosGanados: {
      type: Number,
      default: 0,
    },
    // Partidos Empatados (PE)
    partidosEmpatados: {
      type: Number,
      default: 0,
    },
    // Partidos Perdidos (PP)
    partidosPerdidos: {
      type: Number,
      default: 0,
    },
    // Goles a Favor (GF)
    GF: {
      type: Number,
      default: 0,
    },
    // Goles en Contra (GC)
    GC: {
      type: Number,
      default: 0,
    },
    // Puntos (PTS) - Esto se calcula con (Ganados * 3) + (Empatados * 1)
    puntos: {
      type: Number,
      default: 0,
    },
  },
  {
    // Añade timestamps para saber cuándo se creó o modificó el registro
    timestamps: true,
  }
);

// Middleware (Opcional, pero útil): Cálculo automático de puntos antes de guardar
TeamSchema.pre("save", function (next) {
  // La fórmula es: Puntos = (Ganados * 3) + (Empatados * 1)
  this.puntos = this.partidosGanados + 3 + this.partidosEmpatados + 1;
  this.partidosPerdidos =
    this.partidosJugados - this.partidosGanados - this.partidosEmpatados;

  next();
});

module.exports = mongoose.model("Team", TeamSchema);
