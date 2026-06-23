import { MapCoordinate, RouteRiskLevel } from "./navigation";

export type LiveShareMode =
  | "walk_safe"
  | "walk_home"
  | "ride_safe"
  | "lecture_trip"
  | "manual";

export type LiveShareStatus = "active" | "completed" | "cancelled";

export type LiveShareLocation = MapCoordinate & {
  accuracy?: number | null;
  timestamp?: string;
};

export type LiveShareSession = {
  id: string;
  backendId?: string;
  shareToken: string;
  shareUrl?: string;

  ownerName: string;
  friendName?: string;
  friendPhone?: string;

  mode: LiveShareMode;
  status: LiveShareStatus;

  destinationName?: string;
  destinationLocation?: LiveShareLocation | null;

  currentLocation: LiveShareLocation | null;
  lastKnownLocation?: LiveShareLocation | null;

  routeRiskLevel: RouteRiskLevel;
  routeRiskScore: number;

  lastCheckInStatus: "safe" | "not_checked" | "missed";
  lastCheckInAt?: string | null;

  expectedArrivalAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;

  locationUpdates: LiveShareLocation[];
  createdAt: string;
  updatedAt?: string;
};