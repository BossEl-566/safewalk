const express = require("express");

const {
  autocompletePlaces,
  placeDetails,
} = require("../controllers/placesController");

const router = express.Router();

router.get("/autocomplete", autocompletePlaces);
router.get("/details", placeDetails);

module.exports = router;