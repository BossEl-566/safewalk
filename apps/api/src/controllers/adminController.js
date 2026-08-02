const IncidentReport = require("../models/IncidentReport");
const SOSAlert = require("../models/SOSAlert");
const WalkSafeSession = require("../models/WalkSafeSession");

async function getAdminOverview(req, res) {
  try {
    const openStatuses = [
      "submitted",
      "ai_reviewed",
      "assigned",
      "in_progress",
      "escalated",
    ];

    const [
      totalReports,
      openReports,
      assignedReports,
      inProgressReports,
      resolvedReports,
      escalatedReports,
      criticalReports,
      urgentCampusReports,

      activeSOSAlerts,
      resolvedSOSAlerts,
      cancelledSOSAlerts,

      activeWalkSafeSessions,
      completedWalkSafeSessions,
      cancelledWalkSafeSessions,

      latestSOSAlerts,
      latestOpenCampusReports,
      latestUrgentCampusReports,
      latestActiveWalks,
    ] = await Promise.all([
      IncidentReport.countDocuments(),
      IncidentReport.countDocuments({ status: { $in: openStatuses } }),
      IncidentReport.countDocuments({ status: "assigned" }),
      IncidentReport.countDocuments({ status: "in_progress" }),
      IncidentReport.countDocuments({
        status: { $in: ["resolved", "student_confirmed", "closed"] },
      }),
      IncidentReport.countDocuments({
        $or: [{ status: "escalated" }, { escalationLevel: { $gt: 0 } }],
      }),
      IncidentReport.countDocuments({
        $or: [{ priority: "critical" }, { aiRiskScore: { $gte: 85 } }],
      }),
      IncidentReport.countDocuments({
        $or: [
          { priority: { $in: ["high", "critical"] } },
          { aiRiskScore: { $gte: 70 } },
        ],
      }),

      SOSAlert.countDocuments({ status: "active" }),
      SOSAlert.countDocuments({ status: "resolved" }),
      SOSAlert.countDocuments({ status: "cancelled" }),

      WalkSafeSession.countDocuments({ status: "active" }),
      WalkSafeSession.countDocuments({ status: "completed" }),
      WalkSafeSession.countDocuments({ status: "cancelled" }),

      SOSAlert.find({ status: "active" }).sort({ createdAt: -1 }).limit(20),

      IncidentReport.find({ status: { $in: openStatuses } })
        .sort({ priorityScore: -1, createdAt: -1 })
        .limit(30),

      IncidentReport.find({
        $or: [
          { priority: { $in: ["high", "critical"] } },
          { aiRiskScore: { $gte: 70 } },
        ],
      })
        .sort({ aiRiskScore: -1, createdAt: -1 })
        .limit(20),

      WalkSafeSession.find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    return res.json({
      success: true,
      data: {
        stats: {
          // New SafeCampus AI stats
          totalReports,
          openReports,
          assignedReports,
          inProgressReports,
          resolvedReports,
          escalatedReports,
          urgentCampusReports,
          criticalReports,

          // Legacy names kept so the old mobile dashboard does not break yet
          totalIncidents: totalReports,
          highRiskIncidents: urgentCampusReports,
          criticalIncidents: criticalReports,

          activeSOSAlerts,
          resolvedSOSAlerts,
          cancelledSOSAlerts,

          activeWalkSafeSessions,
          completedWalkSafeSessions,
          cancelledWalkSafeSessions,
        },

        // New SafeCampus AI names
        openCampusReports: latestOpenCampusReports,
        urgentCampusReports: latestUrgentCampusReports,

        // Legacy names kept for existing mobile screen
        activeSOSAlerts: latestSOSAlerts,
        highRiskReports: latestUrgentCampusReports,
        activeWalkSafeSessions: latestActiveWalks,
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard overview.",
      error: error.message,
    });
  }
}

module.exports = {
  getAdminOverview,
};