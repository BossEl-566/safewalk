export type EmergencyContact = {
  id: string;
  backendId?: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  isPrimary?: boolean;
  createdAt: string;
};