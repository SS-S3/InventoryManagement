import { create } from "zustand";
import { DashboardSummary, fetchDashboardSummary as apiFetchDashboardSummary } from "@/app/lib/api";

// Cache configuration: data is considered stale after 60 seconds
const STALE_TIME_MS = 60 * 1000;

interface DashboardState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchSummary: (token: string, forceRefresh?: boolean) => Promise<void>;
  clear: () => void;
  clearError: () => void;
  invalidateCache: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  summary: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  fetchSummary: async (token, forceRefresh = false) => {
    // Skip fetch if data is fresh (within stale time)
    const { lastFetched, isLoading } = get();
    if (!forceRefresh && lastFetched && Date.now() - lastFetched < STALE_TIME_MS && !isLoading) {
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const summary = await apiFetchDashboardSummary(token);
      set({ summary, isLoading: false, lastFetched: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load dashboard";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },
  clear: () => set({ summary: null, lastFetched: null }),
  clearError: () => set({ error: null }),
  invalidateCache: () => set({ lastFetched: null }),
}));
