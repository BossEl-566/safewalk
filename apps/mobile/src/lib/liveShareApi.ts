import {
  LiveShareLocation,
  LiveShareMode,
  LiveShareSession,
} from "../types/liveShare";
import { RouteRiskLevel } from "../types/navigation";
import { api } from "./api";

export type CreateLiveSharePayload = {
  ownerName: string;
  friendName?: string;
  friendPhone?: string;
  mode?: LiveShareMode;
  destinationName?: string;
  destinationLocation?: LiveShareLocation | null;
  currentLocation: LiveShareLocation;
  routeRiskLevel?: RouteRiskLevel;
  routeRiskScore?: number;
  expectedArrivalAt?: string | null;
};

function normalizeLiveShareSession(data: any): LiveShareSession {
  return {
    id: data.id ?? data._id ?? String(Date.now()),
    backendId: data._id ?? data.id,
    shareToken: data.shareToken ?? "",
    shareUrl: data.shareUrl ?? "",

    ownerName: data.ownerName ?? "SafeWalk User",
    friendName: data.friendName ?? "",
    friendPhone: data.friendPhone ?? "",

    mode: data.mode ?? "walk_home",
    status: data.status ?? "active",

    destinationName: data.destinationName ?? "",
    destinationLocation: data.destinationLocation ?? null,

    currentLocation: data.currentLocation ?? null,
    lastKnownLocation: data.lastKnownLocation ?? null,

    routeRiskLevel: data.routeRiskLevel ?? "low",
    routeRiskScore: Number(data.routeRiskScore ?? 0),

    lastCheckInStatus: data.lastCheckInStatus ?? "not_checked",
    lastCheckInAt: data.lastCheckInAt ?? null,

    expectedArrivalAt: data.expectedArrivalAt ?? null,
    completedAt: data.completedAt ?? null,
    cancelledAt: data.cancelledAt ?? null,

    locationUpdates: data.locationUpdates ?? [],

    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt,
  };
}

export async function createLiveShareSessionApi(payload: CreateLiveSharePayload) {
  const response = await api.post("/live-share", payload);
  return normalizeLiveShareSession(response.data?.data);
}

export async function getLiveShareSessionApi(shareToken: string) {
  const response = await api.get(`/live-share/${shareToken}`);
  return normalizeLiveShareSession(response.data?.data);
}

export async function updateLiveShareLocationApi(
  shareToken: string,
  location: LiveShareLocation
) {
  const response = await api.patch(`/live-share/${shareToken}/location`, {
    location,
  });

  return normalizeLiveShareSession(response.data?.data);
}

export async function checkInLiveShareSessionApi(shareToken: string) {
  const response = await api.patch(`/live-share/${shareToken}/check-in`);
  return normalizeLiveShareSession(response.data?.data);
}

export async function completeLiveShareSessionApi(shareToken: string) {
  const response = await api.patch(`/live-share/${shareToken}/complete`);
  return normalizeLiveShareSession(response.data?.data);
}

export async function cancelLiveShareSessionApi(shareToken: string) {
  const response = await api.patch(`/live-share/${shareToken}/cancel`);
  return normalizeLiveShareSession(response.data?.data);
}