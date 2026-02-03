import { create } from "zustand";
import { ArticlesResponse, fetchArticles as apiFetchArticles, refreshArticles as apiRefreshArticles } from "@/app/lib/api";

// Cache configuration: articles are fetched twice daily, cache for 5 minutes
const STALE_TIME_MS = 5 * 60 * 1000;

interface ArticlesState {
  fetchedFor: string | null;
  articles: ArticlesResponse["articles"];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchArticles: (token: string, forceRefresh?: boolean) => Promise<void>;
  refreshArticles: (token: string) => Promise<void>;
  clearError: () => void;
  invalidateCache: () => void;
}

export const useArticlesStore = create<ArticlesState>((set, get) => ({
  fetchedFor: null,
  articles: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetched: null,
  fetchArticles: async (token, forceRefresh = false) => {
    // Skip fetch if data is fresh (within stale time)
    const { lastFetched, isLoading } = get();
    if (!forceRefresh && lastFetched && Date.now() - lastFetched < STALE_TIME_MS && !isLoading) {
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const response = await apiFetchArticles(token);
      set({ fetchedFor: response.fetched_for, articles: response.articles, isLoading: false, lastFetched: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load articles";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },
  refreshArticles: async (token) => {
    set({ isRefreshing: true, error: null });
    try {
      await apiRefreshArticles(token);
      const response = await apiFetchArticles(token);
      set({ fetchedFor: response.fetched_for, articles: response.articles, isRefreshing: false, lastFetched: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh articles";
      set({ isRefreshing: false, error: message });
      throw new Error(message);
    }
  },
  clearError: () => set({ error: null }),
  invalidateCache: () => set({ lastFetched: null }),
}));
