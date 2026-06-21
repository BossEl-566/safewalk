const mongoose = require("mongoose");

const WalkSafeLocationSchema = new mongoose.Schema(
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

const NearbyRiskWarningSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    locationName: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    aiRiskScore: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    distanceMeters: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const WalkSafeSessionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
    },

    startLocation: {
      type: WalkSafeLocationSchema,
      default: null,
    },

    destinationName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    trustedContactId: {
      type: String,
      default: "",
    },

    trustedContactName: {
      type: String,
      required: true,
      trim: true,
    },

    trustedContactPhone: {
      type: String,
      required: true,
      trim: true,
    },

    expectedDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    expectedArrivalAt: {
      type: Date,
      required: true,
      index: true,
    },

    lastCheckInAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
      index: true,
    },

    nearbyRiskWarnings: {
      type: [NearbyRiskWarningSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

WalkSafeSessionSchema.index({ createdAt: -1 });
WalkSafeSessionSchema.index({ "startLocation.latitude": 1, "startLocation.longitude": 1 });

module.exports = mongoose.model("WalkSafeSession", WalkSafeSessionSchema);