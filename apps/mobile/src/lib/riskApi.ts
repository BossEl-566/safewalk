import { MapCoordinate } from "../types/navigation";
import { LocationRiskResult } from "../types/risk";
import { api } from "./api";

export type CheckLocationRiskPayload = {
  location: MapCoordinate;
  radiusMeters?: number;
  selectedHour?: number;
};

export async function checkLocationRiskApi(
  payload: CheckLocationRiskPayload
): Promise<LocationRiskResult> {
  const response = await api.post("/risk/check-location", payload);

  return response.data?.data as LocationRiskResult;
}