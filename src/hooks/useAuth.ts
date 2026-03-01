"use client";

import { useEffect, useState, useCallback } from "react";
import { getSdk, getToken, setToken, clearToken, isAuthenticated } from "@/lib/casdoor";

interface AuthState {
  token: string | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
}

export function useAuth(): AuthState {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing token from localStorage
    const stored = getToken();
    setTokenState(stored);
    setLoading(false);
  }, []);

  const signIn = useCallback(() => {
    // Redirect to Casdoor login page
    const url = getSdk().getSigninUrl();
    window.location.href = url;
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setTokenState(null);
    window.location.href = "/login";
  }, []);

  return {
    token,
    loading,
    signIn,
    signOut,
  };
}

// Re-export helpers for convenience
export { getToken, setToken, clearToken, isAuthenticated };
