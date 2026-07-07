function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(pointA, pointB) {
  const earthRadiusMeters = 6371000;

  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const deltaLat = toRadians(pointB.latitude - pointA.latitude);
  const deltaLng = toRadians(pointB.longitude - pointA.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

function getRiskLevel(score) {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function isNightHour(hour) {
  return hour >= 18 || hour <= 5;
}

function analyzeLocationRisk({
  location,
  reports,
  radiusMeters = 220,
  selectedHour = new Date().getHours(),
}) {
  const nearbyIncidents = [];

  for (const report of reports) {
    if (!report.location?.latitude || !report.location?.longitude) continue;

    const reportPoint = {
      latitude: report.location.latitude,
      longitude: report.location.longitude,
    };

    const distance = getDistanceMeters(location, reportPoint);

    if (distance <= radiusMeters) {
      nearbyIncidents.push({
        report,
        distanceMeters: Math.round(distance),
      });
    }
  }

  let riskScore = 10;

  for (const item of nearbyIncidents) {
    const report = item.report;

    if (report.severity === "critical") riskScore += 30;
    if (report.severity === "high") riskScore += 22;
    if (report.severity === "medium") riskScore += 12;
    if (report.severity === "low") riskScore += 5;

    if (report.category === "robbery") riskScore += 18;
    if (report.category === "phone_snatch") riskScore += 16;
    if (report.category === "forced_momo_withdrawal") riskScore += 18;
    if (report.category === "suspicious_motorbike") riskScore += 12;
    if (report.category === "poor_lighting") riskScore += 8;

    if (report.weaponInvolved) riskScore += 10;
    if (report.victimWasAlone) riskScore += 6;

    if (typeof report.aiRiskScore === "number") {
      riskScore += Math.min(20, report.aiRiskScore * 0.2);
    }
  }

  if (isNightHour(Number(selectedHour))) {
    riskScore += 12;
  }

  riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

  const warnings = [];

  if (nearbyIncidents.length > 0) {
    warnings.push(
      `${nearbyIncidents.length} incident report(s) found near your current location.`
    );
  }

  if (
    nearbyIncidents.some((item) => item.report.category === "phone_snatch")
  ) {
    warnings.push("Phone-snatching has been reported around this area.");
  }

  if (nearbyIncidents.some((item) => item.report.category === "robbery")) {
    warnings.push("Robbery-related incidents have been reported nearby.");
  }

  if (isNightHour(Number(selectedHour))) {
    warnings.push("Current travel time is during evening/night hours.");
  }

  if (warnings.length === 0) {
    warnings.push("No strong danger pattern detected around your current area.");
  }

  return {
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    radiusMeters,
    nearbyIncidentCount: nearbyIncidents.length,
    warnings,
    nearbyIncidents: nearbyIncidents.slice(0, 8).map((item) => ({
      id: item.report._id || item.report.id,
      title: item.report.title,
      category: item.report.category,
      severity: item.report.severity,
      locationName: item.report.locationName,
      aiRiskScore: item.report.aiRiskScore,
      distanceMeters: item.distanceMeters,
      location: item.report.location
        ? {
            latitude: item.report.location.latitude,
            longitude: item.report.location.longitude,
          }
        : null,
    })),
  };
}

module.exports = {
  getDistanceMeters,
  analyzeLocationRisk,
};