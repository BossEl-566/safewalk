import { MapCoordinate, RouteRiskLevel } from "./navigation";

export type NearbyRiskIncident = {
  id: string;
  title: string;
  category: string;
  severity: string;
  locationName?: string;
  aiRiskScore?: number;
  distanceMeters: number;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
};

export type LocationRiskResult = {
  location: MapCoordinate;
  checkedAt: string;
  riskScore: number;
  riskLevel: RouteRiskLevel;
  radiusMeters: number;
  nearbyIncidentCount: number;
  warnings: string[];
  nearbyIncidents: NearbyRiskIncident[];
};