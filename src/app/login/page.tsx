"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/utils/supabase";

type LoginMode = "user" | "admin";

const Page = () => {
  const [loadingMode, setLoadingMode] = useState<LoginMode | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("error");
    if (reason === "admin_required") {
      setError("このGitHubアカウントには管理者権限がありません。");
    } else if (reason) {
      setError("GitHubログインを完了できませんでした。もう一度お試しください。");
    }
  }, []);

  const handleGitHubLogin = async (mode: LoginMode) => {
    setLoadingMode(mode);
    setError("");
    localStorage.setItem("techfeed:login-mode", mode);

    const redirectOrigin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (window.location.hostname.endsWith(".vercel.app")
        ? "https://next-blog-app-drab.vercel.app"
        : window.location.origin);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${redirectOrigin}/auth/callback`,
        scopes: "read:user user:email",
      },
    });

    if (oauthError) {
      localStorage.removeItem("techfeed:login-mode");
      setError(oauthError.message);
      setLoadingMode(null);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white shadow-lg">
            TF
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            TechFeedにログイン
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            認証方法はGitHubのみです。パスワードは保存しません。
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => handleGitHubLogin("user")}
          disabled={loadingMode !== null}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white shadow-lg transition hover:bg-slate-700 disabled:opacity-60"
        >
          {loadingMode === "user" ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          ) : (
            <GitHubIcon />
          )}
          GitHubでログイン
        </button>

        <button
          type="button"
          onClick={() => handleGitHubLogin("admin")}
          disabled={loadingMode !== null}
          className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-amber-500 bg-amber-50 px-6 py-3.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
        >
          {loadingMode === "admin" ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faShieldHalved} />
          )}
          管理者モードを体験
        </button>

        <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
          あなたの管理者アカウントは本番管理画面へ、一般アカウントは安全なデモ管理画面へ移動します。
        </p>

        <div className="mt-5 rounded-xl bg-indigo-50 px-4 py-3 text-center text-xs leading-relaxed text-indigo-700">
          デモでは投稿・カテゴリー・ユーザー権限・コメント管理を実際に操作できます。
        </div>
      </div>
    </main>
  );
};

const GitHubIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.8c1.02 0 2.05.14 3 .4 2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.3c0 .32.19.69.8.57A12 12 0 0 0 12 0Z" />
  </svg>
);

export default Page;
