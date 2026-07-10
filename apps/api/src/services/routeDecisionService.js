function formatDistance(meters = 0) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}

function formatDuration(duration = "") {
  if (!duration) return "unknown time";

  const seconds = Number(String(duration).replace("s", ""));

  if (Number.isNaN(seconds)) return duration;

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function getRiskLabel(score) {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function explainAlternative(route, recommendedRoute) {
  const reasons = [];

  if (route.riskScore > recommendedRoute.riskScore) {
    reasons.push(
      `higher risk score (${route.riskScore}/100 compared with ${recommendedRoute.riskScore}/100)`
    );
  }

  if (
    route.nearbyReports?.length > recommendedRoute.nearbyReports?.length
  ) {
    reasons.push(
      `more nearby incident reports (${route.nearbyReports.length} compared with ${recommendedRoute.nearbyReports.length})`
    );
  }

  if (route.distanceMeters > recommendedRoute.distanceMeters) {
    reasons.push(
      `longer distance (${formatDistance(route.distanceMeters)} compared with ${formatDistance(recommendedRoute.distanceMeters)})`
    );
  }

  if (reasons.length === 0) {
    reasons.push("slightly less balanced safety and distance score");
  }

  return `Not selected because it has ${reasons.join(", ")}.`;
}

function buildRouteDecisionExplanation({ recommendedRoute, routes }) {
  if (!recommendedRoute) {
    return {
      summary: "SafeWalk AI could not select a recommended route.",
      selectedReasons: [],
      comparisonPoints: [],
      alternatives: [],
    };
  }

  const routeCount = routes.length;
  const nearbyIncidentCount = recommendedRoute.nearbyReports?.length || 0;
  const riskLevel = recommendedRoute.riskLevel || getRiskLabel(recommendedRoute.riskScore);

  const selectedReasons = [];

  selectedReasons.push(
    `This route has a ${riskLevel} risk level with a score of ${recommendedRoute.riskScore}/100.`
  );

  if (nearbyIncidentCount === 0) {
    selectedReasons.push("No major incident report was found close to this route.");
  } else {
    selectedReasons.push(
      `${nearbyIncidentCount} incident report(s) were found near this route.`
    );
  }

  selectedReasons.push(
    `Estimated distance is ${formatDistance(recommendedRoute.distanceMeters)}.`
  );

  selectedReasons.push(
    `Estimated travel time is ${formatDuration(recommendedRoute.duration)}.`
  );

  if (recommendedRoute.reasons?.length > 0) {
    selectedReasons.push(...recommendedRoute.reasons.slice(0, 3));
  }

  const safestRoute = [...routes].sort(
    (a, b) => a.riskScore - b.riskScore
  )[0];

  const shortestRoute = [...routes].sort(
    (a, b) => a.distanceMeters - b.distanceMeters
  )[0];

  const fastestRoute = [...routes].sort((a, b) => {
    const aSeconds = Number(String(a.duration || "0s").replace("s", ""));
    const bSeconds = Number(String(b.duration || "0s").replace("s", ""));
    return aSeconds - bSeconds;
  })[0];

  const comparisonPoints = [];

  if (safestRoute?.routeIndex === recommendedRoute.routeIndex) {
    comparisonPoints.push("Selected route is the safest available route.");
  }

  if (shortestRoute?.routeIndex !== recommendedRoute.routeIndex) {
    comparisonPoints.push(
      "SafeWalk AI prioritized safety over the shortest distance."
    );
  } else {
    comparisonPoints.push(
      "Selected route is also the shortest route among the available options."
    );
  }

  if (fastestRoute?.routeIndex !== recommendedRoute.routeIndex) {
    comparisonPoints.push(
      "SafeWalk AI did not choose the fastest route because safety risk was considered more important."
    );
  } else {
    comparisonPoints.push(
      "Selected route is also the fastest route among the available options."
    );
  }

  const alternatives = routes.map((route, index) => ({
    routeIndex: route.routeIndex,
    label:
      route.routeIndex === recommendedRoute.routeIndex
        ? `Recommended route`
        : `Alternative route ${index + 1}`,
    riskScore: route.riskScore,
    riskLevel: route.riskLevel,
    distance: formatDistance(route.distanceMeters),
    duration: formatDuration(route.duration),
    nearbyIncidentCount: route.nearbyReports?.length || 0,
    selected: route.routeIndex === recommendedRoute.routeIndex,
    explanation:
      route.routeIndex === recommendedRoute.routeIndex
        ? "Selected because it gives the best balance of safety, distance, and travel time."
        : explainAlternative(route, recommendedRoute),
  }));

  return {
    summary: `SafeWalk AI compared ${routeCount} route option(s) and selected the route with the best safety balance for the student.`,
    selectedReasons,
    comparisonPoints,
    alternatives,
  };
}

module.exports = {
  buildRouteDecisionExplanation,
};