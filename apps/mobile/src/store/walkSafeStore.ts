import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  WalkSafeLocation,
  WalkSafeNearbyRisk,
  WalkSafeRiskLevel,
  WalkSafeSession,
} from "../types/walkSafe";

type StartWalkSafeParams = {
  destinationName: string;
  trustedContactId: string;
  trustedContactName: string;
  trustedContactPhone: string;
  expectedDurationMinutes: number;
  startLocation: WalkSafeLocation | null;
  nearbyRiskWarnings?: WalkSafeNearbyRisk[];
};

type WalkSafeStore = {
  sessions: WalkSafeSession[];
  activeSessionId: string | null;

  startSession: (params: StartWalkSafeParams) => string;
  setSessionBackendId: (localSessionId: string, backendId: string) => void;
  checkInSafe: (sessionId: string) => void;
  completeSession: (sessionId: string) => void;
  cancelSession: (sessionId: string) => void;
  getSessionById: (sessionId: string) => WalkSafeSession | undefined;
};

function getExpectedArrival(startedAt: string, minutes: number) {
  const date = new Date(startedAt);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function calculateInitialRiskLevel(
  minutes: number,
  nearbyRiskWarnings: WalkSafeNearbyRisk[]
): WalkSafeRiskLevel {
  const highestRiskScore = nearbyRiskWarnings[0]?.aiRiskScore ?? 0;

  if (highestRiskScore >= 85) return "critical";
  if (highestRiskScore >= 70) return "high";
  if (minutes >= 30) return "high";
  if (highestRiskScore >= 40) return "medium";
  if (minutes >= 15) return "medium";

  return "low";
}

export const useWalkSafeStore = create<WalkSafeStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      startSession: (params) => {
        const id = Date.now().toString();
        const startedAt = new Date().toISOString();
        const nearbyRiskWarnings = params.nearbyRiskWarnings ?? [];

        const newSession: WalkSafeSession = {
          id,
          status: "active",
          startLocation: params.startLocation,
          destinationName: params.destinationName.trim(),
          trustedContactId: params.trustedContactId,
          trustedContactName: params.trustedContactName,
          trustedContactPhone: params.trustedContactPhone,
          expectedDurationMinutes: params.expectedDurationMinutes,
          startedAt,
          expectedArrivalAt: getExpectedArrival(
            startedAt,
            params.expectedDurationMinutes
          ),
          riskLevel: calculateInitialRiskLevel(
            params.expectedDurationMinutes,
            nearbyRiskWarnings
          ),
          nearbyRiskWarnings,
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
        }));

        return id;
      },

      setSessionBackendId: (localSessionId, backendId) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === localSessionId
              ? {
                  ...session,
                  backendId,
                }
              : session
          ),
        }));
      },

      checkInSafe: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  lastCheckInAt: new Date().toISOString(),
                }
              : session
          ),
        }));
      },

      completeSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  status: "completed",
                  completedAt: new Date().toISOString(),
                }
              : session
          ),
          activeSessionId:
            state.activeSessionId === sessionId ? null : state.activeSessionId,
        }));
      },

      cancelSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  status: "cancelled",
                  cancelledAt: new Date().toISOString(),
                }
              : session
          ),
          activeSessionId:
            state.activeSessionId === sessionId ? null : state.activeSessionId,
        }));
      },

      getSessionById: (sessionId) => {
        return get().sessions.find((session) => session.id === sessionId);
      },
    }),
    {
      name: "safewalk-walk-safe-sessions",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);