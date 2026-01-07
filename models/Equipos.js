const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    equipo: {
      type: String,
      required: true,
      unique: true,
    },
    escudo: {
      type: String,
      required: true,
    },

    partidosJugados: {
      type: Number,
      default: 0,
    },

    partidosGanados: {
      type: Number,
      default: 0,
    },

    partidosEmpatados: {
      type: Number,
      default: 0,
    },

    partidosPerdidos: {
      type: Number,
      default: 0,
    },

    GF: {
      type: Number,
      default: 0,
    },

    GC: {
      type: Number,
      default: 0,
    },

    puntos: {
      type: Number,
      default: 0,
    },
  },
  {

    timestamps: true,
  }
);

TeamSchema.pre("save", function () {

  this.puntos = this.partidosGanados * 3 + this.partidosEmpatados * 1;
  this.partidosPerdidos =
    this.partidosJugados - this.partidosGanados - this.partidosEmpatados;
});

module.exports = mongoose.model("Team", TeamSchema);
