"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/_hooks/useAuth";

type Post = {
  id: string;
  title: string;
  published: boolean;
  updatedAt: string;
  _count: { likes: number; comments: number };
};

const Page = () => {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const response = await fetch("/api/posts/mine", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.ok) setPosts(await response.json());
  }, [token]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!authLoading && !token) router.replace("/login");
  }, [authLoading, router, token]);

  const remove = async (post: Post) => {
    if (!token || !window.confirm(`「${post.title}」を削除しますか？`)) return;
    const response = await fetch(`/api/posts/${post.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) setPosts((items) => items.filter((item) => item.id !== post.id));
  };

  if (authLoading || !token) {
    return <main className="py-24 text-center text-slate-400">認証情報を確認しています...</main>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">自分の投稿</h1>
        <Link href="/posts/new" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
          新しい投稿
        </Link>
      </div>
      <div className="space-y-3">
        {posts.map((post) => (
          <article key={post.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${post.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {post.published ? "公開中" : "下書き"}
                </span>
                <span className="text-xs text-slate-400">いいね {post._count.likes} / コメント {post._count.comments}</span>
              </div>
              <p className="mt-2 truncate font-black">{post.title}</p>
            </div>
            <div className="flex gap-2">
              {post.published && <Link href={`/posts/${post.id}`} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">表示</Link>}
              <Link href={`/posts/${post.id}/edit`} className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-bold text-indigo-600">編集</Link>
              <button onClick={() => void remove(post)} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-600">削除</button>
            </div>
          </article>
        ))}
        {posts.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">まだ投稿がありません。</p>}
      </div>
    </main>
  );
};

export default Page;
