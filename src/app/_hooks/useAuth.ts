import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";
import { useRouter, usePathname } from "next/navigation";

export type DbUser = {
  id: string;
  supabaseId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  githubUrl: string | null;
  role: "ADMIN" | "USER";
  bio: string | null;
  skills: string[];
  techInterests: string[];
  isOnboardingComplete: boolean;
};

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const syncUser = async (accessToken: string) => {
    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { Authorization: accessToken },
      });
      if (res.ok) {
        const data: DbUser & { isNewUser?: boolean } = await res.json();
        setDbUser(data);
        // 初回ログイン（オンボーディング未完了）の場合リダイレクト
        if (!data.isOnboardingComplete && pathname !== "/onboarding") {
          router.replace("/onboarding");
        }
      }
    } catch (e) {
      console.error("User sync failed:", e);
    }
  };

  useEffect(() => {
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

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setToken(session?.access_token || null);
        if (session?.access_token) {
          await syncUser(session.access_token);
        }
      } catch (error) {
        console.error(`セッション取得失敗: ${error instanceof Error ? error.message : error}`);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();
    return () => authListener?.subscription?.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { isLoading, session, token, dbUser, setDbUser };
};
