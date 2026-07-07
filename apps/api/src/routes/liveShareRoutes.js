const express = require("express");

const {
  createLiveShareSession,
  getLiveShareSession,
  updateLiveLocation,
  checkInLiveShareSession,
  completeLiveShareSession,
  cancelLiveShareSession,
  escalateLiveShareToSOS,
} = require("../controllers/liveShareController");

const router = express.Router();

router.post("/", createLiveShareSession);
router.get("/:shareToken", getLiveShareSession);
router.patch("/:shareToken/location", updateLiveLocation);
router.patch("/:shareToken/check-in", checkInLiveShareSession);
router.patch("/:shareToken/complete", completeLiveShareSession);
router.patch("/:shareToken/cancel", cancelLiveShareSession)
router.patch("/:shareToken/escalate-sos", escalateLiveShareToSOS);;

module.exports = router;