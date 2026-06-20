import {
  IncidentAreaType,
  IncidentCategory,
  IncidentLocation,
  IncidentReport,
  IncidentSeverity,
} from "../types/incident";
import { api } from "./api";

export type CreateIncidentReportPayload = {
  category: IncidentCategory;
  description: string;
  severity: IncidentSeverity;
  areaType: IncidentAreaType;
  location: IncidentLocation | null;
  locationName?: string;
  victimWasAlone: boolean;
  weaponInvolved: boolean;
  attackerMode?: string;
  lightingCondition?: string;
  anonymous: boolean;
};

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

export async function createIncidentReportApi(
  payload: CreateIncidentReportPayload
) {
  const response = await api.post("/incidents", payload);
  return response.data;
}

export async function getIncidentReportsApi() {
  const response = await api.get("/incidents");

  const reports = response.data?.data ?? [];

  return reports.map(normalizeIncidentReport);
}

export async function getRiskStatsApi() {
  const response = await api.get("/incidents/stats");
  return response.data;
}

export async function deleteIncidentReportApi(reportId: string) {
  const response = await api.delete(`/incidents/${reportId}`);
  return response.data;
}