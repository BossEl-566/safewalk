const express = require("express");

const { checkLocationRisk } = require("../controllers/riskController");

const router = express.Router();

router.post("/check-location", checkLocationRisk);

module.exports = router;