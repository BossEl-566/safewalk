import {
  MapCoordinate,
  SafeNavigationResponse,
} from "../types/navigation";
import { api } from "./api";

export type CalculateSafeNavigationPayload = {
  origin: MapCoordinate;
  destination: MapCoordinate;
  travelMode?: "WALK" | "DRIVE" | "TWO_WHEELER";
  selectedHour?: number;
};

export async function calculateSafeNavigationRouteApi(
  payload: CalculateSafeNavigationPayload
): Promise<SafeNavigationResponse> {
  const response = await api.post("/navigation/safe-route", payload);

  return response.data?.data as SafeNavigationResponse;
}