const IncidentReport = require("../models/IncidentReport");
const { generateIncidentAI } = require("../utils/incidentAI");

function buildDuplicateKey({ category, locationName, buildingName, roomNumber }) {
  return [category, locationName, buildingName, roomNumber]
    .filter(Boolean)
    .join("|")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

async function createIncidentReport(req, res) {
  try {
    const {
      category = "other",
      problemType = "",
      title = "",
      description,
      severity = "medium",
      priority,
      areaType = "on_campus",
      location = null,
      locationName = "",
      buildingName = "",
      roomNumber = "",
      landmark = "",
      evidence = [],
      reporterName = "",
      reporterPhone = "",
      reporterEmail = "",
      reporterStudentId = "",
      anonymous = true,
      occurredAt,

      // Legacy fields from the old SafeWalk version
      victimWasAlone = false,
      weaponInvolved = false,
      attackerMode = "",
      lightingCondition = "",
    } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Report description is required.",
      });
    }

    const ai = generateIncidentAI({
      category,
      severity: priority || severity,
      description,
      locationName,
      areaType,
    });

    const duplicateKey = buildDuplicateKey({
      category: ai.category,
      locationName,
      buildingName,
      roomNumber,
    });

    const duplicateReport = duplicateKey
      ? await IncidentReport.findOne({
          aiDuplicateKey: duplicateKey,
          status: {
            $in: [
              "submitted",
              "ai_reviewed",
              "assigned",
              "in_progress",
              "escalated",
            ],
          },
        }).sort({ createdAt: -1 })
      : null;

    if (duplicateReport) {
      duplicateReport.duplicateCount += 1;
      duplicateReport.priorityScore = Math.min(
        100,
        duplicateReport.priorityScore + 5
      );
      duplicateReport.aiRiskScore = duplicateReport.priorityScore;
      duplicateReport.statusHistory.push({
        status: duplicateReport.status,
        note: "A similar student report was grouped with this case.",
        actorName: "SafeCampus AI",
        actorRole: "ai",
      });

      await duplicateReport.save();

      return res.status(200).json({
        success: true,
        message:
          "Similar campus issue already exists. Your report has been grouped with the existing case.",
        data: duplicateReport,
        duplicateGrouped: true,
      });
    }

    const report = await IncidentReport.create({
      institutionId: "university-of-ghana",
      institutionName: "University of Ghana",
      campusName: "Legon Campus",

      category: ai.category,
      problemType: problemType || ai.problemType,
      title: title || ai.title,
      description,

      severity: ai.severity,
      priority: ai.priority,
      priorityScore: ai.priorityScore,
      aiRiskScore: ai.aiRiskScore,

      areaType,
      location,
      locationName,
      buildingName,
      roomNumber,
      landmark,

      evidence,

      reporterName,
      reporterPhone,
      reporterEmail,
      reporterStudentId,
      anonymous,

      status: "ai_reviewed",
      assignedUnit: ai.responsibleUnit,
      assignedAt: new Date(),

      aiSummary: ai.aiSummary,
      aiRecommendedAction: ai.recommendedAction,
      aiSuggestedUnit: ai.responsibleUnit,
      aiDuplicateKey: duplicateKey,

      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),

      victimWasAlone,
      weaponInvolved,
      attackerMode,
      lightingCondition,

      statusHistory: [
        {
          status: "submitted",
          note: "Student submitted a campus issue report.",
          actorName: anonymous ? "Anonymous Student" : reporterName || "Student",
          actorRole: "student",
        },
        {
          status: "ai_reviewed",
          note: `AI classified this as ${ai.problemType} and routed it to ${ai.responsibleUnit}.`,
          actorName: "SafeCampus AI",
          actorRole: "ai",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message:
        "Campus issue report created, classified by AI, and routed to the responsible unit.",
      data: report,
    });
  } catch (error) {
    console.error("Create campus report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create campus issue report.",
      error: error.message,
    });
  }
}

