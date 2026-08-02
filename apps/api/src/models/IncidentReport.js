const mongoose = require("mongoose");

const CampusLocationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
    accuracy: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    actorName: {
      type: String,
      default: "System",
      trim: true,
    },
    actorRole: {
      type: String,
      enum: ["student", "ai", "authority", "admin", "system"],
      default: "system",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const EvidenceSchema = new mongoose.Schema(
  {
    uri: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "document"],
      default: "image",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const IncidentReportSchema = new mongoose.Schema(
  {
    institutionId: {
      type: String,
      default: "university-of-ghana",
      index: true,
      trim: true,
    },

    institutionName: {
      type: String,
      default: "University of Ghana",
      trim: true,
    },

    campusName: {
      type: String,
      default: "Legon Campus",
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "security_emergency",
        "medical_emergency",
        "fire_emergency",
        "flooding",
        "electrical_fault",
        "lecture_room_fault",
        "furniture_damage",
        "sanitation_issue",
        "water_leakage",
        "ict_problem",
        "road_walkway_hazard",
        "hostel_hall_issue",
        "disaster_hazard",
        "accessibility_issue",
        "lost_found",
        "other",
      ],
      index: true,
    },

    problemType: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },

    priorityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },

    areaType: {
      type: String,
      enum: ["on_campus", "off_campus", "unknown"],
      default: "on_campus",
      index: true,
    },

    location: {
      type: CampusLocationSchema,
      default: null,
    },

    locationName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    buildingName: {
      type: String,
      default: "",
      trim: true,
    },

    roomNumber: {
      type: String,
      default: "",
      trim: true,
    },

    landmark: {
      type: String,
      default: "",
      trim: true,
    },

    evidence: {
      type: [EvidenceSchema],
      default: [],
    },

    reporterName: {
      type: String,
      default: "",
      trim: true,
    },

    reporterPhone: {
      type: String,
      default: "",
      trim: true,
    },

    reporterEmail: {
      type: String,
      default: "",
      trim: true,
    },

    reporterStudentId: {
      type: String,
      default: "",
      trim: true,
    },

    anonymous: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "submitted",
        "ai_reviewed",
        "assigned",
        "in_progress",
        "resolved",
        "student_confirmed",
        "closed",
        "rejected",
        "escalated",
      ],
      default: "ai_reviewed",
      index: true,
    },

    assignedUnit: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    assignedToName: {
      type: String,
      default: "",
      trim: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    inProgressAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    escalationLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },

    aiRiskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },

    aiSummary: {
      type: String,
      default: "",
      trim: true,
    },

    aiRecommendedAction: {
      type: String,
      default: "",
      trim: true,
    },

    aiSuggestedUnit: {
      type: String,
      default: "",
      trim: true,
    },

    aiDuplicateKey: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    duplicateCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    resolutionSummary: {
      type: String,
      default: "",
      trim: true,
    },

    resolutionEvidence: {
      type: [EvidenceSchema],
      default: [],
    },

    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },

    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Legacy fields kept so the old mobile app does not break immediately.
    victimWasAlone: {
      type: Boolean,
      default: false,
    },

    weaponInvolved: {
      type: Boolean,
      default: false,
    },

    attackerMode: {
      type: String,
      default: "",
      trim: true,
    },

    lightingCondition: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

IncidentReportSchema.index({ "location.latitude": 1, "location.longitude": 1 });
IncidentReportSchema.index({ category: 1, priority: 1, createdAt: -1 });
IncidentReportSchema.index({ status: 1, assignedUnit: 1, createdAt: -1 });

module.exports = mongoose.model("IncidentReport", IncidentReportSchema);