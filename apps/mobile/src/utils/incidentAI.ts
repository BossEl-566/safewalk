import {
  IncidentAreaType,
  IncidentCategory,
  IncidentPriority,
  IncidentSeverity,
} from "../types/incident";

type AIInput = {
  category?: IncidentCategory;
  severity?: IncidentSeverity;
  priority?: IncidentPriority;
  areaType?: IncidentAreaType;
  description?: string;
  locationName?: string;
  buildingName?: string;
  roomNumber?: string;

  // Legacy values kept so old screens do not crash
  victimWasAlone?: boolean;
  weaponInvolved?: boolean;
};

type AIResult = {
  category: IncidentCategory;
  problemType: string;
  severity: IncidentSeverity;
  priority: IncidentPriority;
  aiRiskScore: number;
  priorityScore: number;
  title: string;
  aiSummary: string;
  responsibleUnit: string;
  recommendedAction: string;
};

type CategoryConfig = {
  label: string;
  unit: string;
  baseScore: number;
  action: string;
};

export const CATEGORY_CONFIG: Record<IncidentCategory, CategoryConfig> = {
  security_emergency: {
    label: "Security Emergency",
    unit: "Campus Security / Risk Management",
    baseScore: 85,
    action: "Dispatch campus security and verify the student's location immediately.",
  },
  medical_emergency: {
    label: "Medical Emergency",
    unit: "University Health Service",
    baseScore: 90,
    action: "Notify health responders and request immediate medical attention.",
  },
  fire_emergency: {
    label: "Fire Emergency",
    unit: "Campus Security / Fire Response / PDMSD",
    baseScore: 95,
    action: "Escalate immediately to emergency responders and restrict access to the area.",
  },
  flooding: {
    label: "Flooding / Drainage Issue",
    unit: "Physical Development and Municipal Services Directorate",
    baseScore: 75,
    action: "Inspect drainage, block unsafe access, and assign maintenance response.",
  },
  electrical_fault: {
    label: "Electrical Fault",
    unit: "Electrical Maintenance Unit",
    baseScore: 80,
    action: "Send an electrician to inspect and isolate the electrical risk.",
  },
  lecture_room_fault: {
    label: "Lecture Room Fault",
    unit: "Academic Facilities / Maintenance Unit",
    baseScore: 55,
    action: "Assign a technician to inspect the lecture room facility.",
  },
  furniture_damage: {
    label: "Furniture / Fixture Damage",
    unit: "Facilities Maintenance Unit",
    baseScore: 40,
    action: "Inspect and repair or replace the damaged furniture or fixture.",
  },
  sanitation_issue: {
    label: "Sanitation Issue",
    unit: "Municipal Services / Sanitation Unit",
    baseScore: 50,
    action: "Assign sanitation staff to inspect and clean the affected area.",
  },
  water_leakage: {
    label: "Water Leakage / Plumbing",
    unit: "Plumbing / Maintenance Unit",
    baseScore: 60,
    action: "Assign plumbing staff to inspect and repair the leakage.",
  },
  ict_problem: {
    label: "ICT Problem",
    unit: "University of Ghana Computing Systems / IT Directorate",
    baseScore: 45,
    action: "Forward to IT support for network, projector, lab, or system troubleshooting.",
  },
  road_walkway_hazard: {
    label: "Road / Walkway Hazard",
    unit: "Physical Development and Municipal Services Directorate",
    baseScore: 65,
    action: "Inspect the walkway or road hazard and mark unsafe areas if needed.",
  },
  hostel_hall_issue: {
    label: "Hostel / Hall Facility Issue",
    unit: "Hall Administration / Facilities Maintenance",
    baseScore: 50,
    action: "Forward to hall administration or facility maintenance for response.",
  },
  disaster_hazard: {
    label: "Disaster / Environmental Hazard",
    unit: "Risk Management / PDMSD / Campus Security",
    baseScore: 85,
    action: "Escalate for urgent inspection and public safety response.",
  },
  accessibility_issue: {
    label: "Accessibility Issue",
    unit: "Student Affairs / Facilities Maintenance",
    baseScore: 55,
    action: "Review accessibility concern and assign responsible unit for correction.",
  },
  lost_found: {
    label: "Lost and Found",
    unit: "Campus Security / Student Affairs",
    baseScore: 25,
    action: "Record the item and route to campus security or student affairs.",
  },
  other: {
    label: "Other Campus Issue",
    unit: "Central Administration / Help Desk",
    baseScore: 35,
    action: "Review manually and assign the correct responsible unit.",
  },
};

