import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface LocalUser {
  id: number;
  username: string;
  role: string;
}

interface LocalAuthContextType {
  user: LocalUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const LocalAuthContext = createContext<LocalAuthContextType | null>(null);

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loginMutation = trpc.localAuth.login.useMutation();
  const registerMutation = trpc.localAuth.register.useMutation();

  useEffect(() => {
    const savedToken = localStorage.getItem("proxy_token");
    const savedUser = localStorage.getItem("proxy_user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginMutation.mutateAsync({ username, password });
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem("proxy_token", result.token);
    localStorage.setItem("proxy_user", JSON.stringify(result.user));
  }, [loginMutation]);

  const register = useCallback(async (username: string, password: string) => {
    const result = await registerMutation.mutateAsync({ username, password });
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem("proxy_token", result.token);
    localStorage.setItem("proxy_user", JSON.stringify(result.user));
  }, [registerMutation]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("proxy_token");
    localStorage.removeItem("proxy_user");
  }, []);

  return (
    <LocalAuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAdmin: user?.role === "admin",
      isAuthenticated: !!user,
    }}>
      {children}
    </LocalAuthContext.Provider>
  );
}

export function useLocalAuth() {
  const ctx = useContext(LocalAuthContext);
  if (!ctx) throw new Error("useLocalAuth must be used within LocalAuthProvider");
  return ctx;
}
