export type SafeRouteTravelMode = "walking" | "ride";

export type SafeRouteAreaType = "on_campus" | "off_campus" | "unknown";

export type SafeRouteRiskLevel = "low" | "medium" | "high" | "critical";

export type SafeRouteOption = {
  routeName: string;
  routeType: "shortcut" | "main_road" | "security_route";
  routeDistanceMeters: number;
  estimatedTimeMinutes: number;
  riskScore: number;
  riskLevel: SafeRouteRiskLevel;
  riskReasons: string[];
  recommendation: string;
  isRecommended: boolean;
};

export type SafeRouteRecommendation = {
  id: string;
  backendId?: string;
  startName: string;
  destinationName: string;
  travelMode: SafeRouteTravelMode;
  areaType: SafeRouteAreaType;
  selectedHour: number | null;
  incidentCountUsed: number;
  recommendedRouteName: string;
  routes: SafeRouteOption[];
  createdAt: string;
};