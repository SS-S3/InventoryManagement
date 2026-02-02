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
    googleLogin, // Added googleLogin from the store
  } = useAuthStore();
  return {
    user,
    token, // token is not part of AuthContextType, but is returned by useAuthStore
    isLoading: !isHydrated,
    isProcessing, // isProcessing is not part of AuthContextType, but is returned by useAuthStore
    error, // error is not part of AuthContextType, but is returned by useAuthStore
    login,
    register: (payload: RegisterPayload) => register(payload),
    logout,
    clearError, // clearError is not part of AuthContextType, but is returned by useAuthStore
    googleLogin,
  };
}
