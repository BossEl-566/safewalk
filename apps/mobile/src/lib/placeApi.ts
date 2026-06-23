import { PlaceDetails, PlaceSuggestion } from "../types/place";
import { api } from "./api";

export async function autocompletePlacesApi(input: string) {
  if (!input.trim()) {
    return [];
  }

  const response = await api.get("/places/autocomplete", {
    params: {
      input,
    },
  });

  const suggestions = response.data?.data ?? [];

  return suggestions as PlaceSuggestion[];
}

export async function getPlaceDetailsApi(placeId: string) {
  const response = await api.get("/places/details", {
    params: {
      placeId,
    },
  });

  return response.data?.data as PlaceDetails;
}
