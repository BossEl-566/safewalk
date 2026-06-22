import {
  WalkSafeLocation,
  WalkSafeMode,
  WalkSafeNearbyRisk,
  WalkSafeRiskLevel,
  WalkSafeSession,
} from "../types/walkSafe";
import { api } from "./api";

export type CreateWalkSafeSessionPayload = {
  mode: WalkSafeMode;
  startLocation: WalkSafeLocation | null;
  destinationName: string;
  trustedContactId: string;
  trustedContactName: string;
  trustedContactPhone: string;
  expectedDurationMinutes: number;
  startedAt: string;
  expectedArrivalAt: string;
  riskLevel: WalkSafeRiskLevel;
  nearbyRiskWarnings: WalkSafeNearbyRisk[];
};

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

export async function createWalkSafeSessionApi(
  payload: CreateWalkSafeSessionPayload
) {
  const response = await api.post("/walk-safe", payload);
  return normalizeWalkSafeSession(response.data?.data);
}

export async function getWalkSafeSessionsApi() {
  const response = await api.get("/walk-safe");
  const sessions = response.data?.data ?? [];

  return sessions.map(normalizeWalkSafeSession);
}

export async function checkInWalkSafeSessionApi(sessionId: string) {
  const response = await api.patch(`/walk-safe/${sessionId}/check-in`);
  return normalizeWalkSafeSession(response.data?.data);
}

export async function completeWalkSafeSessionApi(sessionId: string) {
  const response = await api.patch(`/walk-safe/${sessionId}/complete`);
  return normalizeWalkSafeSession(response.data?.data);
}

export async function cancelWalkSafeSessionApi(sessionId: string) {
  const response = await api.patch(`/walk-safe/${sessionId}/cancel`);
  return normalizeWalkSafeSession(response.data?.data);
}