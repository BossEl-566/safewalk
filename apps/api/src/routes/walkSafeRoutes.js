const express = require("express");

const {
  createWalkSafeSession,
  getWalkSafeSessions,
  getWalkSafeSessionById,
  checkInWalkSafeSession,
  completeWalkSafeSession,
  cancelWalkSafeSession,
} = require("../controllers/walkSafeController");

const router = express.Router();

router.get("/", getWalkSafeSessions);
router.get("/:id", getWalkSafeSessionById);
router.post("/", createWalkSafeSession);
router.patch("/:id/check-in", checkInWalkSafeSession);
router.patch("/:id/complete", completeWalkSafeSession);
router.patch("/:id/cancel", cancelWalkSafeSession);

module.exports = router;