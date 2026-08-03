import { IncidentReport } from "../types/incident";

export type IssueLevel = "low" | "medium" | "high" | "critical";

export type RiskLevel = IssueLevel;

export function getIssueLevel(score: number): IssueLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function getRiskLevelLabel(score: number) {
  const level = getIssueLevel(score);

  if (level === "critical") return "Critical";
  if (level === "high") return "High priority";
  if (level === "medium") return "Medium priority";
  return "Low priority";
}

export function getIssueStatusLabel(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

export function getRiskStats(reports: IncidentReport[]) {
  const totalReports = reports.length;

  const openReports = reports.filter((report) =>
    ["pending", "submitted", "ai_reviewed", "assigned", "in_progress", "escalated"].includes(
      report.status
    )
  ).length;

  const resolvedReports = reports.filter((report) =>
    ["resolved", "student_confirmed", "closed"].includes(report.status)
  ).length;

  const escalatedReports = reports.filter(
    (report) => report.status === "escalated" || Number(report.escalationLevel ?? 0) > 0
  ).length;

  const criticalReports = reports.filter(
    (report) =>
      report.priority === "critical" ||
      report.aiRiskScore >= 85 ||
      Number(report.priorityScore ?? 0) >= 85
  ).length;

  const urgentReports = reports.filter(
    (report) =>
      report.priority === "high" ||
      report.priority === "critical" ||
      report.aiRiskScore >= 70 ||
      Number(report.priorityScore ?? 0) >= 70
  ).length;

  const averageRiskScore =
    totalReports === 0
      ? 0
      : Math.round(
          reports.reduce(
            (sum, report) =>
              sum + Number(report.priorityScore ?? report.aiRiskScore ?? 0),
            0
          ) / totalReports
        );

  return {
    totalReports,
    openReports,
    resolvedReports,
    escalatedReports,
    criticalReports,
    urgentReports,
    averageRiskScore,
  };
}

export function getTopIncidentPattern(reports: IncidentReport[]) {
  const counts: Record<string, number> = {};

  reports.forEach((report) => {
    const key = report.problemType || report.title || report.category;
    counts[key] = (counts[key] || 0) + 1;
  });

  const top =
    Object.entries(counts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)[0] ?? null;

  return top;
}

export function getTopCampusLocation(reports: IncidentReport[]) {
  const counts: Record<string, number> = {};

  reports.forEach((report) => {
    const key =
      report.locationName ||
      report.buildingName ||
      report.landmark ||
      "Unknown location";

    counts[key] = (counts[key] || 0) + 1;
  });

  return (
    Object.entries(counts)
      .map(([locationName, count]) => ({ locationName, count }))
      .sort((a, b) => b.count - a.count)[0] ?? null
  );
}

export function isOpenReport(report: IncidentReport) {
  return ["pending", "submitted", "ai_reviewed", "assigned", "in_progress", "escalated"].includes(
    report.status
  );
}

export function isResolvedReport(report: IncidentReport) {
  return ["resolved", "student_confirmed", "closed"].includes(report.status);
}