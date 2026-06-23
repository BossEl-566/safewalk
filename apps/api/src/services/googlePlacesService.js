function requirePlacesKey() {
  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Places API key is missing in .env");
  }

  return apiKey;
}

async function searchPlacesAutocomplete({ input }) {
  const apiKey = requirePlacesKey();

  if (!input || input.trim().length < 2) {
    return [];
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
      },
      body: JSON.stringify({
        input: input.trim(),
        includedRegionCodes: ["gh"],
        languageCode: "en",
        locationBias: {
          circle: {
            center: {
              latitude: 6.6745,
              longitude: -1.5716,
            },
            radius: 50000,
          },
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Google Places Autocomplete error:", data);
    throw new Error(
      data.error?.message || "Google Places autocomplete request failed."
    );
  }

  const suggestions = data.suggestions || [];

  return suggestions
    .filter((item) => item.placePrediction)
    .map((item) => {
      const prediction = item.placePrediction;

      return {
        placeId: prediction.placeId,
        description: prediction.text?.text || "",
        mainText: prediction.structuredFormat?.mainText?.text || "",
        secondaryText: prediction.structuredFormat?.secondaryText?.text || "",
      };
    });
}

async function getPlaceDetails({ placeId }) {
  const apiKey = requirePlacesKey();

  if (!placeId || !placeId.trim()) {
    throw new Error("placeId is required.");
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,location,googleMapsUri",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Google Place Details error:", data);
    throw new Error(
      data.error?.message || "Google Place Details request failed."
    );
  }

  return {
    placeId: data.id || placeId,
    name: data.displayName?.text || data.formattedAddress || "Selected place",
    address: data.formattedAddress || "",
    googleMapsUri: data.googleMapsUri || "",
    location: data.location
      ? {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        }
      : null,
  };
}

module.exports = {
  searchPlacesAutocomplete,
  getPlaceDetails,
};