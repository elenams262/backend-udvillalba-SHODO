const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  apellidos: {
    type: String,
    required: true,
  },
  correo: {
    type: String,
    required: true,
    unique: true,
  },
  telefono: {
    type: String,
    required: true,
  },
  fechanacimiento: {
    type: Date,
    required: true,
  },
  contraseña: {
    type: String,
    required: true,
  },
  rol: {
    type: String,
    default: "usuario", // Por defecto todos son usuarios normales
    required: true,
  },
});

// 1. Encriptar la contraseña antes de guardar (Middleware)
UserSchema.pre("save", async function () {
  if (!this.isModified("contraseña")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.contraseña = await bcrypt.hash(this.contraseña, salt);
});

// 2. Método para comparar contraseñas (uso en el login)
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.contraseña);
};

module.exports = mongoose.model("User", UserSchema);
