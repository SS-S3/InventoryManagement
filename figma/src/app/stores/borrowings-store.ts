import { create } from "zustand";
import {
  BorrowingRecord,
  createBorrowing as apiCreateBorrowing,
  fetchBorrowings as apiFetchBorrowings,
  returnBorrowing as apiReturnBorrowing,
} from "@/app/lib/api";

interface BorrowingsState {
  records: BorrowingRecord[];
  isLoading: boolean;
  error: string | null;
  fetchBorrowings: (token: string) => Promise<void>;
  createBorrowing: (
    token: string,
    payload: { user_id: number; tool_name: string; quantity?: number; expected_return_date?: string; notes?: string },
  ) => Promise<BorrowingRecord>;
  returnBorrowing: (token: string, borrowingId: number, notes?: string) => Promise<void>;
  clearError: () => void;
}

export const useBorrowingsStore = create<BorrowingsState>((set, get) => ({
  records: [],
  isLoading: false,
  error: null,
  fetchBorrowings: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const records = await apiFetchBorrowings(token);
      set({ records, isLoading: false });
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
      set({ records: [record, ...get().records] });
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
            ? { ...record, returned_at: new Date().toISOString(), notes: notes ?? record.notes }
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
}));
