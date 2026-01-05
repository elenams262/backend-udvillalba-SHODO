// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  role: { type: String, default: "usuario" },
  nombre: { type: String, required: true },
  apellidos: { type: String },
  telefono: { type: String },
  fechanacimiento: { type: Date },
});

// Encriptar contraseña antes de guardar
UserSchema.pre("save", async function (next) {
  // Si la contraseña no ha cambiado, seguimos adelante
  if (!this.isModified("contraseña")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);

    // Verificación de seguridad para evitar el error "next is not a function"
    if (typeof next === "function") {
      next();
    }
  } catch (error) {
    console.error("Error en el middleware de encriptación:", error);
    // En lugar de llamar a next(error) que está fallando, lanzamos el error
    throw new Error("Fallo en la encriptación de seguridad");
  }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.contraseña);
};

module.exports = mongoose.model("User", UserSchema);
