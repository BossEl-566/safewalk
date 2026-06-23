const {
  searchPlacesAutocomplete,
  getPlaceDetails,
} = require("../services/googlePlacesService");

async function autocompletePlaces(req, res) {
  try {
    const { input } = req.query;

    const suggestions = await searchPlacesAutocomplete({
      input: String(input || ""),
    });

    return res.json({
      success: true,
      count: suggestions.length,
      data: suggestions,
    });
  } catch (error) {
    console.error("Autocomplete places error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch place suggestions.",
      error: error.message,
    });
  }
}

async function placeDetails(req, res) {
  try {
    const { placeId } = req.query;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: "placeId is required.",
      });
    }

    const place = await getPlaceDetails({
      placeId: String(placeId),
    });

    return res.json({
      success: true,
      data: place,
    });
  } catch (error) {
    console.error("Place details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch place details.",
      error: error.message,
    });
  }
}

module.exports = {
  autocompletePlaces,
  placeDetails,
};