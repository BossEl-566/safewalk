import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  IncidentAreaType,
  IncidentCategory,
  IncidentLocation,
  IncidentReport,
  IncidentSeverity,
} from "../types/incident";
import { generateIncidentAI, getIncidentCategoryLabel } from "../utils/incidentAI";

type CreateIncidentParams = {
  category: IncidentCategory;
  description: string;
  severity: IncidentSeverity;
  areaType: IncidentAreaType;
  location: IncidentLocation | null;
  locationName?: string;
  victimWasAlone: boolean;
  weaponInvolved: boolean;
  attackerMode?: string;
  lightingCondition?: string;
  anonymous: boolean;
};

type IncidentStore = {
  reports: IncidentReport[];
  createReport: (params: CreateIncidentParams) => string;
  deleteReport: (reportId: string) => void;
  clearReports: () => void;
  getReportById: (reportId: string) => IncidentReport | undefined;
};

export const useIncidentStore = create<IncidentStore>()(
  persist(
    (set, get) => ({
      reports: [],

      createReport: (params) => {
        const id = Date.now().toString();
        const now = new Date().toISOString();

        const ai = generateIncidentAI({
          category: params.category,
          severity: params.severity,
          areaType: params.areaType,
          victimWasAlone: params.victimWasAlone,
          weaponInvolved: params.weaponInvolved,
          description: params.description,
        });

        const report: IncidentReport = {
          id,
          category: params.category,
          title: getIncidentCategoryLabel(params.category),
          description: params.description.trim(),
          severity: params.severity,
          areaType: params.areaType,
          location: params.location,
          locationName: params.locationName?.trim(),
          victimWasAlone: params.victimWasAlone,
          weaponInvolved: params.weaponInvolved,
          attackerMode: params.attackerMode?.trim(),
          lightingCondition: params.lightingCondition?.trim(),
          anonymous: params.anonymous,
          status: "pending",
          aiRiskScore: ai.aiRiskScore,
          aiSummary: ai.aiSummary,
          occurredAt: now,
          createdAt: now,
        };

        set((state) => ({
          reports: [report, ...state.reports],
        }));

        return id;
      },

      deleteReport: (reportId) => {
        set((state) => ({
          reports: state.reports.filter((report) => report.id !== reportId),
        }));
      },

      clearReports: () => {
        set({ reports: [] });
      },

      getReportById: (reportId) => {
        return get().reports.find((report) => report.id === reportId);
      },
    }),
    {
      name: "safewalk-incident-reports",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);