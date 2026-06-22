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
  activeSOSAlerts: AdminSOSAlert[];
  highRiskReports: IncidentReport[];
  activeWalkSafeSessions: WalkSafeSession[];
};

function normalizeSOSAlert(alert: any): AdminSOSAlert {
  return {
    id: alert.id ?? alert._id ?? String(Date.now()),
    _id: alert._id,
    userName: alert.userName ?? "SafeWalk User",
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
    category: report.category ?? "other",
    title: report.title ?? "Safety report",
    description: report.description ?? "",
    severity: report.severity ?? "medium",
    areaType: report.areaType ?? "unknown",

    location: report.location ?? null,
    locationName: report.locationName ?? "",

    victimWasAlone: Boolean(report.victimWasAlone),
    weaponInvolved: Boolean(report.weaponInvolved),
    attackerMode: report.attackerMode ?? "",
    lightingCondition: report.lightingCondition ?? "",

    anonymous: Boolean(report.anonymous),
    status: report.status ?? "pending",

    aiRiskScore: Number(report.aiRiskScore ?? 0),
    aiSummary: report.aiSummary ?? "",

    occurredAt: report.occurredAt ?? report.createdAt ?? new Date().toISOString(),
    createdAt: report.createdAt ?? new Date().toISOString(),
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

  return {
    stats: {
      totalIncidents: Number(data?.stats?.totalIncidents ?? 0),
      highRiskIncidents: Number(data?.stats?.highRiskIncidents ?? 0),
      criticalIncidents: Number(data?.stats?.criticalIncidents ?? 0),

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

    activeSOSAlerts: (data?.activeSOSAlerts ?? []).map(normalizeSOSAlert),
    highRiskReports: (data?.highRiskReports ?? []).map(normalizeIncidentReport),
    activeWalkSafeSessions: (data?.activeWalkSafeSessions ?? []).map(
      normalizeWalkSafeSession
    ),
  };
}