const IncidentReport = require("../models/IncidentReport");
const { generateIncidentAI } = require("../utils/incidentAI");

async function createIncidentReport(req, res) {
  try {
    const {
      category,
      description,
      severity = "medium",
      areaType = "unknown",
      location = null,
      locationName = "",
      victimWasAlone = false,
      weaponInvolved = false,
      attackerMode = "",
      lightingCondition = "",
      anonymous = true,
      occurredAt,
    } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Incident category is required.",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Incident description is required.",
      });
    }

    const ai = generateIncidentAI({
      category,
      severity,
      areaType,
      victimWasAlone,
      weaponInvolved,
      description,
    });

    const report = await IncidentReport.create({
      category,
      title: ai.title,
      description,
      severity,
      areaType,
      location,
      locationName,
      victimWasAlone,
      weaponInvolved,
      attackerMode,
      lightingCondition,
      anonymous,
      status: "pending",
      aiRiskScore: ai.aiRiskScore,
      aiSummary: ai.aiSummary,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Incident report created successfully.",
      data: report,
    });
  } catch (error) {
    console.error("Create incident report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create incident report.",
      error: error.message,
    });
  }
}

async function getIncidentReports(req, res) {
  try {
    const {
      category,
      severity,
      areaType,
      status,
      minRiskScore,
      limit = 50,
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (areaType) filter.areaType = areaType;
    if (status) filter.status = status;

    if (minRiskScore) {
      filter.aiRiskScore = {
        $gte: Number(minRiskScore),
      };
    }

    const reports = await IncidentReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100));

    return res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Get incident reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch incident reports.",
      error: error.message,
    });
  }
}

async function getIncidentReportById(req, res) {
  try {
    const report = await IncidentReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Incident report not found.",
      });
    }

    return res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Get incident report by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch incident report.",
      error: error.message,
    });
  }
}

async function deleteIncidentReport(req, res) {
  try {
    const report = await IncidentReport.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Incident report not found.",
      });
    }

    return res.json({
      success: true,
      message: "Incident report deleted successfully.",
    });
  } catch (error) {
    console.error("Delete incident report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete incident report.",
      error: error.message,
    });
  }
}

async function getRiskStats(req, res) {
  try {
    const reports = await IncidentReport.find();

    const totalReports = reports.length;
    const highRiskReports = reports.filter(
      (report) => report.aiRiskScore >= 70
    ).length;
    const criticalReports = reports.filter(
      (report) => report.aiRiskScore >= 85
    ).length;

    const averageRiskScore =
      totalReports === 0
        ? 0
        : Math.round(
            reports.reduce((sum, report) => sum + report.aiRiskScore, 0) /
              totalReports
          );

    const incidentTypeCounts = {};

    reports.forEach((report) => {
      incidentTypeCounts[report.title] =
        (incidentTypeCounts[report.title] || 0) + 1;
    });

    const topPattern = Object.entries(incidentTypeCounts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)[0] || null;

    return res.json({
      success: true,
      data: {
        totalReports,
        highRiskReports,
        criticalReports,
        averageRiskScore,
        topPattern,
      },
    });
  } catch (error) {
    console.error("Get risk stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch risk stats.",
      error: error.message,
    });
  }
}

module.exports = {
  createIncidentReport,
  getIncidentReports,
  getIncidentReportById,
  deleteIncidentReport,
  getRiskStats,
};