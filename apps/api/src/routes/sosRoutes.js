const express = require("express");

const {
  createSOSAlert,
  getSOSAlerts,
  getSOSAlertById,
  resolveSOSAlert,
  cancelSOSAlert,
} = require("../controllers/sosController");

const router = express.Router();

router.get("/", getSOSAlerts);
router.get("/:id", getSOSAlertById);
router.post("/", createSOSAlert);
router.patch("/:id/resolve", resolveSOSAlert);
router.patch("/:id/cancel", cancelSOSAlert);

module.exports = router;