const IncidentReport = require("../models/IncidentReport");
const { analyzeLocationRisk } = require("../services/locationRiskService");

async function checkLocationRisk(req, res) {
  try {
    const {
      location,
      radiusMeters = 220,
      selectedHour = new Date().getHours(),
    } = req.body;

    if (!location?.latitude || !location?.longitude) {
      return res.status(400).json({
        success: false,
        message: "Location latitude and longitude are required.",
      });
    }

    const reports = await IncidentReport.find({})
      .sort({ createdAt: -1 })
      .limit(500);

    const risk = analyzeLocationRisk({
      location,
      reports,
      radiusMeters: Number(radiusMeters),
      selectedHour: Number(selectedHour),
    });

    return res.json({
      success: true,
      data: {
        location,
        checkedAt: new Date(),
        ...risk,
      },
    });
  } catch (error) {
    console.error("Check location risk error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check location risk.",
      error: error.message,
    });
  }
}

module.exports = {
  checkLocationRisk,
};