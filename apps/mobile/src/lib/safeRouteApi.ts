import {
  SafeRouteAreaType,
  SafeRouteRecommendation,
  SafeRouteTravelMode,
} from "../types/safeRoute";
import { api } from "./api";

export type RecommendSafeRoutePayload = {
  startName: string;
  destinationName: string;
  travelMode: SafeRouteTravelMode;
  areaType: SafeRouteAreaType;
  selectedHour?: number;
};

function normalizeSafeRouteRecommendation(data: any): SafeRouteRecommendation {
  return {
    id: data.id ?? data._id ?? String(Date.now()),
    backendId: data._id ?? data.id,
    startName: data.startName ?? "",
    destinationName: data.destinationName ?? "",
    travelMode: data.travelMode ?? "walking",
    areaType: data.areaType ?? "unknown",
    selectedHour:
      data.selectedHour === null || data.selectedHour === undefined
        ? null
        : Number(data.selectedHour),
    incidentCountUsed: Number(data.incidentCountUsed ?? 0),
    recommendedRouteName: data.recommendedRouteName ?? "",
    routes: data.routes ?? [],
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}

export async function recommendSafeRouteApi(payload: RecommendSafeRoutePayload) {
  const response = await api.post("/safe-routes/recommend", payload);
  return normalizeSafeRouteRecommendation(response.data?.data);
}

export async function getSafeRouteHistoryApi() {
  const response = await api.get("/safe-routes");
  const routes = response.data?.data ?? [];

  return routes.map(normalizeSafeRouteRecommendation);
}