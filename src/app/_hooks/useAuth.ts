import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setToken(session?.access_token || null);
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
      } catch (error) {
        console.error(
          `セッションの取得に失敗しました。\n${error instanceof Error ? error.message : JSON.stringify(error, null, 2)}`,
        );
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // アンマウント時に監視を解除（クリーンアップ）
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  return { isLoading, session, token };
};
