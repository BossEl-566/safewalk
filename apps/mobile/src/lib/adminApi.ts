import { IncidentReport } from "../types/incident";
import { WalkSafeSession } from "../types/walkSafe";
import { api } from "./api";

export type AdminSOSAlert = {
  id: string;
  _id?: string;
  userName: string;
  status: "active" | "cancelled" | "resolved";
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  } | null;
  message: string;
  trustedContactName?: string;
  trustedContactPhone?: string;
  source?: "sos_button" | "walk_safe" | "manual";
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
};

export type AdminOverviewStats = {
  // New SafeCampus AI stats
  totalReports: number;
  openReports: number;
  assignedReports: number;
  inProgressReports: number;
  resolvedReports: number;
  escalatedReports: number;
  urgentCampusReports: number;
  criticalReports: number;

  // Legacy names kept so older screens do not break
  totalIncidents: number;
  highRiskIncidents: number;
  criticalIncidents: number;

  activeSOSAlerts: number;
  resolvedSOSAlerts: number;
  cancelledSOSAlerts: number;

  activeWalkSafeSessions: number;
  completedWalkSafeSessions: number;
  cancelledWalkSafeSessions: number;
};

export type AdminOverview = {
  stats: AdminOverviewStats;

  // New SafeCampus AI names
  openCampusReports: IncidentReport[];
  urgentCampusReports: IncidentReport[];

  // Legacy names
  activeSOSAlerts: AdminSOSAlert[];
  highRiskReports: IncidentReport[];
  activeWalkSafeSessions: WalkSafeSession[];
};

function normalizeSOSAlert(alert: any): AdminSOSAlert {
  return {
    id: alert.id ?? alert._id ?? String(Date.now()),
    _id: alert._id,
    userName: alert.userName ?? "SafeCampus User",
    status: alert.status ?? "active",
    location: alert.location ?? null,
    message: alert.message ?? "",
    trustedContactName: alert.trustedContactName ?? "",
    trustedContactPhone: alert.trustedContactPhone ?? "",
    source: alert.source ?? "sos_button",
    createdAt: alert.createdAt ?? new Date().toISOString(),
    updatedAt: alert.updatedAt,
    resolvedAt: alert.resolvedAt,
  };
}

function normalizeIncidentReport(report: any): IncidentReport {
  return {
    id: report.id ?? report._id ?? String(Date.now()),
    _id: report._id,

    institutionId: report.institutionId ?? "university-of-ghana",
    institutionName: report.institutionName ?? "University of Ghana",
    campusName: report.campusName ?? "Legon Campus",

    category: report.category ?? "other",
    problemType: report.problemType ?? "",
    title: report.title ?? "Campus issue report",
    description: report.description ?? "",

    severity: report.severity ?? "medium",
    priority: report.priority ?? report.severity ?? "medium",
    priorityScore: Number(report.priorityScore ?? report.aiRiskScore ?? 0),

    areaType: report.areaType ?? "on_campus",

    location: report.location ?? null,
    locationName: report.locationName ?? "",
    buildingName: report.buildingName ?? "",
    roomNumber: report.roomNumber ?? "",
    landmark: report.landmark ?? "",

    evidence: report.evidence ?? [],

    reporterName: report.reporterName ?? "",
    reporterPhone: report.reporterPhone ?? "",
    reporterEmail: report.reporterEmail ?? "",
    reporterStudentId: report.reporterStudentId ?? "",
    anonymous: Boolean(report.anonymous),

    status: report.status ?? "ai_reviewed",

    assignedUnit: report.assignedUnit ?? report.aiSuggestedUnit ?? "",
    assignedToName: report.assignedToName ?? "",

    acceptedAt: report.acceptedAt ?? null,
    assignedAt: report.assignedAt ?? null,
    inProgressAt: report.inProgressAt ?? null,
    resolvedAt: report.resolvedAt ?? null,
    closedAt: report.closedAt ?? null,

    escalationLevel: Number(report.escalationLevel ?? 0),

    aiRiskScore: Number(report.aiRiskScore ?? report.priorityScore ?? 0),
    aiSummary: report.aiSummary ?? "",
    aiRecommendedAction: report.aiRecommendedAction ?? "",
    aiSuggestedUnit: report.aiSuggestedUnit ?? report.assignedUnit ?? "",
    aiDuplicateKey: report.aiDuplicateKey ?? "",
    duplicateCount: Number(report.duplicateCount ?? 1),

    resolutionSummary: report.resolutionSummary ?? "",
    resolutionEvidence: report.resolutionEvidence ?? [],

    statusHistory: report.statusHistory ?? [],

    occurredAt: report.occurredAt ?? report.createdAt ?? new Date().toISOString(),
    createdAt: report.createdAt ?? new Date().toISOString(),
    updatedAt: report.updatedAt,

    victimWasAlone: Boolean(report.victimWasAlone),
    weaponInvolved: Boolean(report.weaponInvolved),
    attackerMode: report.attackerMode ?? "",
    lightingCondition: report.lightingCondition ?? "",
  };
}

