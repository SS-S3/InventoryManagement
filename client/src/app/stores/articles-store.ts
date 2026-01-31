import { create } from "zustand";
import { ArticlesResponse, fetchArticles as apiFetchArticles, refreshArticles as apiRefreshArticles } from "@/app/lib/api";

interface ArticlesState {
  fetchedFor: string | null;
  articles: ArticlesResponse["articles"];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  fetchArticles: (token: string) => Promise<void>;
  refreshArticles: (token: string) => Promise<void>;
  clearError: () => void;
}

export const useArticlesStore = create<ArticlesState>((set) => ({
  fetchedFor: null,
  articles: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  fetchArticles: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiFetchArticles(token);
      set({ fetchedFor: response.fetched_for, articles: response.articles, isLoading: false });
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
      set({ fetchedFor: response.fetched_for, articles: response.articles, isRefreshing: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh articles";
      set({ isRefreshing: false, error: message });
      throw new Error(message);
    }
  },
  clearError: () => set({ error: null }),
}));
