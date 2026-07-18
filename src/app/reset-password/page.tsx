"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

const isStrongPassword = (password: string) =>
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password);

const Page = () => {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const establishRecoverySession = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError("再設定リンクが無効か、有効期限が切れています");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("再設定セッションを確認できません。メールから開き直してください");
        return;
      }

      setIsReady(true);
    };

    establishRecoverySession();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!isStrongPassword(password)) {
      setError("12文字以上で、英大文字・英小文字・数字を含めてください");
      return;
    }

    if (password !== confirmation) {
      setError("確認用パスワードが一致しません");
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(`パスワード更新に失敗しました: ${updateError.message}`);
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-black text-slate-900">
            パスワードを再設定
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            12文字以上で、英大文字・英小文字・数字を含めてください。
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="新しいパスワード"
          required
          disabled={!isReady}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <input
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="new-password"
          placeholder="新しいパスワード（確認）"
          required
          disabled={!isReady}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={!isReady || isSubmitting}
          className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {isSubmitting ? "更新中..." : "パスワードを更新"}
        </button>
      </form>
    </main>
  );
};

export default Page;
