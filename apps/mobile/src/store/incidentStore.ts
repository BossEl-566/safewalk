import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  IncidentAreaType,
  IncidentCategory,
  IncidentLocation,
  IncidentPriority,
  IncidentReport,
  IncidentSeverity,
  ReportEvidence,
} from "../types/incident";
import { generateIncidentAI } from "../utils/incidentAI";

type CreateIncidentParams = {
  category: IncidentCategory;
  description: string;

  severity?: IncidentSeverity;
  priority?: IncidentPriority;
  areaType?: IncidentAreaType;

  location?: IncidentLocation | null;
  locationName?: string;
  buildingName?: string;
  roomNumber?: string;
  landmark?: string;

  evidence?: ReportEvidence[];

  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  reporterStudentId?: string;

  anonymous?: boolean;

  // Legacy fields kept while old screens are still being migrated
  victimWasAlone?: boolean;
  weaponInvolved?: boolean;
  attackerMode?: string;
  lightingCondition?: string;
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
          severity: params.severity ?? "medium",
          priority: params.priority ?? params.severity ?? "medium",
          areaType: params.areaType ?? "on_campus",
          description: params.description,
          locationName: params.locationName,
          buildingName: params.buildingName,
          roomNumber: params.roomNumber,
        });

        const report: IncidentReport = {
          id,

          institutionId: "university-of-ghana",
          institutionName: "University of Ghana",
          campusName: "Legon Campus",

          category: ai.category,
          problemType: ai.problemType,
          title: ai.title,
          description: params.description.trim(),

          severity: ai.severity,
          priority: ai.priority,
          priorityScore: ai.priorityScore,

          areaType: params.areaType ?? "on_campus",

          location: params.location ?? null,
          locationName: params.locationName?.trim() ?? "",
          buildingName: params.buildingName?.trim() ?? "",
          roomNumber: params.roomNumber?.trim() ?? "",
          landmark: params.landmark?.trim() ?? "",

          evidence: params.evidence ?? [],

          reporterName: params.reporterName?.trim() ?? "",
          reporterPhone: params.reporterPhone?.trim() ?? "",
          reporterEmail: params.reporterEmail?.trim() ?? "",
          reporterStudentId: params.reporterStudentId?.trim() ?? "",
          anonymous: params.anonymous ?? true,

          status: "ai_reviewed",
          assignedUnit: ai.responsibleUnit,
          assignedToName: "",

          acceptedAt: null,
          assignedAt: now,
          inProgressAt: null,
          resolvedAt: null,
          closedAt: null,

          escalationLevel: 0,

          aiRiskScore: ai.aiRiskScore,
          aiSummary: ai.aiSummary,
          aiRecommendedAction: ai.recommendedAction,
          aiSuggestedUnit: ai.responsibleUnit,
          aiDuplicateKey: "",
          duplicateCount: 1,

          resolutionSummary: "",
          resolutionEvidence: [],

          statusHistory: [
            {
              status: "submitted",
              note: "Student submitted a campus issue report.",
              actorName: params.anonymous ? "Anonymous Student" : params.reporterName || "Student",
              actorRole: "student",
              createdAt: now,
            },
            {
              status: "ai_reviewed",
              note: `SafeCampus AI classified the issue and routed it to ${ai.responsibleUnit}.`,
              actorName: "SafeCampus AI",
              actorRole: "ai",
              createdAt: now,
            },
          ],

          occurredAt: now,
          createdAt: now,
          updatedAt: now,

          victimWasAlone: params.victimWasAlone ?? false,
          weaponInvolved: params.weaponInvolved ?? false,
          attackerMode: params.attackerMode?.trim() ?? "",
          lightingCondition: params.lightingCondition?.trim() ?? "",
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
      name: "safecampus-campus-reports",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);