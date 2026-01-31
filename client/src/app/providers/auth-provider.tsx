import { ReactNode, useEffect } from "react";
import { RegisterPayload } from "@/app/lib/api";
import { useAuthStore } from "@/app/stores/auth-store";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}

export function useAuth() {
  const {
    user,
    token,
    isHydrated,
    isProcessing,
    error,
    login,
    register,
    logout,
    clearError,
  } = useAuthStore();

  return {
    user,
    token,
    isLoading: !isHydrated,
    isProcessing,
    error,
    login,
    register: (payload: RegisterPayload) => register(payload),
    logout,
    clearError,
  };
}
