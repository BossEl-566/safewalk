import { SOSLocation } from "../types/sos";
import { api } from "./api";

export type CreateSOSAlertPayload = {
  userName: string;
  location: SOSLocation | null;
  message: string;
  trustedContactName?: string;
  trustedContactPhone?: string;
  source?: "sos_button" | "walk_safe" | "manual";
};

export async function createSOSAlertApi(payload: CreateSOSAlertPayload) {
  const response = await api.post("/sos", payload);
  return response.data;
}

export async function getSOSAlertsApi() {
  const response = await api.get("/sos");
  return response.data;
}

export async function resolveSOSAlertApi(alertId: string) {
  const response = await api.patch(`/sos/${alertId}/resolve`);
  return response.data;
}

export async function cancelSOSAlertApi(alertId: string) {
  const response = await api.patch(`/sos/${alertId}/cancel`);
  return response.data;
}