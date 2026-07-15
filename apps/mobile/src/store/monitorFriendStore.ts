import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type MonitorFriendStore = {
  lastToken: string;
  setLastToken: (token: string) => void;
  clearLastToken: () => void;
};

export const useMonitorFriendStore = create<MonitorFriendStore>()(
  persist(
    (set) => ({
      lastToken: "",

      setLastToken: (token) => {
        set({
          lastToken: token,
        });
      },

      clearLastToken: () => {
        set({
          lastToken: "",
        });
      },
    }),
    {
      name: "safewalk-monitor-friend",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);