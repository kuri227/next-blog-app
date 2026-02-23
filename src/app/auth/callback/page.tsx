"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

// GitHub OAuth (PKCE フロー) のコールバック処理
// Supabase は ?code=xxx を URL に渡してくるので exchangeCodeForSession で処理する
const Page: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("OAuth callback error:", error.message);
          router.replace("/login?error=" + encodeURIComponent(error.message));
          return;
        }
      }

      // セッション確立後 useAuth が syncUser → isOnboardingComplete チェックを行う
      router.replace("/");
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
        <span className="font-medium">ログイン処理中...</span>
      </div>
    </div>
  );
};

export default Page;
