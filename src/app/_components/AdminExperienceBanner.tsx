"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminExperience } from "@/lib/admin-experience";
import { useAuth } from "@/app/_hooks/useAuth";

export const AdminExperienceBanner = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { session, dbUser, isLoading } = useAuth();
  const { mode, setMode } = useAdminExperience();

  if (isLoading || !session || mode !== "demo") return null;

  const leaveDemo = () => {
    setMode(null);
    if (pathname.startsWith("/admin-demo")) router.replace("/feed");
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <div>
        <span className="font-black">管理者デモモード</span>
        <span className="ml-2 text-xs opacity-75">
          {dbUser?.name ?? "GitHubユーザー"}として、安全なデモ管理機能を体験中です。
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!pathname.startsWith("/admin-demo") && (
          <Link href="/admin-demo" className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-400">
            管理者デモに戻る
          </Link>
        )}
        <button type="button" onClick={leaveDemo} className="rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900">
          通常モードへ戻る
        </button>
      </div>
    </div>
  );
};
