const express = require("express");
const router = express.Router();
// ✅ Se importa 'admin'
const { protect, admin } = require("../middleware/authmiddleware");
const {
  getNextMatch,
  createMatch,
  updateMatch,
  deleteMatch,
} = require("../controllers/partidosController");

router.get("/", getNextMatch);

// ✅ Se añade 'admin' a las rutas protegidas
router.post("/", protect, admin, createMatch);
router.put("/:id", protect, admin, updateMatch);
router.delete("/:id", protect, admin, deleteMatch);

module.exports = router;
