const mongoose = require("mongoose");

const IncidentLocationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const IncidentReportSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "phone_snatch",
        "robbery",
        "attack",
        "suspicious_motorbike",
        "forced_momo_withdrawal",
        "poor_lighting",
        "harassment",
        "unsafe_shortcut",
        "accident",
        "medical_emergency",
        "other",
      ],
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
      maxlength: 1000,
    },

    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },

    areaType: {
      type: String,
      enum: ["on_campus", "off_campus", "unknown"],
      default: "unknown",
      index: true,
    },

    location: {
      type: IncidentLocationSchema,
      default: null,
    },

    locationName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

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

    anonymous: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
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

    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

IncidentReportSchema.index({ "location.latitude": 1, "location.longitude": 1 });
IncidentReportSchema.index({ category: 1, severity: 1, createdAt: -1 });

module.exports = mongoose.model("IncidentReport", IncidentReportSchema);