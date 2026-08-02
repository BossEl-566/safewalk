import {
  IncidentAreaType,
  IncidentCategory,
  IncidentLocation,
  IncidentPriority,
  IncidentReport,
  IncidentSeverity,
  IncidentStatus,
  ReportEvidence,
} from "../types/incident";
import { api } from "./api";

export type CreateIncidentReportPayload = {
  category: IncidentCategory;
  description: string;

  severity?: IncidentSeverity;
  priority?: IncidentPriority;
  areaType?: IncidentAreaType;

  location?: IncidentLocation | null;
  locationName?: string;
  buildingName?: string;
  roomNumber?: string;
  landmark?: string;

  evidence?: ReportEvidence[];

  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  reporterStudentId?: string;

  anonymous?: boolean;
  occurredAt?: string;

  /**
   * Legacy fields kept while old screens are still being migrated.
   */
  victimWasAlone?: boolean;
  weaponInvolved?: boolean;
  attackerMode?: string;
  lightingCondition?: string;
};

export type UpdateIncidentStatusPayload = {
  status: IncidentStatus;
  note?: string;
  actorName?: string;
  actorRole?: "student" | "ai" | "authority" | "admin" | "system";
  assignedToName?: string;
  resolutionSummary?: string;
  resolutionEvidence?: ReportEvidence[];
};

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

export async function createIncidentReportApi(
  payload: CreateIncidentReportPayload
) {
  const response = await api.post("/campus-reports", payload);

  return {
    ...response.data,
    data: normalizeIncidentReport(response.data?.data),
  };
}

export async function getIncidentReportsApi(params?: {
  category?: IncidentCategory;
  status?: IncidentStatus;
  priority?: IncidentPriority;
  assignedUnit?: string;
  minRiskScore?: number;
  limit?: number;
}) {
  const response = await api.get("/campus-reports", {
    params,
  });

  const reports = response.data?.data ?? [];

  return reports.map(normalizeIncidentReport);
}

export async function getIncidentReportByIdApi(reportId: string) {
  const response = await api.get(`/campus-reports/${reportId}`);

  return normalizeIncidentReport(response.data?.data);
}

export async function updateIncidentReportStatusApi(
  reportId: string,
  payload: UpdateIncidentStatusPayload
) {
  const response = await api.patch(`/campus-reports/${reportId}/status`, payload);

  return {
    ...response.data,
    data: normalizeIncidentReport(response.data?.data),
  };
}

export async function getRiskStatsApi() {
  const response = await api.get("/campus-reports/stats");

  return response.data;
}

export async function deleteIncidentReportApi(reportId: string) {
  const response = await api.delete(`/campus-reports/${reportId}`);

  return response.data;
}