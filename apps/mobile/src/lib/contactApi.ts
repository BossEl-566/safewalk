import { EmergencyContact } from "../types/contact";
import { api } from "./api";

export type CreateEmergencyContactPayload = {
  name: string;
  phone: string;
  relationship: string;
  priority?: number;
  isPrimary?: boolean;
};

function normalizeEmergencyContact(contact: any): EmergencyContact {
  return {
    id: contact.id ?? contact._id ?? String(Date.now()),
    backendId: contact._id ?? contact.id,
    name: contact.name ?? "",
    phone: contact.phone ?? "",
    relationship: contact.relationship ?? "",
    priority: Number(contact.priority ?? 1),
    isPrimary: Boolean(contact.isPrimary),
    createdAt: contact.createdAt ?? new Date().toISOString(),
  };
}

export async function createEmergencyContactApi(
  payload: CreateEmergencyContactPayload
) {
  const response = await api.post("/contacts", payload);
  return normalizeEmergencyContact(response.data?.data);
}

export async function getEmergencyContactsApi() {
  const response = await api.get("/contacts");
  const contacts = response.data?.data ?? [];

  return contacts.map(normalizeEmergencyContact);
}

export async function deleteEmergencyContactApi(contactId: string) {
  const response = await api.delete(`/contacts/${contactId}`);
  return response.data;
}