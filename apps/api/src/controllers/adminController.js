const IncidentReport = require("../models/IncidentReport");
const SOSAlert = require("../models/SOSAlert");
const WalkSafeSession = require("../models/WalkSafeSession");

async function getAdminOverview(req, res) {
  try {
    const [
      totalIncidents,
      highRiskIncidents,
      criticalIncidents,
      activeSOSAlerts,
      resolvedSOSAlerts,
      cancelledSOSAlerts,
      activeWalkSafeSessions,
      completedWalkSafeSessions,
      cancelledWalkSafeSessions,
      latestSOSAlerts,
      latestHighRiskReports,
      latestActiveWalks,
    ] = await Promise.all([
      IncidentReport.countDocuments(),
      IncidentReport.countDocuments({ aiRiskScore: { $gte: 70 } }),
      IncidentReport.countDocuments({ aiRiskScore: { $gte: 85 } }),

      SOSAlert.countDocuments({ status: "active" }),
      SOSAlert.countDocuments({ status: "resolved" }),
      SOSAlert.countDocuments({ status: "cancelled" }),

      WalkSafeSession.countDocuments({ status: "active" }),
      WalkSafeSession.countDocuments({ status: "completed" }),
      WalkSafeSession.countDocuments({ status: "cancelled" }),

      SOSAlert.find({ status: "active" }).sort({ createdAt: -1 }).limit(20),

      IncidentReport.find({ aiRiskScore: { $gte: 70 } })
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
          totalIncidents,
          highRiskIncidents,
          criticalIncidents,
          activeSOSAlerts,
          resolvedSOSAlerts,
          cancelledSOSAlerts,
          activeWalkSafeSessions,
          completedWalkSafeSessions,
          cancelledWalkSafeSessions,
        },
        activeSOSAlerts: latestSOSAlerts,
        highRiskReports: latestHighRiskReports,
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