"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faHeart, faBookmark } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

const bucketName = "cover-image";

type BookmarkedPost = {
  id: string;
  title: string;
  postType: "PROJECT" | "KNOWLEDGE";
  coverImageKey: string | null;
  createdAt: string;
  author: { name: string | null; avatarUrl: string | null };
  _count: { likes: number };
};

// ブックマーク一覧 (bookmarked post を User テーブル経由で取得する仮実装)
// 本来は /api/bookmarks など専用APIを作るが、ここでは posts を全件取得してフィルタする
const Page: React.FC = () => {
  const { token, dbUser } = useAuth();
  const [posts, setPosts] = useState<BookmarkedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!dbUser) { setIsLoading(false); return; }
    // TODO: 専用 /api/bookmarks API を作成して最適化する
    // 現在は全投稿を取得してブックマーク状態をクライアントで管理する暫定実装
    fetch("/api/posts", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { setPosts(data); setIsLoading(false); });
  }, [dbUser]);

  if (!dbUser && !isLoading) {
    return (
      <main className="py-20 text-center">
        <p className="text-slate-500">
          ブックマークを見るには
          <Link href="/login" className="mx-1 font-bold text-indigo-600 underline">ログイン</Link>
          してください。
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl pb-20">
      <h1 className="mb-8 text-3xl font-black tracking-tight text-slate-800">ブックマーク</h1>
      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-300">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
          <FontAwesomeIcon icon={faBookmark} className="text-5xl" />
          <p className="font-bold">ブックマークした投稿はありません</p>
          <Link href="/feed" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
            フィードを見る
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const coverUrl = post.coverImageKey
              ? supabase.storage.from(bucketName).getPublicUrl(post.coverImageKey).data.publicUrl
              : null;
            return (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:shadow-sm"
              >
                {coverUrl ? (
                  <img src={coverUrl} alt="" className="h-16 w-24 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                    {post.postType === "PROJECT" ? "🛠️" : "📚"}
                  </div>
                )}
                <div className="flex-1">
                  <span className={twMerge(
                    "mb-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase",
                    post.postType === "PROJECT" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700",
                  )}>
                    {post.postType === "PROJECT" ? "作品" : "知見"}
                  </span>
                  <p className="font-bold text-slate-800 line-clamp-1">{post.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {post.author.name} · {dayjs(post.createdAt).format("MM/DD")}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <FontAwesomeIcon icon={faHeart} />{post._count.likes}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default Page;
