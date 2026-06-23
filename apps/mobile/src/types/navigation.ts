export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type RouteRiskLevel = "low" | "medium" | "high" | "critical";

export type NearbyRouteReport = {
  id: string;
  title: string;
  category: string;
  severity: string;
  locationName?: string;
  aiRiskScore: number;
  distanceFromRouteMeters: number;
};

export type SafeNavigationRoute = {
  routeIndex: number;
  description: string;
  duration: string;
  distanceMeters: number;
  encodedPolyline: string;
  coordinates: MapCoordinate[];
  riskScore: number;
  riskLevel: RouteRiskLevel;
  nearbyReports: NearbyRouteReport[];
  reasons: string[];
};

export type SafeNavigationResponse = {
  recommendedRoute: SafeNavigationRoute | null;
  routes: SafeNavigationRoute[];
};