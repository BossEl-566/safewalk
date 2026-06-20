import { IncidentReport } from "../types/incident";
import {
  WalkSafeLocation,
  WalkSafeNearbyRisk,
  WalkSafeRiskLevel,
} from "../types/walkSafe";

type GetNearbyRiskWarningsParams = {
  currentLocation: WalkSafeLocation;
  reports: IncidentReport[];
  radiusMeters?: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(
  pointA: WalkSafeLocation,
  pointB: WalkSafeLocation
) {
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

function getRiskLevel(score: number): WalkSafeRiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function getNearbyRiskWarnings({
  currentLocation,
  reports,
  radiusMeters = 800,
}: GetNearbyRiskWarningsParams): WalkSafeNearbyRisk[] {
  return reports
    .filter((report) => report.location?.latitude && report.location?.longitude)
    .map((report) => {
      const reportLocation = {
        latitude: report.location!.latitude,
        longitude: report.location!.longitude,
        accuracy: report.location!.accuracy,
      };

      const distanceMeters = getDistanceMeters(currentLocation, reportLocation);

      return {
        report,
        distanceMeters,
      };
    })
    .filter(({ report, distanceMeters }) => {
      return distanceMeters <= radiusMeters && report.aiRiskScore >= 40;
    })
    .map(({ report, distanceMeters }) => ({
      reportId: report.id,
      title: report.title,
      locationName: report.locationName || "Unknown location",
      description: report.description,
      aiRiskScore: report.aiRiskScore,
      riskLevel: getRiskLevel(report.aiRiskScore),
      distanceMeters: Math.round(distanceMeters),
    }))
    .sort((a, b) => {
      if (b.aiRiskScore !== a.aiRiskScore) {
        return b.aiRiskScore - a.aiRiskScore;
      }

      return a.distanceMeters - b.distanceMeters;
    });
}