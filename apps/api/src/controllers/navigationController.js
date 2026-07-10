const IncidentReport = require("../models/IncidentReport");
const { getRouteFromGoogle } = require("../services/googleMapsService");
const { scoreRouteRisk } = require("../services/routeRiskService");
const {
  buildRouteDecisionExplanation,
} = require("../services/routeDecisionService");

async function calculateSafeNavigationRoute(req, res) {
  try {
    const {
      origin,
      destination,
      travelMode = "WALK",
      selectedHour = new Date().getHours(),
    } = req.body;

    if (!origin?.latitude || !origin?.longitude) {
      return res.status(400).json({
        success: false,
        message: "Origin latitude and longitude are required.",
      });
    }

    if (!destination?.latitude || !destination?.longitude) {
      return res.status(400).json({
        success: false,
        message: "Destination latitude and longitude are required.",
      });
    }

    const [googleRoutes, reports] = await Promise.all([
      getRouteFromGoogle({
        origin,
        destination,
        travelMode,
      }),
      IncidentReport.find({}).sort({ createdAt: -1 }).limit(300),
    ]);

    const scoredRoutes = googleRoutes.map((route) => {
      const risk = scoreRouteRisk({
        routeCoordinates: route.coordinates,
        reports,
        selectedHour,
      });

      return {
        ...route,
        ...risk,
      };
    });

    scoredRoutes.sort((a, b) => {
      if (a.riskScore !== b.riskScore) return a.riskScore - b.riskScore;
      return a.distanceMeters - b.distanceMeters;
    });

   const recommendedRoute = scoredRoutes[0] || null;

const decisionExplanation = buildRouteDecisionExplanation({
  recommendedRoute,
  routes: scoredRoutes,
});

return res.json({
  success: true,
  data: {
    recommendedRoute,
    routes: scoredRoutes,
    decisionExplanation,
  },
});
  } catch (error) {
    console.error("Calculate safe navigation route error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate safe navigation route.",
      error: error.message,
    });
  }
}

module.exports = {
  calculateSafeNavigationRoute,
};