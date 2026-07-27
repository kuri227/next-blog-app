"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/_hooks/useAuth";

type Stats = {
  users: number;
  posts: number;
  publishedPosts: number;
  comments: number;
  categories: number;
};

const Page = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((response) => response.ok ? response.json() : null)
      .then(setStats);
  }, [token]);

  const cards = stats
    ? [
        ["ユーザー", stats.users],
        ["投稿", stats.posts],
        ["公開中", stats.publishedPosts],
        ["コメント", stats.comments],
        ["カテゴリー", stats.categories],
      ]
    : [];

  return (
    <main className="space-y-8 pb-20">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Admin Console</p>
        <h1 className="mt-2 text-3xl font-black">管理ダッシュボード</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["/admin/posts", "投稿管理", "全ユーザーの投稿を編集・削除します"],
          ["/admin/categories", "カテゴリー管理", "投稿カテゴリーを追加・編集します"],
          ["/admin/users", "ユーザー管理", "ユーザー一覧と管理者権限を管理します"],
          ["/admin/comments", "コメント管理", "不適切なコメントを確認・削除します"],
        ].map(([href, title, description]) => (
          <Link key={href} href={href} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="font-black">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default Page;
