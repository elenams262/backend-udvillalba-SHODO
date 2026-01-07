const express = require("express");
const router = express.Router();


const {
  registerUser,
  loginUser,
  generateInviteCode,
  getInviteCodes,
} = require("../controllers/authController");


const { protect, admin } = require("../middleware/authmiddleware");



router.post("/register", registerUser);
router.post("/login", loginUser);





router.post("/invite-code", protect, admin, generateInviteCode);


router.get("/invite-codes", protect, admin, getInviteCodes);

module.exports = router;
