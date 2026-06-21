const mongoose = require("mongoose");

const EmergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
      index: true,
    },

    relationship: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    priority: {
      type: Number,
      default: 1,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

EmergencyContactSchema.index({ name: 1, phone: 1 });

module.exports = mongoose.model("EmergencyContact", EmergencyContactSchema);