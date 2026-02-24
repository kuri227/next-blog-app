"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";

/**
 * ローカル開発環境のみ表示されるバナー。
 * セッションが残っている場合に簡単にサインアウトできるようにする。
 */
export const DevBanner: React.FC = () => {
  const [isLocal, setIsLocal] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsLocal(
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }, []);

  if (!isLocal) return null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 shadow-lg dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
      <span>🛠️ DEV MODE</span>
      {session ? (
        <>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900 dark:text-green-300">
            ログイン中
          </span>
          <button
            onClick={handleSignOut}
            className="rounded-lg bg-amber-200 px-2.5 py-1 text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100"
          >
            サインアウト
          </button>
        </>
      ) : (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          未ログイン
        </span>
      )}
    </div>
  );
};
