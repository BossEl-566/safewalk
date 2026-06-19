export type SOSLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  address?: string;
};

export type SOSAlert = {
  id: string;
  userName: string;
  status: "active" | "cancelled" | "resolved";
  location: SOSLocation | null;
  message: string;
  createdAt: string;
  resolvedAt?: string;
};