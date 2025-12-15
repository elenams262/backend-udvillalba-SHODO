const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
  getClasificacion,
  createEquipo,
  updateEquipo,
  deleteEquipo,
} = require("../controllers/clasificacionController");

router.get("/", getClasificacion);
router.post("/", protect, createEquipo);
router.put("/:id", protect, updateEquipo);
router.delete("/:id", protect, deleteEquipo);

module.exports = router;
