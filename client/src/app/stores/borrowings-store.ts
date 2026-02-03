import { create } from "zustand";
import {
  BorrowingRecord,
  createBorrowing as apiCreateBorrowing,
  fetchBorrowings as apiFetchBorrowings,
  returnBorrowing as apiReturnBorrowing,
} from "@/app/lib/api";
import { getISTTimestamp } from "@/app/lib/date";

// Cache configuration: data is considered stale after 60 seconds
const STALE_TIME_MS = 60 * 1000;

interface BorrowingsState {
  records: BorrowingRecord[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchBorrowings: (token: string, forceRefresh?: boolean) => Promise<void>;
  createBorrowing: (
    token: string,
    payload: { user_id: number; tool_name: string; quantity?: number; expected_return_date?: string; notes?: string },
  ) => Promise<BorrowingRecord>;
  returnBorrowing: (token: string, borrowingId: number, notes?: string) => Promise<void>;
  clearError: () => void;
  invalidateCache: () => void;
}

export const useBorrowingsStore = create<BorrowingsState>((set, get) => ({
  records: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  fetchBorrowings: async (token, forceRefresh = false) => {
    // Skip fetch if data is fresh (within stale time)
    const { lastFetched, isLoading } = get();
    if (!forceRefresh && lastFetched && Date.now() - lastFetched < STALE_TIME_MS && !isLoading) {
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const records = await apiFetchBorrowings(token);
      set({ records, isLoading: false, lastFetched: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load borrowings";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },
  createBorrowing: async (token, payload) => {
    set({ error: null });
    try {
      const record = await apiCreateBorrowing(token, payload);
      set({ records: [record, ...get().records], lastFetched: Date.now() });
      return record;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create borrowing";
      set({ error: message });
      throw new Error(message);
    }
  },
  returnBorrowing: async (token, borrowingId, notes) => {
    set({ error: null });
    try {
      await apiReturnBorrowing(token, borrowingId, notes);
      set({
        records: get().records.map((record) =>
          record.id === borrowingId
            ? { ...record, returned_at: getISTTimestamp(), notes: notes ?? record.notes }
            : record,
        ),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to close borrowing";
      set({ error: message });
      throw new Error(message);
    }
  },
  clearError: () => set({ error: null }),
  invalidateCache: () => set({ lastFetched: null }),
}));
