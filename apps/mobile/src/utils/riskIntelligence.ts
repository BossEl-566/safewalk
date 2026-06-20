import { IncidentReport } from "../types/incident";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskInsight = {
  title: string;
  description: string;
  riskLevel: RiskLevel;
  riskScore: number;
};

export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function getRiskLevelLabel(score: number) {
  const level = getRiskLevelFromScore(score);

  if (level === "critical") return "Critical";
  if (level === "high") return "High";
  if (level === "medium") return "Medium";
  return "Low";
}

export function getRiskStats(reports: IncidentReport[]) {
  const totalReports = reports.length;

  const highRiskReports = reports.filter(
    (report) => report.aiRiskScore >= 70
  ).length;

  const criticalReports = reports.filter(
    (report) => report.aiRiskScore >= 85
  ).length;

  const averageRiskScore =
    totalReports === 0
      ? 0
      : Math.round(
          reports.reduce((sum, report) => sum + report.aiRiskScore, 0) /
            totalReports
        );

  return {
    totalReports,
    highRiskReports,
    criticalReports,
    averageRiskScore,
  };
}

export function getTopIncidentPattern(reports: IncidentReport[]) {
  if (reports.length === 0) return null;

  const counts: Record<string, number> = {};

  reports.forEach((report) => {
    counts[report.title] = (counts[report.title] ?? 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return {
    title: sorted[0][0],
    count: sorted[0][1],
  };
}

export function getHighRiskReports(reports: IncidentReport[]) {
  return [...reports]
    .filter((report) => report.aiRiskScore >= 70)
    .sort((a, b) => b.aiRiskScore - a.aiRiskScore);
}

export function getRecentReports(reports: IncidentReport[]) {
  return [...reports].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getLocationInsights(reports: IncidentReport[]): RiskInsight[] {
  const grouped: Record<string, IncidentReport[]> = {};

  reports.forEach((report) => {
    const locationKey =
      report.locationName?.trim().toLowerCase() || "unknown location";

    grouped[locationKey] = [...(grouped[locationKey] ?? []), report];
  });

  return Object.entries(grouped)
    .map(([location, locationReports]) => {
      const averageScore = Math.round(
        locationReports.reduce((sum, report) => sum + report.aiRiskScore, 0) /
          locationReports.length
      );

      const mostCommonIncident = getTopIncidentPattern(locationReports);

      return {
        title:
          location === "unknown location"
            ? "Unknown location"
            : capitalizeWords(location),
        description: `${locationReports.length} report${
          locationReports.length > 1 ? "s" : ""
        } recorded. Most common issue: ${
          mostCommonIncident?.title ?? "Unknown"
        }.`,
        riskLevel: getRiskLevelFromScore(averageScore),
        riskScore: averageScore,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

function capitalizeWords(value: string) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}