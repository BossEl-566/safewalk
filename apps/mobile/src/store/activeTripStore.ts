import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type RiskLevel = "low" | "medium" | "high" | "critical";

type Coordinate = {
  latitude: number;
  longitude: number;
};

export type ActiveTrip = {
  id: string;
  status: "active" | "completed" | "cancelled";

  shareToken?: string | null;

  mode: "walk_safe" | "walk_home" | "ride_safe" | "manual";

  destinationName: string;
  destinationLocation?: Coordinate | null;
  currentLocation?: Coordinate | null;

  riskLevel: RiskLevel;
  riskScore: number;

  startedAt: string;
  expectedArrivalAt?: string | null;

  lastCheckInAt?: string | null;
  nextCheckInAt: number;
  checkInIntervalMinutes: number;
};

type StartTripPayload = {
  shareToken?: string | null;
  mode?: ActiveTrip["mode"];
  destinationName: string;
  destinationLocation?: Coordinate | null;
  currentLocation?: Coordinate | null;
  riskLevel?: RiskLevel;
  riskScore?: number;
  expectedArrivalAt?: string | null;
  checkInIntervalMinutes?: number;
};

type ActiveTripStore = {
  activeTrip: ActiveTrip | null;
  checkInPopupVisible: boolean;
  secondsLeft: number;

  startTrip: (payload: StartTripPayload) => void;
  updateShareToken: (shareToken: string) => void;
  updateCurrentLocation: (location: Coordinate) => void;

  showCheckInPopup: () => void;
  hideCheckInPopup: () => void;
  markCheckIn: () => void;

  completeTrip: () => void;
  cancelTrip: () => void;
  clearTrip: () => void;

  tick: () => void;
};

export const useActiveTripStore = create<ActiveTripStore>()(
  persist(
    (set, get) => ({
      activeTrip: null,
      checkInPopupVisible: false,
      secondsLeft: 0,

      startTrip: (payload) => {
        const now = Date.now();
        const interval = payload.checkInIntervalMinutes ?? 3;

        set({
          activeTrip: {
            id: `${now}`,
            status: "active",

            shareToken: payload.shareToken ?? null,
            mode: payload.mode ?? "walk_safe",

            destinationName: payload.destinationName,
            destinationLocation: payload.destinationLocation ?? null,
            currentLocation: payload.currentLocation ?? null,

            riskLevel: payload.riskLevel ?? "low",
            riskScore: payload.riskScore ?? 0,

            startedAt: new Date(now).toISOString(),
            expectedArrivalAt: payload.expectedArrivalAt ?? null,

            lastCheckInAt: null,
            nextCheckInAt: now + interval * 60 * 1000,
            checkInIntervalMinutes: interval,
          },
          checkInPopupVisible: false,
          secondsLeft: interval * 60,
        });
      },

      updateShareToken: (shareToken) => {
        const activeTrip = get().activeTrip;
        if (!activeTrip) return;

        set({
          activeTrip: {
            ...activeTrip,
            shareToken,
          },
        });
      },

      updateCurrentLocation: (location) => {
        const activeTrip = get().activeTrip;
        if (!activeTrip) return;

        set({
          activeTrip: {
            ...activeTrip,
            currentLocation: location,
          },
        });
      },

      showCheckInPopup: () => {
        set({
          checkInPopupVisible: true,
        });
      },

      hideCheckInPopup: () => {
        set({
          checkInPopupVisible: false,
        });
      },

      markCheckIn: () => {
        const activeTrip = get().activeTrip;
        if (!activeTrip) return;

        const now = Date.now();

        set({
          activeTrip: {
            ...activeTrip,
            lastCheckInAt: new Date(now).toISOString(),
            nextCheckInAt:
              now + activeTrip.checkInIntervalMinutes * 60 * 1000,
          },
          checkInPopupVisible: false,
          secondsLeft: activeTrip.checkInIntervalMinutes * 60,
        });
      },

      completeTrip: () => {
        const activeTrip = get().activeTrip;
        if (!activeTrip) return;

        set({
          activeTrip: {
            ...activeTrip,
            status: "completed",
          },
          checkInPopupVisible: false,
        });
      },

      cancelTrip: () => {
        const activeTrip = get().activeTrip;
        if (!activeTrip) return;

        set({
          activeTrip: {
            ...activeTrip,
            status: "cancelled",
          },
          checkInPopupVisible: false,
        });
      },

      clearTrip: () => {
        set({
          activeTrip: null,
          checkInPopupVisible: false,
          secondsLeft: 0,
        });
      },

      tick: () => {
        const activeTrip = get().activeTrip;

        if (!activeTrip || activeTrip.status !== "active") {
          set({
            secondsLeft: 0,
            checkInPopupVisible: false,
          });
          return;
        }

        const remainingSeconds = Math.max(
          0,
          Math.ceil((activeTrip.nextCheckInAt - Date.now()) / 1000)
        );

        if (remainingSeconds <= 0) {
          set({
            secondsLeft: 0,
            checkInPopupVisible: true,
          });
          return;
        }

        set({
          secondsLeft: remainingSeconds,
        });
      },
    }),
    {
      name: "safewalk-active-trip",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);