async function getIncidentReports(req, res) {
  try {
    const {
      category,
      severity,
      priority,
      areaType,
      status,
      assignedUnit,
      minRiskScore,
      limit = 50,
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (priority) filter.priority = priority;
    if (areaType) filter.areaType = areaType;
    if (status) filter.status = status;
    if (assignedUnit) filter.assignedUnit = assignedUnit;

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
    console.error("Get campus reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch campus issue reports.",
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
        message: "Campus issue report not found.",
      });
    }

    return res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Get campus report by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch campus issue report.",
      error: error.message,
    });
  }
}

async function updateIncidentReportStatus(req, res) {
  try {
    const {
      status,
      note = "",
      actorName = "Authority User",
      actorRole = "authority",
      assignedToName = "",
      resolutionSummary = "",
      resolutionEvidence = [],
    } = req.body;

    const allowedStatuses = [
      "submitted",
      "ai_reviewed",
      "assigned",
      "in_progress",
      "resolved",
      "student_confirmed",
      "closed",
      "rejected",
      "escalated",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report status.",
      });
    }

    const report = await IncidentReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Campus issue report not found.",
      });
    }

    report.status = status;

    if (assignedToName) {
      report.assignedToName = assignedToName;
    }

    if (status === "assigned") {
      report.assignedAt = new Date();
    }

    if (status === "in_progress") {
      report.inProgressAt = new Date();
    }

    if (status === "resolved") {
      report.resolvedAt = new Date();
      report.resolutionSummary = resolutionSummary;
      report.resolutionEvidence = resolutionEvidence;
    }

    if (status === "closed") {
      report.closedAt = new Date();
    }

    if (status === "escalated") {
      report.escalationLevel += 1;
    }

    report.statusHistory.push({
      status,
      note,
      actorName,
      actorRole,
    });

    await report.save();

    return res.json({
      success: true,
      message: "Campus issue report status updated successfully.",
      data: report,
    });
  } catch (error) {
    console.error("Update campus report status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update campus issue report status.",
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
        message: "Campus issue report not found.",
      });
    }

    return res.json({
      success: true,
      message: "Campus issue report deleted successfully.",
    });
  } catch (error) {
    console.error("Delete campus report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete campus issue report.",
      error: error.message,
    });
  }
}

async function getRiskStats(req, res) {
  try {
    const reports = await IncidentReport.find();

    const totalReports = reports.length;

    const openReports = reports.filter((report) =>
      ["submitted", "ai_reviewed", "assigned", "in_progress", "escalated"].includes(
        report.status
      )
    ).length;

    const resolvedReports = reports.filter((report) =>
      ["resolved", "student_confirmed", "closed"].includes(report.status)
    ).length;

    const escalatedReports = reports.filter(
      (report) => report.status === "escalated" || report.escalationLevel > 0
    ).length;

    const criticalReports = reports.filter(
      (report) => report.aiRiskScore >= 85 || report.priority === "critical"
    ).length;

    const highRiskReports = reports.filter(
      (report) => report.aiRiskScore >= 70 || report.priority === "high"
    ).length;

    const averageRiskScore =
      totalReports === 0
        ? 0
        : Math.round(
            reports.reduce((sum, report) => sum + report.aiRiskScore, 0) /
              totalReports
          );

    const categoryCounts = {};

    reports.forEach((report) => {
      categoryCounts[report.problemType || report.category] =
        (categoryCounts[report.problemType || report.category] || 0) + 1;
    });

    const topPattern =
      Object.entries(categoryCounts)
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count)[0] || null;

    return res.json({
      success: true,
      data: {
        totalReports,
        openReports,
        resolvedReports,
        escalatedReports,
        highRiskReports,
        criticalReports,
        averageRiskScore,
        topPattern,
      },
    });
  } catch (error) {
    console.error("Get campus report stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch campus report stats.",
      error: error.message,
    });
  }
}

module.exports = {
  createIncidentReport,
  getIncidentReports,
  getIncidentReportById,
  updateIncidentReportStatus,
  deleteIncidentReport,
  getRiskStats,
};