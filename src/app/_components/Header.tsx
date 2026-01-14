"use client";
import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faHouse,
  faUser,
  faGear,
  faTableList,
  faTags,
  faFish,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // メニューを閉じる関数
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* 1. トップバー：常に上部に表示される最小限のバー */}
      <header className="fixed top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* ロゴ */}
          <Link
            href="/"
            className="group flex items-center gap-2 text-xl font-black text-slate-900 transition-colors hover:text-indigo-600"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200 transition-transform group-hover:rotate-12">
              <FontAwesomeIcon icon={faFish} />
            </div>
            <span>Tech Insights</span>
          </Link>

          {/* ハンバーガーボタン */}
          <button
            onClick={toggleMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-95"
            aria-label="メニューを開く"
          >
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
        </div>
      </header>

      {/* 2. 背景オーバーレイ：メニューが開いている時に背景を暗くする */}
      <div
        className={twMerge(
          "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={toggleMenu}
      />

      {/* 3. サイドドロワーメニュー：左からスライドしてくる */}
      <aside
        className={twMerge(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-white p-6 shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* メニュー上部：閉じるボタン */}
          <div className="mb-10 flex items-center justify-between">
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
              Menu
            </span>
            <button
              onClick={toggleMenu}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* メインナビゲーション */}
          <nav className="flex-1 space-y-2">
            <Link
              href="/"
              onClick={toggleMenu}
              className="group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-indigo-50 hover:text-indigo-600"
            >
              <FontAwesomeIcon
                icon={faHouse}
                className="w-5 text-slate-400 group-hover:text-indigo-500"
              />
              ホーム
            </Link>
            <Link
              href="/about"
              onClick={toggleMenu}
              className="group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-indigo-50 hover:text-indigo-600"
            >
              <FontAwesomeIcon
                icon={faUser}
                className="w-5 text-slate-400 group-hover:text-indigo-500"
              />
              About
            </Link>
          </nav>

          {/* 管理画面用セクション：ロマン枠 */}
          <div className="mt-auto border-t border-slate-100 pt-6">
            <h3 className="mb-4 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Admin Console
            </h3>
            <div className="space-y-1">
              <Link
                href="/admin/posts"
                onClick={toggleMenu}
                className="group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-900 hover:text-white"
              >
                <FontAwesomeIcon
                  icon={faTableList}
                  className="w-5 text-slate-400 group-hover:text-indigo-400"
                />
                記事管理
              </Link>
              <Link
                href="/admin/categories"
                onClick={toggleMenu}
                className="group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-900 hover:text-white"
              >
                <FontAwesomeIcon
                  icon={faTags}
                  className="w-5 text-slate-400 group-hover:text-indigo-400"
                />
                カテゴリ管理
              </Link>
              <div className="px-4 pt-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[10px] leading-relaxed text-slate-400">
                  <FontAwesomeIcon
                    icon={faGear}
                    className="animate-spin-slow mr-1"
                  />
                  Administrator Mode Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Header;
