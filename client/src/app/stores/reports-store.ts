import { create } from "zustand";
import {
  CompetitionRecord,
  DepartmentSubmissionStats,
  fetchCompetitionCalendar as apiFetchCompetitionCalendar,
  fetchDepartmentSubmissionStats,
} from "@/app/lib/api";

// Cache configuration: data is considered stale after 2 minutes
const STALE_TIME_MS = 2 * 60 * 1000;

interface ReportsState {
  departmentStats: DepartmentSubmissionStats[];
  competitionCalendar: CompetitionRecord[];
  isLoadingStats: boolean;
  isLoadingCompetitions: boolean;
  error: string | null;
  lastFetchedStats: number | null;
  lastFetchedCompetitions: number | null;
  fetchDepartmentStats: (token: string, forceRefresh?: boolean) => Promise<void>;
  fetchCompetitionCalendar: (token: string, forceRefresh?: boolean) => Promise<void>;
  clearError: () => void;
  invalidateCache: () => void;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  departmentStats: [],
  competitionCalendar: [],
  isLoadingStats: false,
  isLoadingCompetitions: false,
  error: null,
  lastFetchedStats: null,
  lastFetchedCompetitions: null,
  fetchDepartmentStats: async (token, forceRefresh = false) => {
    // Skip fetch if data is fresh
    const { lastFetchedStats, isLoadingStats } = get();
    if (!forceRefresh && lastFetchedStats && Date.now() - lastFetchedStats < STALE_TIME_MS && !isLoadingStats) {
      return;
    }
    
    set({ isLoadingStats: true, error: null });
    try {
      const departmentStats = await fetchDepartmentSubmissionStats(token);
      set({ departmentStats, isLoadingStats: false, lastFetchedStats: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load department stats";
      set({ isLoadingStats: false, error: message });
      throw new Error(message);
    }
  },
  fetchCompetitionCalendar: async (token, forceRefresh = false) => {
    // Skip fetch if data is fresh
    const { lastFetchedCompetitions, isLoadingCompetitions } = get();
    if (!forceRefresh && lastFetchedCompetitions && Date.now() - lastFetchedCompetitions < STALE_TIME_MS && !isLoadingCompetitions) {
      return;
    }
    
    set({ isLoadingCompetitions: true, error: null });
    try {
      const competitionCalendar = await apiFetchCompetitionCalendar(token);
      set({ competitionCalendar, isLoadingCompetitions: false, lastFetchedCompetitions: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load competitions";
      set({ isLoadingCompetitions: false, error: message });
      throw new Error(message);
    }
  },
  clearError: () => set({ error: null }),
  invalidateCache: () => set({ lastFetchedStats: null, lastFetchedCompetitions: null }),
}));
