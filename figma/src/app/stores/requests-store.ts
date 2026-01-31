import { create } from "zustand";
import {
  RequestRecord,
  createRequest as apiCreateRequest,
  approveRequest as apiApproveRequest,
  rejectRequest as apiRejectRequest,
  cancelRequest as apiCancelRequest,
  fetchRequests as apiFetchRequests,
} from "@/app/lib/api";

type RequestStatusFilter = RequestRecord["status"] | "all" | null;

interface RequestsState {
  records: RequestRecord[];
  isLoading: boolean;
  error: string | null;
  statusFilter: RequestStatusFilter;
  fetchRequests: (token: string, status?: RequestRecord["status"]) => Promise<void>;
  setStatusFilter: (status: RequestStatusFilter) => void;
  createRequest: (
    token: string,
    payload: { title: string; tool_name: string; quantity?: number; reason?: string; expected_return_date?: string },
  ) => Promise<RequestRecord>;
  approveRequest: (token: string, id: number) => Promise<void>;
  rejectRequest: (token: string, id: number, reason?: string) => Promise<void>;
  cancelRequest: (token: string, id: number, reason?: string) => Promise<void>;
  clearError: () => void;
}

export const useRequestsStore = create<RequestsState>((set, get) => ({
  records: [],
  isLoading: false,
  error: null,
  statusFilter: "all",
  fetchRequests: async (token, status) => {
    set({ isLoading: true, error: null });
    try {
      const records = await apiFetchRequests(token, status);
      set({ records, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load requests";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },
  setStatusFilter: (status) => set({ statusFilter: status }),
  createRequest: async (token, payload) => {
    set({ error: null });
    try {
      const record = await apiCreateRequest(token, payload);
      set({ records: [record, ...get().records] });
      return record;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create request";
      set({ error: message });
      throw new Error(message);
    }
  },
  approveRequest: async (token, id) => {
    set({ error: null });
    try {
      await apiApproveRequest(token, id);
      set({
        records: get().records.map((record) =>
          record.id === id
            ? { ...record, status: "approved", resolved_at: new Date().toISOString(), cancellation_reason: null }
            : record,
        ),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve request";
      set({ error: message });
      throw new Error(message);
    }
  },
  rejectRequest: async (token, id, reason) => {
    set({ error: null });
    try {
      await apiRejectRequest(token, id, reason);
      set({
        records: get().records.map((record) =>
          record.id === id
            ? {
                ...record,
                status: "rejected",
                resolved_at: new Date().toISOString(),
                cancellation_reason: reason ?? null,
              }
            : record,
        ),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject request";
      set({ error: message });
      throw new Error(message);
    }
  },
  cancelRequest: async (token, id, reason) => {
    set({ error: null });
    try {
      await apiCancelRequest(token, id, reason);
      set({
        records: get().records.map((record) =>
          record.id === id
            ? {
                ...record,
                status: "cancelled",
                resolved_at: new Date().toISOString(),
                cancellation_reason: reason ?? null,
              }
            : record,
        ),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel request";
      set({ error: message });
      throw new Error(message);
    }
  },
  clearError: () => set({ error: null }),
}));
