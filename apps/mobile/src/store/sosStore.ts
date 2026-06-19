import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { SOSAlert, SOSLocation } from "../types/sos";
import { generateEmergencyMessage } from "../utils/emergencyMessage";

type CreateSOSAlertParams = {
  userName: string;
  location: SOSLocation | null;
};

type SOSStore = {
  alerts: SOSAlert[];
  activeAlertId: string | null;
  createSOSAlert: (params: CreateSOSAlertParams) => string;
  resolveSOSAlert: (alertId: string) => void;
  cancelSOSAlert: (alertId: string) => void;
  getAlertById: (alertId: string) => SOSAlert | undefined;
};

export const useSOSStore = create<SOSStore>()(
  persist(
    (set, get) => ({
      alerts: [],
      activeAlertId: null,

      createSOSAlert: ({ userName, location }) => {
        const createdAt = new Date().toISOString();
        const id = Date.now().toString();

        const message = generateEmergencyMessage({
          userName,
          location,
          createdAt,
        });

        const newAlert: SOSAlert = {
          id,
          userName,
          status: "active",
          location,
          message,
          createdAt,
        };

        set((state) => ({
          alerts: [newAlert, ...state.alerts],
          activeAlertId: id,
        }));

        return id;
      },

      resolveSOSAlert: (alertId) => {
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === alertId
              ? {
                  ...alert,
                  status: "resolved",
                  resolvedAt: new Date().toISOString(),
                }
              : alert
          ),
          activeAlertId:
            state.activeAlertId === alertId ? null : state.activeAlertId,
        }));
      },

      cancelSOSAlert: (alertId) => {
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === alertId
              ? {
                  ...alert,
                  status: "cancelled",
                  resolvedAt: new Date().toISOString(),
                }
              : alert
          ),
          activeAlertId:
            state.activeAlertId === alertId ? null : state.activeAlertId,
        }));
      },

      getAlertById: (alertId) => {
        return get().alerts.find((alert) => alert.id === alertId);
      },
    }),
    {
      name: "safewalk-sos-alerts",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);