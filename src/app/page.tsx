"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faHeart, faComment, faArrowRight,
  faBolt, faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

const bucketName = "cover-image";

type FeedPost = {
  id: string;
  title: string;
  content: string;
  postType: "PROJECT" | "KNOWLEDGE";
  coverImageKey: string | null;
  createdAt: string;
  author: { id: string; name: string | null; avatarUrl: string | null };
  categories: { category: { id: string; name: string } }[];
  _count: { likes: number; comments: number };
};

const Page: React.FC = () => {
  const { session } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/posts", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: FeedPost[]) => { setPosts(data); setIsLoading(false); });
  }, []);

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.categories.some((c) => c.category.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <main className="pb-24">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative -mx-4 mb-12 overflow-hidden bg-slate-900 px-4 py-20 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {/* 背景グラデーション装飾 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-indigo-300">
            <FontAwesomeIcon icon={faBolt} className="text-[10px]" />
            エンジニアのための知識共有プラットフォーム
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
            Tech<span className="text-indigo-400">Feed</span>
          </h1>
          <p className="mt-4 text-base font-medium text-slate-400 sm:text-lg">
            作品・技術知見をシェアして、エンジニアとつながろう
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {session ? (
              <Link
                href="/admin/posts/new"
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500"
              >
                投稿する <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500"
              >
                GitHub で参加する <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            )}
            <Link
              href="/feed"
              className="rounded-2xl border border-white/20 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              フィードを見る →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 検索バー ──────────────────────────────────────── */}
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-slate-400" />
        <input
          type="text"
          placeholder="記事タイトル・カテゴリで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* ── 投稿一覧 ──────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-300">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <p className="text-xl font-bold">記事が見つかりません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => {
            const coverUrl = post.coverImageKey
              ? supabase.storage.from(bucketName).getPublicUrl(post.coverImageKey).data.publicUrl
              : null;
            return (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* サムネイル */}
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      {post.postType === "PROJECT" ? "🛠️" : "📚"}
                    </div>
                  )}
                  <span className={twMerge(
                    "absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                    post.postType === "PROJECT"
                      ? "bg-emerald-500/90 text-white"
                      : "bg-indigo-500/90 text-white",
                  )}>
                    {post.postType === "PROJECT" ? "作品" : "知見"}
                  </span>
                </div>

                {/* コンテンツ */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h2 className="line-clamp-2 font-black leading-snug text-slate-800 group-hover:text-indigo-600">
                    {post.title}
                  </h2>
                  {/* カテゴリ */}
                  <div className="flex flex-wrap gap-1">
                    {post.categories.slice(0, 3).map((c) => (
                      <span key={c.category.id}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        {c.category.name}
                      </span>
                    ))}
                  </div>
                  {/* フッター */}
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {post.author.avatarUrl ? (
                        <img src={post.author.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
                      ) : null}
                      <span className="font-bold">{post.author.name ?? "Unknown"}</span>
                      <span>·</span>
                      <span>{dayjs(post.createdAt).format("MM/DD")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faHeart} className="text-red-400" />
                        {post._count.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faComment} />
                        {post._count.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default Page;
