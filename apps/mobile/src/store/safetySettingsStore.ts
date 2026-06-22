import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SafetySettingsStore = {
  defaultWalkDurationMinutes: number;
  riskWarningRadiusMeters: number;

  anonymousReportingDefault: boolean;
  autoShareSOSMessage: boolean;
  vibrationEnabled: boolean;

  ambulanceNumber: string;
  policeNumber: string;

  setDefaultWalkDurationMinutes: (minutes: number) => void;
  setRiskWarningRadiusMeters: (meters: number) => void;

  setAnonymousReportingDefault: (value: boolean) => void;
  setAutoShareSOSMessage: (value: boolean) => void;
  setVibrationEnabled: (value: boolean) => void;

  setAmbulanceNumber: (value: string) => void;
  setPoliceNumber: (value: string) => void;

  resetSettings: () => void;
};

const defaultSettings = {
  defaultWalkDurationMinutes: 15,
  riskWarningRadiusMeters: 800,

  anonymousReportingDefault: true,
  autoShareSOSMessage: true,
  vibrationEnabled: true,

  ambulanceNumber: "112",
  policeNumber: "191",
};

export const useSafetySettingsStore = create<SafetySettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setDefaultWalkDurationMinutes: (minutes) => {
        set({ defaultWalkDurationMinutes: minutes });
      },

      setRiskWarningRadiusMeters: (meters) => {
        set({ riskWarningRadiusMeters: meters });
      },

      setAnonymousReportingDefault: (value) => {
        set({ anonymousReportingDefault: value });
      },

      setAutoShareSOSMessage: (value) => {
        set({ autoShareSOSMessage: value });
      },

      setVibrationEnabled: (value) => {
        set({ vibrationEnabled: value });
      },

      setAmbulanceNumber: (value) => {
        set({ ambulanceNumber: value.trim() });
      },

      setPoliceNumber: (value) => {
        set({ policeNumber: value.trim() });
      },

      resetSettings: () => {
        set(defaultSettings);
      },
    }),
    {
      name: "safewalk-safety-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);