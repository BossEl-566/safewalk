const express = require("express");

const {
  createIncidentReport,
  getIncidentReports,
  getIncidentReportById,
  updateIncidentReportStatus,
  deleteIncidentReport,
  getRiskStats,
} = require("../controllers/incidentController");

const router = express.Router();

router.get("/", getIncidentReports);
router.get("/stats", getRiskStats);
router.get("/:id", getIncidentReportById);
router.post("/", createIncidentReport);
router.patch("/:id/status", updateIncidentReportStatus);
router.delete("/:id", deleteIncidentReport);

module.exports = router;