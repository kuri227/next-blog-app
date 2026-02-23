"use client";
import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

const Page: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setIsAdminLoading(false);
    } else {
      router.replace("/");
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl shadow-lg">
            ⚡
          </div>
          <h1 className="text-2xl font-black text-slate-900">TechFeed にログイン</h1>
          <p className="mt-2 text-sm text-slate-500">GitHub アカウントで続ける</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* GitHub ログイン */}
        <button
          onClick={handleGitHubLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-slate-700 disabled:opacity-60"
        >
          {isLoading ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          )}
          GitHub でログインする
        </button>

        {/* 管理者ログイン（折りたたみ） */}
        <div className="mt-6">
          <button
            onClick={() => setShowAdminForm(!showAdminForm)}
            className="flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
          >
            管理者としてログイン
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-[10px] transition-transform ${showAdminForm ? "rotate-180" : ""}`}
            />
          </button>

          {showAdminForm && (
            <form onSubmit={handleAdminLogin} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isAdminLoading}
                className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {isAdminLoading
                  ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  : "管理者としてログイン"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          ログインすることで
          <a href="#" className="underline">利用規約</a>及び
          <a href="#" className="underline">プライバシーポリシー</a>に同意したものとみなします。
        </p>
      </div>
    </main>
  );
};

export default Page;
