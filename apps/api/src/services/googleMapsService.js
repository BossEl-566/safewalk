function requireGoogleKey() {
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key is missing in .env");
  }

  return apiKey;
}

function decodePolyline(encoded) {
  let index = 0;
  const coordinates = [];
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = null;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}

async function getRouteFromGoogle({
  origin,
  destination,
  travelMode = "WALK",
}) {
  const apiKey = requireGoogleKey();

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.legs",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: origin.latitude,
              longitude: origin.longitude,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
          },
        },
        travelMode,
        computeAlternativeRoutes: true,
        languageCode: "en",
        units: "METRIC",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Google Routes API error:", data);
    throw new Error(data.error?.message || "Google route request failed.");
  }

  const routes = data.routes || [];

  return routes.map((route, index) => {
    const encodedPolyline = route.polyline?.encodedPolyline || "";
    const coordinates = encodedPolyline ? decodePolyline(encodedPolyline) : [];

    return {
      routeIndex: index,
      description: route.description || `Route ${index + 1}`,
      duration: route.duration || "",
      distanceMeters: route.distanceMeters || 0,
      encodedPolyline,
      coordinates,
    };
  });
}

module.exports = {
  getRouteFromGoogle,
  decodePolyline,
};