const LEGACY_CATEGORY_MAP: Record<string, IncidentCategory> = {
  phone_snatch: "security_emergency",
  robbery: "security_emergency",
  attack: "security_emergency",
  suspicious_motorbike: "security_emergency",
  forced_momo_withdrawal: "security_emergency",
  poor_lighting: "road_walkway_hazard",
  harassment: "security_emergency",
  unsafe_shortcut: "road_walkway_hazard",
  accident: "medical_emergency",
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function detectCategory(
  description = "",
  providedCategory: string = "other"
): IncidentCategory {
  const text = `${providedCategory} ${description}`.toLowerCase();

  if (LEGACY_CATEGORY_MAP[providedCategory]) {
    return LEGACY_CATEGORY_MAP[providedCategory];
  }

  if (includesAny(text, ["fire", "smoke", "burning", "explosion", "gas leak"])) {
    return "fire_emergency";
  }

  if (
    includesAny(text, [
      "collapse",
      "collapsed",
      "injury",
      "injured",
      "bleeding",
      "sick",
      "fainted",
      "medical",
      "ambulance",
    ])
  ) {
    return "medical_emergency";
  }

  if (
    includesAny(text, [
      "robbery",
      "thief",
      "stolen",
      "snatch",
      "attack",
      "assault",
      "harass",
      "threat",
      "suspicious",
    ])
  ) {
    return "security_emergency";
  }

  if (
    includesAny(text, [
      "projector",
      "speaker",
      "microphone",
      "fan",
      "light",
      "lecture room",
      "classroom",
      "board",
      "screen",
    ])
  ) {
    return "lecture_room_fault";
  }

  if (
    includesAny(text, [
      "chair",
      "desk",
      "table",
      "door",
      "window",
      "bench",
      "broken seat",
    ])
  ) {
    return "furniture_damage";
  }

  if (
    includesAny(text, [
      "electric",
      "socket",
      "wire",
      "shock",
      "power",
      "sparking",
      "exposed wire",
    ])
  ) {
    return "electrical_fault";
  }

  if (
    includesAny(text, [
      "toilet",
      "washroom",
      "dirty",
      "waste",
      "rubbish",
      "garbage",
      "smell",
      "sanitation",
    ])
  ) {
    return "sanitation_issue";
  }

  if (
    includesAny(text, [
      "water",
      "tap",
      "leak",
      "pipe",
      "plumbing",
      "flood",
      "flooding",
      "drainage",
    ])
  ) {
    return text.includes("flood") || text.includes("drain")
      ? "flooding"
      : "water_leakage";
  }

  if (
    includesAny(text, [
      "wifi",
      "wi-fi",
      "internet",
      "network",
      "computer",
      "lab",
      "login",
      "portal",
      "ict",
    ])
  ) {
    return "ict_problem";
  }

  if (
    includesAny(text, [
      "pothole",
      "road",
      "walkway",
      "path",
      "stairs",
      "fallen tree",
      "blocked",
      "hazard",
    ])
  ) {
    return "road_walkway_hazard";
  }

  if (
    includesAny(text, [
      "hostel",
      "hall",
      "room",
      "bathroom",
      "common room",
      "residence",
    ])
  ) {
    return "hostel_hall_issue";
  }

  if (
    includesAny(text, [
      "wheelchair",
      "ramp",
      "disabled",
      "accessibility",
      "cannot access",
    ])
  ) {
    return "accessibility_issue";
  }

  if (includesAny(text, ["lost", "found", "missing", "id card", "wallet", "bag"])) {
    return "lost_found";
  }

  if (CATEGORY_CONFIG[providedCategory as IncidentCategory]) {
    return providedCategory as IncidentCategory;
  }

  return "other";
}

function normalizeSeverity(
  severity: IncidentSeverity = "medium",
  category: IncidentCategory,
  description = ""
): IncidentSeverity {
  const text = description.toLowerCase();

  if (
    includesAny(text, [
      "urgent",
      "immediate",
      "danger",
      "life",
      "fire",
      "bleeding",
      "shock",
      "exposed wire",
      "collapse",
    ])
  ) {
    return "critical";
  }

  if (category === "fire_emergency" || category === "medical_emergency") {
    return "critical";
  }

  if (
    category === "security_emergency" ||
    category === "electrical_fault" ||
    category === "disaster_hazard"
  ) {
    return severity === "low" ? "high" : severity;
  }

  return severity;
}

function scoreFromSeverity(severity: IncidentSeverity, baseScore: number) {
  const severityBoost = {
    low: -15,
    medium: 0,
    high: 15,
    critical: 25,
  };

  const score = baseScore + severityBoost[severity];

  return Math.max(0, Math.min(100, score));
}

export function getIncidentCategoryLabel(category: IncidentCategory | string) {
  return CATEGORY_CONFIG[category as IncidentCategory]?.label ?? "Campus Issue";
}

export function generateIncidentAI(input: AIInput): AIResult {
  const detectedCategory = detectCategory(
    input.description ?? "",
    input.category ?? "other"
  );

  const config = CATEGORY_CONFIG[detectedCategory] ?? CATEGORY_CONFIG.other;

  const normalizedSeverity = normalizeSeverity(
    input.priority ?? input.severity ?? "medium",
    detectedCategory,
    input.description ?? ""
  );

  const aiRiskScore = scoreFromSeverity(normalizedSeverity, config.baseScore);

  const locationText = input.locationName
    ? ` at ${input.locationName}`
    : input.buildingName
      ? ` at ${input.buildingName}`
      : "";

  return {
    category: detectedCategory,
    problemType: config.label,
    severity: normalizedSeverity,
    priority: normalizedSeverity,
    aiRiskScore,
    priorityScore: aiRiskScore,
    title: `${config.label}${locationText}`,
    aiSummary: `${config.label} reported${locationText}. Priority is ${normalizedSeverity}. Suggested unit: ${config.unit}.`,
    responsibleUnit: config.unit,
    recommendedAction: config.action,
  };
}