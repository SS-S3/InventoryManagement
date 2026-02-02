import { create } from "zustand";
import {
  AuthResponse,
  AuthUserResponse,
  RegisterPayload,
  fetchProfile,
  loginRequest,
  registerRequest,
} from "@/app/lib/api";

const TOKEN_STORAGE_KEY = "inventory_token";
const USER_STORAGE_KEY = "inventory_user";

type AuthError = string | null;

interface AuthState {
  user: AuthUserResponse | null;
  token: string | null;
  isHydrated: boolean;
  isProcessing: boolean;
  error: AuthError;
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<AuthUserResponse>;
  register: (payload: RegisterPayload) => Promise<AuthUserResponse>;
  logout: () => void;
  setUser: (user: AuthUserResponse | null) => void;
  clearError: () => void;
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function readStoredUser(): AuthUserResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUserResponse;
  } catch (error) {
    console.error("Failed to parse stored auth user", error);
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function persistSession(token: string, user: AuthUserResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearSessionStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isHydrated: false,
  isProcessing: false,
  error: null,
  hydrate: async () => {
    if (get().isHydrated) {
      return;
    }

    const storedToken = readStoredToken();
    const storedUser = readStoredUser();

    if (!storedToken) {
      set({ user: null, token: null, isHydrated: true, isProcessing: false, error: null });
      return;
    }

    try {
      const profile = await fetchProfile(storedToken);
      persistSession(storedToken, profile);
      set({ user: profile, token: storedToken, isHydrated: true, isProcessing: false, error: null });
    } catch (error) {
      console.error("Failed to hydrate auth store", error);
      clearSessionStorage();
      set({ user: null, token: null, isHydrated: true, isProcessing: false, error: null });
    }
  },
  login: async (username, password) => {
    set({ isProcessing: true, error: null });

    try {
      const response: AuthResponse = await loginRequest(username, password);
      persistSession(response.token, response.user);
      set({ user: response.user, token: response.token, isProcessing: false, error: null, isHydrated: true });
      return response.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to login";
      set({ isProcessing: false, error: message });
      throw new Error(message);
    }
  },
  register: async (payload) => {
    set({ isProcessing: true, error: null });
    try {
      await registerRequest(payload);
      const user = await get().login(payload.username, payload.password);
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      set({ isProcessing: false, error: message });
      throw new Error(message);
    }
  },
  logout: () => {
    clearSessionStorage();
    set({ user: null, token: null, error: null, isProcessing: false, isHydrated: true });
  },
  setUser: (user) => {
    const token = get().token;
    if (token && user) {
      persistSession(token, user);
    }
    set({ user, isHydrated: true });
  },
  clearError: () => set({ error: null }),
}));
