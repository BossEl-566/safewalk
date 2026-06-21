export type WalkSafeStatus = "active" | "completed" | "cancelled";

export type WalkSafeRiskLevel = "low" | "medium" | "high" | "critical";

export type WalkSafeLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

export type WalkSafeNearbyRisk = {
  reportId: string;
  title: string;
  locationName: string;
  description: string;
  aiRiskScore: number;
  riskLevel: WalkSafeRiskLevel;
  distanceMeters: number;
};

export type WalkSafeSession = {
  id: string;
  backendId?: string;
  status: WalkSafeStatus;

  startLocation: WalkSafeLocation | null;
  destinationName: string;

  trustedContactId: string;
  trustedContactName: string;
  trustedContactPhone: string;

  expectedDurationMinutes: number;
  startedAt: string;
  expectedArrivalAt: string;

  lastCheckInAt?: string;
  completedAt?: string;
  cancelledAt?: string;

  riskLevel: WalkSafeRiskLevel;
  nearbyRiskWarnings: WalkSafeNearbyRisk[];
};