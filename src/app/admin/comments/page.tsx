"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/_hooks/useAuth";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null };
  post: { id: string; title: string };
};

const Page = () => {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const response = await fetch("/api/admin/comments", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.ok) setComments(await response.json());
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  const remove = async (id: string) => {
    if (!token || !window.confirm("このコメントを削除しますか？")) return;
    const response = await fetch(`/api/admin/comments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) setComments((items) => items.filter((item) => item.id !== id));
  };

  return (
    <main className="space-y-6 pb-20">
      <h1 className="text-3xl font-black">コメント管理</h1>
      <div className="space-y-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500">{comment.author.name ?? "名前未設定"}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{comment.content}</p>
                <Link href={`/posts/${comment.post.id}`} className="mt-3 block text-xs text-indigo-500 hover:underline">{comment.post.title}</Link>
              </div>
              <button onClick={() => void remove(comment.id)} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-600">削除</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
};

export default Page;
