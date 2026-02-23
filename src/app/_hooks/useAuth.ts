import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

type DbUser = {
  id: string;
  supabaseId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  githubUrl: string | null;
  role: "ADMIN" | "USER";
  bio: string | null;
};

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);

  // Supabase セッションが確立したら DB ユーザーを同期・取得する
  const syncUser = async (accessToken: string) => {
    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { Authorization: accessToken },
      });
      if (res.ok) {
        const user: DbUser = await res.json();
        setDbUser(user);
      }
    } catch (e) {
      console.error("User sync failed:", e);
    }
  };

  useEffect(() => {
    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setToken(session?.access_token || null);
        if (session?.access_token) {
          await syncUser(session.access_token);
        } else {
          setDbUser(null);
        }
        setIsLoading(false);
      },
    );

    // 初期セッションの取得
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setToken(session?.access_token || null);
        if (session?.access_token) {
          await syncUser(session.access_token);
        }
      } catch (error) {
        console.error(
          `セッションの取得に失敗しました。\n${error instanceof Error ? error.message : JSON.stringify(error, null, 2)}`,
        );
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // アンマウント時に監視を解除
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  return { isLoading, session, token, dbUser };
};
