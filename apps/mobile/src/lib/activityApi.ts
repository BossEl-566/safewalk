import { IncidentReport } from "../types/incident";
import { WalkSafeSession } from "../types/walkSafe";
import { getIncidentReportsApi } from "./incidentApi";
import { getSOSAlertsApi } from "./sosApi";
import { getWalkSafeSessionsApi } from "./walkSafeApi";

export type ActivityType = "sos" | "walk_safe" | "incident";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  description: string;
  status?: string;
  riskScore?: number;
  createdAt: string;
};

type BackendSOSAlert = {
  id?: string;
  _id?: string;
  userName?: string;
  status?: "active" | "cancelled" | "resolved";
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  } | null;
  message?: string;
  trustedContactName?: string;
  trustedContactPhone?: string;
  source?: "sos_button" | "walk_safe" | "manual";
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
};

function normalizeSOSActivity(alert: BackendSOSAlert): ActivityItem {
  return {
    id: alert.id ?? alert._id ?? String(Date.now()),
    type: "sos",
    title: "SOS Alert",
    subtitle: `${alert.status ?? "active"} emergency alert`,
    description: alert.message ?? "Emergency alert created.",
    status: alert.status ?? "active",
    createdAt: alert.createdAt ?? new Date().toISOString(),
  };
}

export async function getActivityHistoryApi(): Promise<ActivityItem[]> {
  const [incidentReports, sosResponse, walkSafeSessions]: [
    IncidentReport[],
    { data?: BackendSOSAlert[] },
    WalkSafeSession[]
  ] = await Promise.all([
    getIncidentReportsApi(),
    getSOSAlertsApi(),
    getWalkSafeSessionsApi(),
  ]);

  const sosAlerts: BackendSOSAlert[] = sosResponse?.data ?? [];

  const incidentActivities: ActivityItem[] = incidentReports.map(
    (report: IncidentReport) => ({
      id: report.id,
      type: "incident",
      title: report.title,
      subtitle: report.locationName || "Incident report",
      description: report.aiSummary || report.description,
      status: report.status,
      riskScore: report.aiRiskScore,
      createdAt: report.createdAt,
    })
  );

  const sosActivities: ActivityItem[] = sosAlerts.map(
    (alert: BackendSOSAlert) => normalizeSOSActivity(alert)
  );

  const walkActivities: ActivityItem[] = walkSafeSessions.map(
    (session: WalkSafeSession) => ({
      id: session.id,
      type: "walk_safe",
      title: session.mode === "walk_home" ? "Walk Home Session" : "Walk Safe Session",
      subtitle: `${session.status} • ${session.destinationName}`,
      description: `Trusted contact: ${
        session.trustedContactName
      }. Risk level: ${session.riskLevel.toUpperCase()}.`,
      status: session.status,
      createdAt: session.startedAt,
    })
  );

  return [...incidentActivities, ...sosActivities, ...walkActivities].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}