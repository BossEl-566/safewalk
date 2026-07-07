const LiveShareSession = require("../models/LiveShareSession");
const SOSAlert = require("../models/SOSAlert");

function buildShareUrl(req, shareToken) {
  const baseUrl = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/live/${shareToken}`;
}

async function createLiveShareSession(req, res) {
  try {
    const {
      ownerName = "SafeWalk User",
      friendName = "",
      friendPhone = "",
      mode = "walk_home",
      destinationName = "",
      destinationLocation = null,
      currentLocation = null,
      routeRiskLevel = "low",
      routeRiskScore = 0,
      expectedArrivalAt = null,
    } = req.body;

    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      return res.status(400).json({
        success: false,
        message: "Current location is required.",
      });
    }

    const session = await LiveShareSession.create({
      ownerName,
      friendName,
      friendPhone,
      mode,
      status: "active",
      destinationName,
      destinationLocation,
      currentLocation,
      lastKnownLocation: currentLocation,
      routeRiskLevel,
      routeRiskScore,
      expectedArrivalAt: expectedArrivalAt ? new Date(expectedArrivalAt) : null,
      locationUpdates: [currentLocation],
    });

    return res.status(201).json({
      success: true,
      message: "Live share session created successfully.",
      data: {
        ...session.toObject(),
        shareUrl: buildShareUrl(req, session.shareToken),
      },
    });
  } catch (error) {
    console.error("Create live share session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create live share session.",
      error: error.message,
    });
  }
}

async function getLiveShareSession(req, res) {
  try {
    const { shareToken } = req.params;

    const session = await LiveShareSession.findOne({ shareToken });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live share session not found.",
      });
    }

    return res.json({
      success: true,
      data: {
        ...session.toObject(),
        shareUrl: buildShareUrl(req, session.shareToken),
      },
    });
  } catch (error) {
    console.error("Get live share session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch live share session.",
      error: error.message,
    });
  }
}

async function updateLiveLocation(req, res) {
  try {
    const { shareToken } = req.params;
    const { location } = req.body;

    if (!location?.latitude || !location?.longitude) {
      return res.status(400).json({
        success: false,
        message: "Location latitude and longitude are required.",
      });
    }

    const locationUpdate = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy ?? null,
      timestamp: new Date(),
    };

    const session = await LiveShareSession.findOne({ shareToken });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live share session not found.",
      });
    }

    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Live share session is not active.",
      });
    }

    session.currentLocation = locationUpdate;
    session.lastKnownLocation = locationUpdate;
    session.locationUpdates.push(locationUpdate);

    if (session.locationUpdates.length > 300) {
      session.locationUpdates = session.locationUpdates.slice(-300);
    }

    await session.save();

    return res.json({
      success: true,
      message: "Live location updated successfully.",
      data: session,
    });
  } catch (error) {
    console.error("Update live location error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update live location.",
      error: error.message,
    });
  }
}

async function checkInLiveShareSession(req, res) {
  try {
    const { shareToken } = req.params;

    const session = await LiveShareSession.findOneAndUpdate(
      { shareToken },
      {
        lastCheckInStatus: "safe",
        lastCheckInAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live share session not found.",
      });
    }

    return res.json({
      success: true,
      message: "Check-in saved successfully.",
      data: session,
    });
  } catch (error) {
    console.error("Live share check-in error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save check-in.",
      error: error.message,
    });
  }
}

async function completeLiveShareSession(req, res) {
  try {
    const { shareToken } = req.params;

    const session = await LiveShareSession.findOneAndUpdate(
      { shareToken },
      {
        status: "completed",
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live share session not found.",
      });
    }

    return res.json({
      success: true,
      message: "Live share session completed successfully.",
      data: session,
    });
  } catch (error) {
    console.error("Complete live share session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete live share session.",
      error: error.message,
    });
  }
}

async function cancelLiveShareSession(req, res) {
  try {
    const { shareToken } = req.params;

    const session = await LiveShareSession.findOneAndUpdate(
      { shareToken },
      {
        status: "cancelled",
        cancelledAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live share session not found.",
      });
    }

    return res.json({
      success: true,
      message: "Live share session cancelled successfully.",
      data: session,
    });
  } catch (error) {
    console.error("Cancel live share session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel live share session.",
      error: error.message,
    });
  }
}

async function escalateLiveShareToSOS(req, res) {
  try {
    const { shareToken } = req.params;
    const { reason = "Missed safety check-in during live monitoring." } =
      req.body;

    const session = await LiveShareSession.findOne({ shareToken });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live share session not found.",
      });
    }

    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Live share session is not active.",
      });
    }

    if (!session.currentLocation?.latitude || !session.currentLocation?.longitude) {
      return res.status(400).json({
        success: false,
        message: "No current location available for SOS escalation.",
      });
    }

    session.lastCheckInStatus = "missed";
    await session.save();

    const sosAlert = await SOSAlert.create({
      userName: session.ownerName || "SafeWalk User",
      status: "active",
      location: {
        latitude: session.currentLocation.latitude,
        longitude: session.currentLocation.longitude,
        accuracy: session.currentLocation.accuracy ?? null,
      },
      message: `${reason} Destination: ${
        session.destinationName || "Not specified"
      }. Risk: ${session.routeRiskLevel} (${session.routeRiskScore}/100).`,
      trustedContactName: session.friendName || "",
      trustedContactPhone: session.friendPhone || "",
      source: "walk_safe",
    });

    return res.status(201).json({
      success: true,
      message: "SOS escalation created successfully.",
      data: {
        liveShareSession: session,
        sosAlert,
      },
    });
  } catch (error) {
    console.error("Escalate live share to SOS error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to escalate live share to SOS.",
      error: error.message,
    });
  }
}

async function getLiveShareSessions(req, res) {
  try {
    const {
      status = "",
      limit = 50,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const sessions = await LiveShareSession.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error("Get live share sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch live share sessions.",
      error: error.message,
    });
  }
}

module.exports = {
  createLiveShareSession,
  getLiveShareSessions,
  getLiveShareSession,
  updateLiveLocation,
  checkInLiveShareSession,
  completeLiveShareSession,
  cancelLiveShareSession,
  escalateLiveShareToSOS,
};