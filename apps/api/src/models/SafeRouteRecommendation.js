const mongoose = require("mongoose");

const SafeRouteOptionSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: true,
      trim: true,
    },

    routeType: {
      type: String,
      enum: ["shortcut", "main_road", "security_route"],
      required: true,
    },

    routeDistanceMeters: {
      type: Number,
      default: 0,
    },

    estimatedTimeMinutes: {
      type: Number,
      default: 0,
    },

    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },

    riskReasons: {
      type: [String],
      default: [],
    },

    recommendation: {
      type: String,
      default: "",
      trim: true,
    },

    isRecommended: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const SafeRouteRecommendationSchema = new mongoose.Schema(
  {
    startName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    destinationName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    travelMode: {
      type: String,
      enum: ["walking", "ride"],
      default: "walking",
    },

    areaType: {
      type: String,
      enum: ["on_campus", "off_campus", "unknown"],
      default: "unknown",
    },

    selectedHour: {
      type: Number,
      default: null,
    },

    incidentCountUsed: {
      type: Number,
      default: 0,
    },

    recommendedRouteName: {
      type: String,
      default: "",
      trim: true,
    },

    routes: {
      type: [SafeRouteOptionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

SafeRouteRecommendationSchema.index({ createdAt: -1 });
SafeRouteRecommendationSchema.index({ startName: 1, destinationName: 1 });

module.exports = mongoose.model(
  "SafeRouteRecommendation",
  SafeRouteRecommendationSchema
);