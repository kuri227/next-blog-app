"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

// GitHub OAuth ログイン後にここへリダイレクトされる
// セッションを確立して / にリダイレクトする
const Page: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("OAuth callback error:", error);
        router.replace("/login");
        return;
      }
      if (data.session) {
        // useAuth 内で syncUser が呼ばれるので、ここでは / に飛ばすだけ
        router.replace("/");
      } else {
        router.replace("/login");
      }
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
