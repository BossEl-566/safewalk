const IncidentReport = require("../models/IncidentReport");
const SafeRouteRecommendation = require("../models/SafeRouteRecommendation");

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function getRiskLevel(score) {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function getSeverityWeight(severity) {
  if (severity === "critical") return 18;
  if (severity === "high") return 14;
  if (severity === "medium") return 9;
  return 4;
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function getKeywords(text) {
  return normalizeText(text)
    .split(/[\s,.-]+/)
    .filter((word) => word.length >= 3);
}

function reportMatchesRoute(report, startName, destinationName, areaType) {
  const routeKeywords = [
    ...getKeywords(startName),
    ...getKeywords(destinationName),
  ];

  const reportText = normalizeText(
    [
      report.locationName,
      report.description,
      report.category,
      report.areaType,
      report.attackerMode,
      report.lightingCondition,
    ].join(" ")
  );

  const keywordMatch = routeKeywords.some((word) => reportText.includes(word));

  if (keywordMatch) return true;

  if (areaType !== "unknown" && report.areaType === areaType) return true;

  return false;
}

function getIncidentHour(report) {
  const date = report.occurredAt || report.createdAt;

  if (!date) return null;

  return new Date(date).getHours();
}

function isNightHour(hour) {
  return hour >= 18 || hour <= 5;
}

function getPatternReasons(reports, selectedHour) {
  const reasons = [];

  const phoneSnatchCount = reports.filter(
    (report) => report.category === "phone_snatch"
  ).length;

  const motorbikeCount = reports.filter((report) =>
    normalizeText(report.attackerMode || report.description).includes("motor")
  ).length;

  const poorLightingCount = reports.filter((report) =>
    normalizeText(report.lightingCondition || report.description).includes("poor")
  ).length;

  const robberyCount = reports.filter(
    (report) =>
      report.category === "robbery" ||
      report.category === "forced_momo_withdrawal"
  ).length;

  const similarTimeCount = reports.filter((report) => {
    const incidentHour = getIncidentHour(report);

    if (incidentHour === null || selectedHour === null) return false;

    return Math.abs(incidentHour - selectedHour) <= 2;
  }).length;

  if (phoneSnatchCount > 0) {
    reasons.push(`${phoneSnatchCount} phone-snatching related report(s) found.`);
  }

  if (motorbikeCount > 0) {
    reasons.push(`${motorbikeCount} report(s) mention motorbike activity.`);
  }

  if (poorLightingCount > 0) {
    reasons.push(`${poorLightingCount} report(s) mention poor lighting.`);
  }

  if (robberyCount > 0) {
    reasons.push(`${robberyCount} robbery or forced-withdrawal report(s) found.`);
  }

  if (similarTimeCount > 0) {
    reasons.push(`${similarTimeCount} report(s) happened around this time.`);
  }

  if (reasons.length === 0) {
    reasons.push("No strong incident pattern found for this route yet.");
  }

  return reasons;
}

function calculateBaseRiskScore(reports, selectedHour, travelMode, areaType) {
  let score = 18;

  reports.forEach((report) => {
    score += getSeverityWeight(report.severity);

    if (report.aiRiskScore >= 70) score += 8;
    if (report.aiRiskScore >= 85) score += 10;

    if (report.victimWasAlone) score += 4;
    if (report.weaponInvolved) score += 6;

    if (report.category === "phone_snatch") score += 6;
    if (report.category === "robbery") score += 8;
    if (report.category === "forced_momo_withdrawal") score += 8;
    if (report.category === "suspicious_motorbike") score += 5;
    if (report.category === "poor_lighting") score += 4;

    const incidentHour = getIncidentHour(report);

    if (
      incidentHour !== null &&
      selectedHour !== null &&
      Math.abs(incidentHour - selectedHour) <= 2
    ) {
      score += 5;
    }
  });

  if (selectedHour !== null && isNightHour(selectedHour)) {
    score += 8;
  }

  if (travelMode === "walking") {
    score += 4;
  }

  if (areaType === "off_campus") {
    score += 5;
  }

  return clamp(score);
}

function buildRouteOptions({
  baseRiskScore,
  patternReasons,
  travelMode,
  destinationName,
}) {
  const profiles = [
    {
      routeName: "Fast Shortcut",
      routeType: "shortcut",
      routeDistanceMeters: 900,
      estimatedTimeMinutes: travelMode === "ride" ? 5 : 7,
      modifier: 18,
      reason:
        "Shortest route, but it may pass through quieter or less-monitored areas.",
      recommendation:
        "Use only when the area is familiar, well-lit, and you are not alone.",
    },
    {
      routeName: "Main Road Route",
      routeType: "main_road",
      routeDistanceMeters: 1200,
      estimatedTimeMinutes: travelMode === "ride" ? 8 : 11,
      modifier: 5,
      reason:
        "Uses a more visible road with more people, vehicles, and activity.",
      recommendation:
        "Balanced option when you want a safer route without adding too much time.",
    },
    {
      routeName: "Security Post / Busy Route",
      routeType: "security_route",
      routeDistanceMeters: 1500,
      estimatedTimeMinutes: travelMode === "ride" ? 10 : 14,
      modifier: -12,
      reason:
        "Longer route but preferred when safety is more important than speed.",
      recommendation:
        "Recommended when moving at night or when nearby reports show high risk.",
    },
  ];

  const routes = profiles.map((profile) => {
    const riskScore = clamp(baseRiskScore + profile.modifier);
    const riskLevel = getRiskLevel(riskScore);

    return {
      routeName: profile.routeName,
      routeType: profile.routeType,
      routeDistanceMeters: profile.routeDistanceMeters,
      estimatedTimeMinutes: profile.estimatedTimeMinutes,
      riskScore,
      riskLevel,
      riskReasons: [profile.reason, ...patternReasons],
      recommendation: profile.recommendation,
      isRecommended: false,
    };
  });

  routes.sort((a, b) => {
    if (a.riskScore !== b.riskScore) return a.riskScore - b.riskScore;
    return a.estimatedTimeMinutes - b.estimatedTimeMinutes;
  });

  routes[0].isRecommended = true;
  routes[0].recommendation = `Recommended route to ${destinationName}: ${routes[0].recommendation}`;

  return routes;
}

async function recommendSafeRoute(req, res) {
  try {
    const {
      startName,
      destinationName,
      travelMode = "walking",
      areaType = "unknown",
      selectedHour = new Date().getHours(),
    } = req.body;

    if (!startName || !startName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Start location is required.",
      });
    }

    if (!destinationName || !destinationName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Destination is required.",
      });
    }

    const reports = await IncidentReport.find({})
      .sort({ createdAt: -1 })
      .limit(200);

    const matchingReports = reports.filter((report) =>
      reportMatchesRoute(report, startName, destinationName, areaType)
    );

    const reportsUsed = matchingReports.length > 0 ? matchingReports : reports.slice(0, 20);

    const baseRiskScore = calculateBaseRiskScore(
      reportsUsed,
      Number(selectedHour),
      travelMode,
      areaType
    );

    const patternReasons = getPatternReasons(reportsUsed, Number(selectedHour));

    const routes = buildRouteOptions({
      baseRiskScore,
      patternReasons,
      travelMode,
      destinationName,
    });

    const recommendation = await SafeRouteRecommendation.create({
      startName,
      destinationName,
      travelMode,
      areaType,
      selectedHour: Number(selectedHour),
      incidentCountUsed: reportsUsed.length,
      recommendedRouteName: routes[0].routeName,
      routes,
    });

    return res.status(201).json({
      success: true,
      message: "Safe route recommendation created successfully.",
      data: recommendation,
    });
  } catch (error) {
    console.error("Safe route recommendation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to recommend safe route.",
      error: error.message,
    });
  }
}

async function getSafeRouteHistory(req, res) {
  try {
    const recommendations = await SafeRouteRecommendation.find({})
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    console.error("Get safe route history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch safe route history.",
      error: error.message,
    });
  }
}

module.exports = {
  recommendSafeRoute,
  getSafeRouteHistory,
};