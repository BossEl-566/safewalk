export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentPriority = "low" | "medium" | "high" | "critical";

export type IncidentAreaType = "on_campus" | "off_campus" | "unknown";

export type IncidentStatus =
  | "pending"
  | "submitted"
  | "ai_reviewed"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "student_confirmed"
  | "closed"
  | "rejected"
  | "escalated";

export type IncidentCategory =
  | "security_emergency"
  | "medical_emergency"
  | "fire_emergency"
  | "flooding"
  | "electrical_fault"
  | "lecture_room_fault"
  | "furniture_damage"
  | "sanitation_issue"
  | "water_leakage"
  | "ict_problem"
  | "road_walkway_hazard"
  | "hostel_hall_issue"
  | "disaster_hazard"
  | "accessibility_issue"
  | "lost_found"
  | "other";

export type IncidentLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

export type ReportEvidence = {
  uri: string;
  type: "image" | "video" | "document";
  uploadedAt?: string;
};

export type ReportStatusHistory = {
  status: IncidentStatus | string;
  note: string;
  actorName: string;
  actorRole: "student" | "ai" | "authority" | "admin" | "system";
  createdAt?: string;
};

export type IncidentReport = {
  id: string;
  _id?: string;

  institutionId?: string;
  institutionName?: string;
  campusName?: string;

  category: IncidentCategory;
  problemType?: string;
  title: string;
  description: string;

  severity: IncidentSeverity;
  priority?: IncidentPriority;
  priorityScore?: number;

  areaType: IncidentAreaType;

  location: IncidentLocation | null;
  locationName: string;
  buildingName?: string;
  roomNumber?: string;
  landmark?: string;

  evidence?: ReportEvidence[];

  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  reporterStudentId?: string;
  anonymous: boolean;

  status: IncidentStatus;

  assignedUnit?: string;
  assignedToName?: string;

  acceptedAt?: string | null;
  assignedAt?: string | null;
  inProgressAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;

  escalationLevel?: number;

  aiRiskScore: number;
  aiSummary: string;
  aiRecommendedAction?: string;
  aiSuggestedUnit?: string;
  aiDuplicateKey?: string;
  duplicateCount?: number;

  resolutionSummary?: string;
  resolutionEvidence?: ReportEvidence[];

  statusHistory?: ReportStatusHistory[];

  occurredAt: string;
  createdAt: string;
  updatedAt?: string;

  /**
   * Legacy fields kept so old screens do not crash while we migrate.
   */
  victimWasAlone?: boolean;
  weaponInvolved?: boolean;
  attackerMode?: string;
  lightingCondition?: string;
};