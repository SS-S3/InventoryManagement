import { create } from "zustand";
import { DashboardSummary, fetchDashboardSummary as apiFetchDashboardSummary } from "@/app/lib/api";

interface DashboardState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchSummary: (token: string) => Promise<void>;
  clear: () => void;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,
  fetchSummary: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await apiFetchDashboardSummary(token);
      set({ summary, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load dashboard";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },
  clear: () => set({ summary: null }),
  clearError: () => set({ error: null }),
}));
