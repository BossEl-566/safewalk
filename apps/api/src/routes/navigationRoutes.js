const express = require("express");

const {
  calculateSafeNavigationRoute,
} = require("../controllers/navigationController");

const router = express.Router();

router.post("/safe-route", calculateSafeNavigationRoute);

module.exports = router;