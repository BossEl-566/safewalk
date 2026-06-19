export type IncidentCategory =
  | "phone_snatch"
  | "robbery"
  | "attack"
  | "suspicious_motorbike"
  | "forced_momo_withdrawal"
  | "poor_lighting"
  | "harassment"
  | "unsafe_shortcut"
  | "accident"
  | "medical_emergency"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentAreaType = "on_campus" | "off_campus" | "unknown";

export type IncidentLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

export type IncidentReport = {
  id: string;
  category: IncidentCategory;
  title: string;
  description: string;
  severity: IncidentSeverity;
  areaType: IncidentAreaType;

  location: IncidentLocation | null;
  locationName?: string;

  victimWasAlone: boolean;
  weaponInvolved: boolean;
  attackerMode?: string;
  lightingCondition?: string;

  anonymous: boolean;
  status: "pending" | "verified" | "rejected";

  aiRiskScore: number;
  aiSummary: string;

  occurredAt: string;
  createdAt: string;
};