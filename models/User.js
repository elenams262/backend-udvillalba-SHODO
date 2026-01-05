const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Nuevo campo
  contraseña: { type: String, required: true },
  role: { type: String, default: "user" },
  // El email ya no es requerido
  email: { type: String, required: false },
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
