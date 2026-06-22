const express = require("express");

const {
  recommendSafeRoute,
  getSafeRouteHistory,
} = require("../controllers/safeRouteController");

const router = express.Router();

router.get("/", getSafeRouteHistory);
router.post("/recommend", recommendSafeRoute);

module.exports = router;