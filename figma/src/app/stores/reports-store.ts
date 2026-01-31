import { create } from "zustand";
import {
  CompetitionRecord,
  DepartmentSubmissionStats,
  fetchCompetitionCalendar as apiFetchCompetitionCalendar,
  fetchDepartmentSubmissionStats,
} from "@/app/lib/api";

interface ReportsState {
  departmentStats: DepartmentSubmissionStats[];
  competitionCalendar: CompetitionRecord[];
  isLoadingStats: boolean;
  isLoadingCompetitions: boolean;
  error: string | null;
  fetchDepartmentStats: (token: string) => Promise<void>;
  fetchCompetitionCalendar: (token: string) => Promise<void>;
  clearError: () => void;
}

export const useReportsStore = create<ReportsState>((set) => ({
  departmentStats: [],
  competitionCalendar: [],
  isLoadingStats: false,
  isLoadingCompetitions: false,
  error: null,
  fetchDepartmentStats: async (token) => {
    set({ isLoadingStats: true, error: null });
    try {
      const departmentStats = await fetchDepartmentSubmissionStats(token);
      set({ departmentStats, isLoadingStats: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load department stats";
      set({ isLoadingStats: false, error: message });
      throw new Error(message);
    }
  },
  fetchCompetitionCalendar: async (token) => {
    set({ isLoadingCompetitions: true, error: null });
    try {
      const competitionCalendar = await apiFetchCompetitionCalendar(token);
      set({ competitionCalendar, isLoadingCompetitions: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load competitions";
      set({ isLoadingCompetitions: false, error: message });
      throw new Error(message);
    }
  },
  clearError: () => set({ error: null }),
}));
