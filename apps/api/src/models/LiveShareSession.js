const crypto = require("crypto");
const mongoose = require("mongoose");

function generateShareToken() {
  return crypto.randomBytes(10).toString("hex");
}

const LocationSchema = new mongoose.Schema(
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
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const LiveShareSessionSchema = new mongoose.Schema(
  {
    shareToken: {
      type: String,
      unique: true,
      index: true,
      default: generateShareToken,
    },

    ownerName: {
      type: String,
      default: "SafeWalk User",
      trim: true,
    },

    friendName: {
      type: String,
      default: "",
      trim: true,
    },

    friendPhone: {
      type: String,
      default: "",
      trim: true,
    },

    mode: {
      type: String,
      enum: ["walk_safe", "walk_home", "ride_safe", "lecture_trip", "manual"],
      default: "walk_home",
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
    },

    destinationName: {
      type: String,
      default: "",
      trim: true,
    },

    destinationLocation: {
      type: LocationSchema,
      default: null,
    },

    currentLocation: {
      type: LocationSchema,
      default: null,
    },

    lastKnownLocation: {
      type: LocationSchema,
      default: null,
    },

    routeRiskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },

    routeRiskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    lastCheckInStatus: {
      type: String,
      enum: ["safe", "not_checked", "missed"],
      default: "not_checked",
    },

    lastCheckInAt: {
      type: Date,
      default: null,
    },

    expectedArrivalAt: {
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

    locationUpdates: {
      type: [LocationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

LiveShareSessionSchema.index({ createdAt: -1 });
LiveShareSessionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("LiveShareSession", LiveShareSessionSchema);