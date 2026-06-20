const express = require("express");

const {
  createIncidentReport,
  getIncidentReports,
  getIncidentReportById,
  deleteIncidentReport,
  getRiskStats,
} = require("../controllers/incidentController");

const router = express.Router();

router.get("/", getIncidentReports);
router.get("/stats", getRiskStats);
router.get("/:id", getIncidentReportById);
router.post("/", createIncidentReport);
router.delete("/:id", deleteIncidentReport);

module.exports = router;