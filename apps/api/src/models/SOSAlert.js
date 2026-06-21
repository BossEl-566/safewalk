const mongoose = require("mongoose");

const SOSLocationSchema = new mongoose.Schema(
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

const SOSAlertSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      default: "SafeWalk User",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "resolved"],
      default: "active",
      index: true,
    },

    location: {
      type: SOSLocationSchema,
      default: null,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    trustedContactName: {
      type: String,
      default: "",
      trim: true,
    },

    trustedContactPhone: {
      type: String,
      default: "",
      trim: true,
    },

    source: {
      type: String,
      enum: ["sos_button", "walk_safe", "manual"],
      default: "sos_button",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

SOSAlertSchema.index({ createdAt: -1 });
SOSAlertSchema.index({ "location.latitude": 1, "location.longitude": 1 });

module.exports = mongoose.model("SOSAlert", SOSAlertSchema);