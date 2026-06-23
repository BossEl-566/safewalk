export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  googleMapsUri?: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
};