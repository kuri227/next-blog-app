"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/utils/supabase";
import { writeAdminExperience } from "@/lib/admin-experience";

type SyncedUser = {
  role: "ADMIN" | "DEMO_ADMIN" | "USER";
  isOnboardingComplete: boolean;
};

const Page = () => {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const handleCallback = async () => {
      const mode = localStorage.getItem("techfeed:login-mode") ?? "user";
      localStorage.removeItem("techfeed:login-mode");
      const code = new URLSearchParams(window.location.search).get("code");

      if (!code) {
        router.replace("/login?error=oauth_callback");
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        console.error("OAuth callback error:", error?.message);
        router.replace("/login?error=oauth_callback");
        return;
      }

      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!response.ok) {
        await supabase.auth.signOut();
        router.replace("/login?error=user_sync");
        return;
      }

      const user: SyncedUser = await response.json();
      if (mode === "admin") {
        writeAdminExperience(user.role === "ADMIN" ? "admin" : "demo");
        router.replace(user.role === "ADMIN" ? "/admin" : "/admin-demo");
        return;
      }

      writeAdminExperience(null);
      router.replace(user.isOnboardingComplete ? "/feed" : "/onboarding");
    };

    void handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
        <span className="font-medium">GitHub認証を確認しています...</span>
      </div>
    </div>
  );
};

export default Page;
