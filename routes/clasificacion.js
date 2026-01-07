const express = require("express");
const router = express.Router();

const { protect, admin } = require("../middleware/authmiddleware");
const {
  getClasificacion,
  createEquipo,
  updateEquipo,
  deleteEquipo,
} = require("../controllers/clasificacionController");


router.get("/", getClasificacion);


router.post("/", protect, admin, createEquipo);
router.put("/:id", protect, admin, updateEquipo);
router.delete("/:id", protect, admin, deleteEquipo);

module.exports = router;
