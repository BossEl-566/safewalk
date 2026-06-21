const SOSAlert = require("../models/SOSAlert");

async function createSOSAlert(req, res) {
  try {
    const {
      userName = "SafeWalk User",
      location = null,
      message,
      trustedContactName = "",
      trustedContactPhone = "",
      source = "sos_button",
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "SOS message is required.",
      });
    }

    const alert = await SOSAlert.create({
      userName,
      status: "active",
      location,
      message,
      trustedContactName,
      trustedContactPhone,
      source,
    });

    return res.status(201).json({
      success: true,
      message: "SOS alert created successfully.",
      data: alert,
    });
  } catch (error) {
    console.error("Create SOS alert error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create SOS alert.",
      error: error.message,
    });
  }
}

async function getSOSAlerts(req, res) {
  try {
    const { status, limit = 50 } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const alerts = await SOSAlert.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100));

    return res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Get SOS alerts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch SOS alerts.",
      error: error.message,
    });
  }
}

async function getSOSAlertById(req, res) {
  try {
    const alert = await SOSAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "SOS alert not found.",
      });
    }

    return res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error("Get SOS alert by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch SOS alert.",
      error: error.message,
    });
  }
}

async function resolveSOSAlert(req, res) {
  try {
    const alert = await SOSAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: "resolved",
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "SOS alert not found.",
      });
    }

    return res.json({
      success: true,
      message: "SOS alert resolved successfully.",
      data: alert,
    });
  } catch (error) {
    console.error("Resolve SOS alert error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resolve SOS alert.",
      error: error.message,
    });
  }
}

async function cancelSOSAlert(req, res) {
  try {
    const alert = await SOSAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: "cancelled",
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "SOS alert not found.",
      });
    }

    return res.json({
      success: true,
      message: "SOS alert cancelled successfully.",
      data: alert,
    });
  } catch (error) {
    console.error("Cancel SOS alert error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel SOS alert.",
      error: error.message,
    });
  }
}

module.exports = {
  createSOSAlert,
  getSOSAlerts,
  getSOSAlertById,
  resolveSOSAlert,
  cancelSOSAlert,
};