import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { LiveShareSession } from "../types/liveShare";

type LiveShareStore = {
  activeShare: LiveShareSession | null;
  setActiveShare: (session: LiveShareSession | null) => void;
  clearActiveShare: () => void;
};

export const useLiveShareStore = create<LiveShareStore>()(
  persist(
    (set) => ({
      activeShare: null,

      setActiveShare: (session) => {
        set({ activeShare: session });
      },

      clearActiveShare: () => {
        set({ activeShare: null });
      },
    }),
    {
      name: "safewalk-live-share",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);