const WalkSafeSession = require("../models/WalkSafeSession");

async function createWalkSafeSession(req, res) {
  try {
    const {
        mode = "walk_safe",
      startLocation = null,
      destinationName,
      trustedContactId = "",
      trustedContactName,
      trustedContactPhone,
      expectedDurationMinutes,
      startedAt,
      expectedArrivalAt,
      riskLevel = "low",
      nearbyRiskWarnings = [],
    } = req.body;

    if (!destinationName || !destinationName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Destination name is required.",
      });
    }

    if (!trustedContactName || !trustedContactPhone) {
      return res.status(400).json({
        success: false,
        message: "Trusted contact name and phone are required.",
      });
    }

    if (!expectedDurationMinutes) {
      return res.status(400).json({
        success: false,
        message: "Expected duration is required.",
      });
    }

    const startDate = startedAt ? new Date(startedAt) : new Date();
    const expectedArrivalDate = expectedArrivalAt
      ? new Date(expectedArrivalAt)
      : new Date(startDate.getTime() + Number(expectedDurationMinutes) * 60000);

    const session = await WalkSafeSession.create({
        mode,
      status: "active",
      startLocation,
      destinationName,
      trustedContactId,
      trustedContactName,
      trustedContactPhone,
      expectedDurationMinutes,
      startedAt: startDate,
      expectedArrivalAt: expectedArrivalDate,
      riskLevel,
      nearbyRiskWarnings,
    });

    return res.status(201).json({
      success: true,
      message: "Walk Safe session created successfully.",
      data: session,
    });
  } catch (error) {
    console.error("Create Walk Safe session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Walk Safe session.",
      error: error.message,
    });
  }
}

async function getWalkSafeSessions(req, res) {
  try {
    const { status, limit = 50 } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const sessions = await WalkSafeSession.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100));

    return res.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error("Get Walk Safe sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Walk Safe sessions.",
      error: error.message,
    });
  }
}

async function getWalkSafeSessionById(req, res) {
  try {
    const session = await WalkSafeSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Walk Safe session not found.",
      });
    }

    return res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Get Walk Safe session by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Walk Safe session.",
      error: error.message,
    });
  }
}

async function checkInWalkSafeSession(req, res) {
  try {
    const session = await WalkSafeSession.findByIdAndUpdate(
      req.params.id,
      {
        lastCheckInAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Walk Safe session not found.",
      });
    }

    return res.json({
      success: true,
      message: "Walk Safe check-in saved successfully.",
      data: session,
    });
  } catch (error) {
    console.error("Walk Safe check-in error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save Walk Safe check-in.",
      error: error.message,
    });
  }
}

async function completeWalkSafeSession(req, res) {
  try {
    const session = await WalkSafeSession.findByIdAndUpdate(
      req.params.id,
      {
        status: "completed",
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Walk Safe session not found.",
      });
    }

    return res.json({
      success: true,
      message: "Walk Safe session completed successfully.",
      data: session,
    });
  } catch (error) {
    console.error("Complete Walk Safe session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete Walk Safe session.",
      error: error.message,
    });
  }
}

async function cancelWalkSafeSession(req, res) {
  try {
    const session = await WalkSafeSession.findByIdAndUpdate(
      req.params.id,
      {
        status: "cancelled",
        cancelledAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Walk Safe session not found.",
      });
    }

    return res.json({
      success: true,
      message: "Walk Safe session cancelled successfully.",
      data: session,
    });
  } catch (error) {
    console.error("Cancel Walk Safe session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel Walk Safe session.",
      error: error.message,
    });
  }
}

module.exports = {
  createWalkSafeSession,
  getWalkSafeSessions,
  getWalkSafeSessionById,
  checkInWalkSafeSession,
  completeWalkSafeSession,
  cancelWalkSafeSession,
};