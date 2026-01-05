const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  role: { type: String, default: "usuario" }, // Coincide con tu controlador ('usuario'/'admin')
  nombre: { type: String, required: true },
  apellidos: { type: String },
  telefono: { type: String },
  fechanacimiento: { type: Date },
  email: { type: String, required: false },
});

// 1. Encriptar la contraseña antes de guardar
// Se añade 'next' para evitar bloqueos en el guardado
UserSchema.pre("save", async function (next) {
  if (!this.isModified("contraseña")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 2. Método para comparar contraseñas
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.contraseña);
};

module.exports = mongoose.model("User", UserSchema);
