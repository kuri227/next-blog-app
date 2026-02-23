"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faKey, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import ValidationAlert from "../_components/ValidationAlert";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

const Page: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loginError, setLoginError] = useState("");

  const router = useRouter();

  const updateEmailField = (value: string) => {
    setEmail(value);
    if (value.length > 0 && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError("メールアドレスの形式で入力してください。");
      return;
    }
    setEmailError("");
  };

  // GitHub OAuth でログイン
  const handleGitHubLogin = async () => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setLoginError(`GitHub ログインに失敗しました（${error.message}）`);
      setIsSubmitting(false);
    }
    // 成功時はブラウザが GitHub → Supabase → /auth/callback へリダイレクトする
  };

  // メール/パスワードでログイン（管理者用）
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setLoginError(
          `ログインIDまたはパスワードが違います（${error.code}）。`,
        );
        return;
      }
      router.replace("/admin");
    } catch (error) {
      setLoginError("ログイン処理中に予期せぬエラーが発生しました。");
      console.error(JSON.stringify(error, null, 2));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-8 text-2xl font-black tracking-tight text-slate-800">
          ログイン
        </h1>

        <ValidationAlert msg={loginError} />

        {/* GitHub OAuth ボタン */}
        <button
          onClick={handleGitHubLogin}
          disabled={isSubmitting}
          className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 py-3 font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xl" />
          GitHub でログイン
        </button>

        <div className="mb-6 flex items-center gap-4">
          <hr className="flex-1 border-slate-200" />
          <span className="text-xs font-bold text-slate-400">または</span>
          <hr className="flex-1 border-slate-200" />
        </div>

        {/* メール/パスワード（管理者用） */}
        <form
          onSubmit={handleSubmit}
          className={twMerge("space-y-4", isSubmitting && "opacity-50")}
        >
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-bold text-slate-700">
              <FontAwesomeIcon icon={faEnvelope} className="mr-1" />
              メールアドレス
            </label>
            <input
              type="text"
              id="email"
              name="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => updateEmailField(e.target.value)}
              required
            />
            <ValidationAlert msg={emailError} />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-bold text-slate-700">
              <FontAwesomeIcon icon={faKey} className="mr-1" />
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={twMerge(
              "w-full rounded-xl py-2.5 font-bold text-sm",
              "bg-indigo-600 text-white hover:bg-indigo-700",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            disabled={
              isSubmitting ||
              emailError !== "" ||
              email.length === 0 ||
              password.length === 0
            }
          >
            ログイン（管理者）
          </button>
        </form>
      </div>
    </main>
  );
};

export default Page;
