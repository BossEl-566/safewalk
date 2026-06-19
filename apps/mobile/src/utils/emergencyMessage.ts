import { SOSLocation } from "../types/sos";

type GenerateEmergencyMessageParams = {
  userName: string;
  location: SOSLocation | null;
  createdAt: string;
};

export function generateEmergencyMessage({
  userName,
  location,
  createdAt,
}: GenerateEmergencyMessageParams) {
  const time = new Date(createdAt).toLocaleString();

  if (!location) {
    return `Emergency Alert from ${userName}. They may be in danger. Time: ${time}. Location could not be captured. Please call them immediately.`;
  }

  const mapLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

  return `Emergency Alert from ${userName}.

They may be in danger and triggered an SOS alert.

Time: ${time}
Location: ${mapLink}

Please call them immediately or contact emergency services.`;
}