function normalizeWalkSafeSession(session: any): WalkSafeSession {
  return {
    id: session.id ?? session._id ?? String(Date.now()),
    backendId: session._id ?? session.id,

    mode: session.mode ?? "walk_safe",
    status: session.status ?? "active",

    startLocation: session.startLocation ?? null,
    destinationName: session.destinationName ?? "",

    trustedContactId: session.trustedContactId ?? "",
    trustedContactName: session.trustedContactName ?? "",
    trustedContactPhone: session.trustedContactPhone ?? "",

    expectedDurationMinutes: Number(session.expectedDurationMinutes ?? 0),
    startedAt: session.startedAt ?? session.createdAt ?? new Date().toISOString(),
    expectedArrivalAt:
      session.expectedArrivalAt ?? session.createdAt ?? new Date().toISOString(),

    lastCheckInAt: session.lastCheckInAt ?? undefined,
    completedAt: session.completedAt ?? undefined,
    cancelledAt: session.cancelledAt ?? undefined,

    riskLevel: session.riskLevel ?? "low",
    nearbyRiskWarnings: session.nearbyRiskWarnings ?? [],
  };
}

export async function getAdminOverviewApi(): Promise<AdminOverview> {
  const response = await api.get("/admin/overview");

  const data = response.data?.data;

  const openCampusReports = (data?.openCampusReports ?? []).map(
    normalizeIncidentReport
  );

  const urgentCampusReports = (data?.urgentCampusReports ?? []).map(
    normalizeIncidentReport
  );

  return {
    stats: {
      totalReports: Number(data?.stats?.totalReports ?? data?.stats?.totalIncidents ?? 0),
      openReports: Number(data?.stats?.openReports ?? 0),
      assignedReports: Number(data?.stats?.assignedReports ?? 0),
      inProgressReports: Number(data?.stats?.inProgressReports ?? 0),
      resolvedReports: Number(data?.stats?.resolvedReports ?? 0),
      escalatedReports: Number(data?.stats?.escalatedReports ?? 0),
      urgentCampusReports: Number(
        data?.stats?.urgentCampusReports ?? data?.stats?.highRiskIncidents ?? 0
      ),
      criticalReports: Number(
        data?.stats?.criticalReports ?? data?.stats?.criticalIncidents ?? 0
      ),

      totalIncidents: Number(data?.stats?.totalIncidents ?? data?.stats?.totalReports ?? 0),
      highRiskIncidents: Number(
        data?.stats?.highRiskIncidents ?? data?.stats?.urgentCampusReports ?? 0
      ),
      criticalIncidents: Number(
        data?.stats?.criticalIncidents ?? data?.stats?.criticalReports ?? 0
      ),

      activeSOSAlerts: Number(data?.stats?.activeSOSAlerts ?? 0),
      resolvedSOSAlerts: Number(data?.stats?.resolvedSOSAlerts ?? 0),
      cancelledSOSAlerts: Number(data?.stats?.cancelledSOSAlerts ?? 0),

      activeWalkSafeSessions: Number(data?.stats?.activeWalkSafeSessions ?? 0),
      completedWalkSafeSessions: Number(
        data?.stats?.completedWalkSafeSessions ?? 0
      ),
      cancelledWalkSafeSessions: Number(
        data?.stats?.cancelledWalkSafeSessions ?? 0
      ),
    },

    openCampusReports,
    urgentCampusReports,

    activeSOSAlerts: (data?.activeSOSAlerts ?? []).map(normalizeSOSAlert),
    highRiskReports: (data?.highRiskReports ?? urgentCampusReports).map(
      normalizeIncidentReport
    ),
    activeWalkSafeSessions: (data?.activeWalkSafeSessions ?? []).map(
      normalizeWalkSafeSession
    ),
  };
}