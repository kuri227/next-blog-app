"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

export type DbUser = {
  id: string;
  supabaseId: string;
  name: string | null;
  avatarUrl: string | null;
  githubUrl: string | null;
  role: "ADMIN" | "DEMO_ADMIN" | "USER";
  bio: string | null;
  skills: string[];
  techInterests: string[];
  isOnboardingComplete: boolean;
};

type AuthContextValue = {
  isLoading: boolean;
  session: Session | null;
  token: string | null;
  dbUser: DbUser | null;
  setDbUser: Dispatch<SetStateAction<DbUser | null>>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let lastAccessToken: string | null | undefined;

    const syncUser = async (accessToken: string) => {
      try {
        const response = await fetch("/api/auth/sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        if (response.ok) {
          setDbUser((await response.json()) as DbUser);
        } else {
          setDbUser(null);
          console.warn(`User sync failed with status ${response.status}`);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.warn("User sync failed", error);
      }
    };

    const applySession = async (nextSession: Session | null) => {
      const accessToken = nextSession?.access_token ?? null;
      setSession(nextSession);
      setToken(accessToken);

      if (!accessToken) {
        lastAccessToken = null;
        setDbUser(null);
        setIsLoading(false);
        return;
      }

      if (accessToken !== lastAccessToken) {
        lastAccessToken = accessToken;
        await syncUser(accessToken);
      }
      setIsLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        void applySession(nextSession);
      },
    );

    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        await applySession(data.session);
      } catch (error) {
        console.error(
          `セッション取得失敗: ${error instanceof Error ? error.message : error}`,
        );
      } finally {
        setIsLoading(false);
      }
    };

    void getInitialSession();
    return () => {
      authListener.subscription.unsubscribe();
      controller.abort();
    };
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { isLoading, session, token, dbUser, setDbUser } },
    children,
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
