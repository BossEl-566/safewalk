const express = require("express");

const {
  createEmergencyContact,
  getEmergencyContacts,
  getEmergencyContactById,
  updateEmergencyContact,
  deleteEmergencyContact,
} = require("../controllers/contactController");

const router = express.Router();

router.get("/", getEmergencyContacts);
router.get("/:id", getEmergencyContactById);
router.post("/", createEmergencyContact);
router.patch("/:id", updateEmergencyContact);
router.delete("/:id", deleteEmergencyContact);

module.exports = router;