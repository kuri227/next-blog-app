"use client";
import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars, faXmark, faHouse, faUser, faGear,
  faTableList, faTags, faRss, faBookmark, faPenToSquare,
  faMoon, faSun, faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";
import { useTheme } from "@/app/_components/ThemeProvider";
import { useRouter } from "next/navigation";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { isLoading, session, dbUser } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const logout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.replace("/");
  };
  const toggleMenu = () => setIsOpen((v) => !v);

  const navLinks = [
    { href: "/", icon: faHouse, label: "ホーム" },
    { href: "/feed", icon: faRss, label: "フィード" },
    ...(session ? [
      { href: "/bookmarks", icon: faBookmark, label: "ブックマーク" },
      { href: "/admin/posts/new", icon: faPenToSquare, label: "新規投稿" },
    ] : []),
  ];

  return (
    <>
      {/* ── トップバー ─────────────────────────────────── */}
      <header className="fixed top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* ロゴ */}
          <Link href="/"
            className="group flex items-center gap-2 text-lg font-black text-[var(--text-base)] transition-colors hover:text-indigo-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-300/40 transition-transform group-hover:rotate-12 dark:shadow-indigo-900/40">
              ⚡
            </div>
            <span>TechFeed</span>
          </Link>

          {/* 右側のアクションエリア */}
          <div className="flex items-center gap-2">
            {/* ダークモードトグル */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] transition hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="ダークモード切り替え"
            >
              <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="text-sm" />
            </button>

            {/* ユーザーアバター（ログイン時） */}
            {!isLoading && session && dbUser && (
              <button
                onClick={toggleMenu}
                className="h-9 w-9 overflow-hidden rounded-full border-2 border-indigo-500 shadow-sm transition hover:ring-2 hover:ring-indigo-400"
                aria-label="マイメニュー"
              >
                {dbUser.avatarUrl ? (
                  <img src={dbUser.avatarUrl} alt={dbUser.name ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-600">
                    <FontAwesomeIcon icon={faUser} className="text-xs" />
                  </div>
                )}
              </button>
            )}

            {/* ハンバーガー */}
            <button
              onClick={toggleMenu}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] transition hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="メニューを開く"
            >
              <FontAwesomeIcon icon={isOpen ? faXmark : faBars} className="text-sm" />
            </button>
          </div>
        </div>
      </header>

      {/* ── オーバーレイ ──────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={toggleMenu}
        />
      )}

      {/* ── ドロワーメニュー ──────────────────────────── */}
      <aside className={twMerge(
        "fixed top-0 right-0 z-50 flex h-full w-72 flex-col border-l border-[var(--border)] bg-[var(--bg-card)] shadow-2xl transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}>
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {/* ドロワーヘッダー */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest">Menu</span>
            <button onClick={toggleMenu} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-800">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* ユーザープロフィールエリア */}
          {!isLoading && session && dbUser && (
            <Link href={`/profile/${dbUser.id}`} onClick={toggleMenu}
              className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-slate-50 p-4 transition hover:border-indigo-300 dark:bg-slate-800">
              {dbUser.avatarUrl ? (
                <img src={dbUser.avatarUrl} alt="" className="h-10 w-10 rounded-full border-2 border-indigo-400" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <FontAwesomeIcon icon={faUser} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-black text-[var(--text-base)]">
                  {dbUser.name ?? "ユーザー"}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">{dbUser.email}</p>
              </div>
            </Link>
          )}

          {/* ナビゲーション */}
          <nav className="flex-1 space-y-1">
            {navLinks.map(({ href, icon, label }) => (
              <Link key={href} href={href} onClick={toggleMenu}
                className="group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-muted)] transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950">
                <FontAwesomeIcon icon={icon} className="w-5 text-slate-400 group-hover:text-indigo-500" />
                {label}
              </Link>
            ))}

            {/* ログイン・ログアウト */}
            {!isLoading && (
              session ? (
                <button onClick={logout}
                  className="group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-950">
                  <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-5" />
                  ログアウト
                </button>
              ) : (
                <Link href="/login" onClick={toggleMenu}
                  className="group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950">
                  <FontAwesomeIcon icon={faUser} className="w-5" />
                  ログイン
                </Link>
              )
            )}
          </nav>

          {/* Admin Console（ADMIN のみ） */}
          {dbUser?.role === "ADMIN" && (
            <div className="mt-6 border-t border-[var(--border)] pt-6">
              <h3 className="mb-3 px-4 text-[10px] font-black tracking-widest text-[var(--text-muted)] uppercase">
                Admin Console
              </h3>
              <div className="space-y-1">
                <Link href="/admin/posts" onClick={toggleMenu}
                  className="group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-muted)] transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700">
                  <FontAwesomeIcon icon={faTableList} className="w-5 text-slate-400 group-hover:text-indigo-400" />
                  記事管理
                </Link>
                <Link href="/admin/categories" onClick={toggleMenu}
                  className="group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-muted)] transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700">
                  <FontAwesomeIcon icon={faTags} className="w-5 text-slate-400 group-hover:text-indigo-400" />
                  カテゴリ管理
                </Link>
                <div className="px-4 pt-3">
                  <div className="rounded-xl border border-[var(--border)] bg-slate-50 p-3 text-[10px] text-[var(--text-muted)] dark:bg-slate-800">
                    <FontAwesomeIcon icon={faGear} className="animate-spin-slow mr-1" />
                    Administrator Mode Active
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Header;
