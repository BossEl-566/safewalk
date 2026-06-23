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

function findReportsNearRoute({
  routeCoordinates,
  reports,
  radiusMeters = 150,
}) {
  const matches = [];

  for (const report of reports) {
    if (!report.location?.latitude || !report.location?.longitude) continue;

    const reportPoint = {
      latitude: report.location.latitude,
      longitude: report.location.longitude,
    };

    const nearestDistance = routeCoordinates.reduce((closest, coordinate) => {
      const distance = getDistanceMeters(reportPoint, coordinate);
      return Math.min(closest, distance);
    }, Number.POSITIVE_INFINITY);

    if (nearestDistance <= radiusMeters) {
      matches.push({
        report,
        distanceFromRouteMeters: Math.round(nearestDistance),
      });
    }
  }

  return matches;
}

function scoreRouteRisk({
  routeCoordinates,
  reports,
  selectedHour = new Date().getHours(),
}) {
  const nearbyReports = findReportsNearRoute({
    routeCoordinates,
    reports,
    radiusMeters: 180,
  });

  let score = 15;

  for (const item of nearbyReports) {
    const report = item.report;

    score += Math.min(25, Number(report.aiRiskScore || 0) * 0.25);

    if (report.severity === "critical") score += 18;
    if (report.severity === "high") score += 13;
    if (report.severity === "medium") score += 7;

    if (report.category === "phone_snatch") score += 8;
    if (report.category === "robbery") score += 10;
    if (report.category === "forced_momo_withdrawal") score += 10;
    if (report.category === "suspicious_motorbike") score += 7;
    if (report.category === "poor_lighting") score += 5;

    if (report.victimWasAlone) score += 4;
    if (report.weaponInvolved) score += 6;
  }

  if (isNightHour(Number(selectedHour))) {
    score += 8;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const reasons = [];

  if (nearbyReports.length > 0) {
    reasons.push(`${nearbyReports.length} incident report(s) found near this route.`);
  }

  const phoneSnatchReports = nearbyReports.filter(
    (item) => item.report.category === "phone_snatch"
  );

  if (phoneSnatchReports.length > 0) {
    reasons.push(`${phoneSnatchReports.length} phone-snatching report(s) near route.`);
  }

  const motorbikeReports = nearbyReports.filter((item) =>
    `${item.report.attackerMode || ""} ${item.report.description || ""}`
      .toLowerCase()
      .includes("motor")
  );

  if (motorbikeReports.length > 0) {
    reasons.push(`${motorbikeReports.length} motorbike-related report(s) near route.`);
  }

  if (isNightHour(Number(selectedHour))) {
    reasons.push("Travel time is during evening/night hours.");
  }

  if (reasons.length === 0) {
    reasons.push("No strong danger pattern found near this route.");
  }

  return {
    riskScore: score,
    riskLevel: getRiskLevel(score),
    nearbyReports: nearbyReports.map((item) => ({
      id: item.report._id || item.report.id,
      title: item.report.title,
      category: item.report.category,
      severity: item.report.severity,
      locationName: item.report.locationName,
      aiRiskScore: item.report.aiRiskScore,
      distanceFromRouteMeters: item.distanceFromRouteMeters,
    })),
    reasons,
  };
}

module.exports = {
  getDistanceMeters,
  findReportsNearRoute,
  scoreRouteRisk,
};