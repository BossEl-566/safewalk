export type WalkSafeStatus = "active" | "completed" | "cancelled";

export type WalkSafeRiskLevel = "low" | "medium" | "high";

export type WalkSafeLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

export type WalkSafeSession = {
  id: string;
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
};