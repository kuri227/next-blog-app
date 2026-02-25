"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faHeart, faComment, faUser } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

type FeedPost = {
  id: string;
  title: string;
  postType: "PROJECT" | "KNOWLEDGE";
  coverImageKey: string | null;
  createdAt: string;
  author: { id: string; name: string | null; avatarUrl: string | null };
  categories: { category: { id: string; name: string } }[];
  _count: { likes: number; comments: number };
};

type FeedTab = "latest" | "trending" | "following";

const bucketName = "cover-image";

const Page: React.FC = () => {
  const { dbUser, token } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<FeedTab>("latest");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        let url = "/api/posts";
        const headers: HeadersInit = {};

        if (tab === "following") {
          if (!token) {
            // トークンがない（未ログイン）場合は取得しない
            setPosts([]);
            setIsLoading(false);
            return;
          }
          url = "/api/feed/following";
          headers["Authorization"] = token;
        }

        const res = await fetch(url, { cache: "no-store", headers });
        if (res.ok) {
          const data: FeedPost[] = await res.json();

          if (tab === "trending") {
            data.sort((a, b) => b._count.likes - a._count.likes);
          }

          setPosts(data);
        } else {
          setPosts([]);
        }
      } catch {
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [tab, token]);

  const tabConfig: { key: FeedTab; label: string }[] = [
    { key: "latest", label: "🆕 新着" },
    { key: "trending", label: "🔥 トレンド" },
    { key: "following", label: "👥 フォロー中" },
  ];

  return (
    <main className="pb-20">
      <div className="mb-8 border-b border-slate-200 py-8 text-center">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Tech Feed
        </h1>
        <p className="mt-3 font-medium text-slate-500">
          エンジニアの作品と知見が集まる場所
        </p>
      </div>

      {/* タブ */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
        {tabConfig.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={twMerge(
              "flex-1 rounded-xl py-2 text-sm font-bold transition-all",
              tab === key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-300">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
        </div>
      ) : tab === "following" && !dbUser ? (
        <div className="py-20 text-center">
          <p className="text-5xl mb-4">🔒</p>
          <p className="text-lg font-black text-slate-700">ログインが必要です</p>
          <p className="mt-2 text-sm text-slate-500">フォロー中の投稿を見るには GitHub でログインしてください</p>
          <Link href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700">
            ログインする →
          </Link>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <p className="text-lg font-bold">まだ投稿がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const coverUrl = post.coverImageKey
              ? supabase.storage.from(bucketName).getPublicUrl(post.coverImageKey).data.publicUrl
              : null;
            return (
              <div
                key={post.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800"
              >
                {/* カバー画像 */}
                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-700">
                  {coverUrl ? (
                    <img src={coverUrl} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-500">
                      <span className="text-4xl">{post.postType === "PROJECT" ? "🛠️" : "📚"}</span>
                    </div>
                  )}
                  <span className={twMerge(
                    "absolute z-10 top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase",
                    post.postType === "PROJECT" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700",
                  )}>
                    {post.postType === "PROJECT" ? "作品" : "知見"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h2 className="line-clamp-2 font-black text-slate-800 group-hover:text-indigo-600 dark:text-slate-100">
                    <Link href={`/posts/${post.id}`} className="before:absolute before:inset-0">
                      {post.title}
                    </Link>
                  </h2>
                  <div className="relative z-10 flex flex-wrap gap-1">
                    {post.categories.map((c) => (
                      <span key={c.category.id} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                        {c.category.name}
                      </span>
                    ))}
                  </div>
                  <div className="relative z-10 mt-auto flex items-center justify-between">
                    <Link
                      href={`/profile/${post.author.id}`}
                      className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800"
                    >
                      {post.author.avatarUrl ? (
                        <img src={post.author.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
                      ) : (
                        <FontAwesomeIcon icon={faUser} className="text-slate-400" />
                      )}
                      {post.author.name ?? "Unknown"}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faHeart} />
                        {post._count.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faComment} />
                        {post._count.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default Page;
