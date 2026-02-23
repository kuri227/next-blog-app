"use client";
import { useState, useEffect, useOptimistic, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCalendarDays,
  faTags,
  faChevronLeft,
  faHeart,
  faBookmark,
  faUser,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

const bucketName = "cover-image";

type Post = {
  id: string;
  title: string;
  content: string;
  postType: "PROJECT" | "KNOWLEDGE";
  repoUrl: string | null;
  demoUrl: string | null;
  coverImageKey: string | null;
  createdAt: string;
  author: { id: string; name: string | null; avatarUrl: string | null; githubUrl: string | null };
  categories: { category: { id: string; name: string } }[];
  _count: { likes: number; comments: number };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; avatarUrl: string | null };
};

const Page: React.FC = () => {
  const { id } = useParams() as { id: string };
  const { token, dbUser } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // useOptimistic でいいね数を即時反映
  const [optimisticLikeCount, updateOptimisticLikes] = useOptimistic(
    post?._count.likes ?? 0,
    (state: number, delta: number) => state + delta,
  );

  const coverImageUrl = post?.coverImageKey
    ? supabase.storage.from(bucketName).getPublicUrl(post.coverImageKey).data.publicUrl
    : null;

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch(`/api/posts/${id}`),
          fetch(`/api/posts/${id}/comments`),
        ]);
        if (pRes.ok) setPost(await pRes.json());
        if (cRes.ok) setComments(await cRes.json());
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  // いいね状態を DB から確認（ログイン時のみ）
  // 簡易実装：_count.likes が変化したときだけ確認
  const handleLike = async () => {
    if (!token || !post) return;
    startTransition(async () => {
      const isLiked = liked;
      updateOptimisticLikes(isLiked ? -1 : 1);
      setLiked(!isLiked);
      const method = isLiked ? "DELETE" : "POST";
      await fetch(`/api/posts/${id}/like`, {
        method,
        headers: { Authorization: token },
      });
      // 最新のカウントを再取得
      const res = await fetch(`/api/posts/${id}`);
      if (res.ok) setPost(await res.json());
    });
  };

  const handleBookmark = async () => {
    if (!token) return;
    const method = bookmarked ? "DELETE" : "POST";
    setBookmarked(!bookmarked);
    await fetch(`/api/posts/${id}/bookmark`, {
      method,
      headers: { Authorization: token },
    });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newComment.trim()) return;
    setIsCommentSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-10 text-center text-red-500">
        投稿が見つかりませんでした。
        <Link href="/" className="ml-2 text-indigo-600 underline">一覧へ</Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20">
      {/* 戻るボタン */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"
      >
        <FontAwesomeIcon icon={faChevronLeft} /> 一覧へ
      </Link>

      <article className="space-y-6">
        {/* 投稿タイプバッジ */}
        <span className={twMerge(
          "inline-block rounded-full px-3 py-1 text-xs font-black tracking-widest uppercase",
          post.postType === "PROJECT"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-indigo-100 text-indigo-700",
        )}>
          {post.postType === "PROJECT" ? "作品" : "知見"}
        </span>

        <h1 className="text-3xl font-extrabold text-slate-800 md:text-4xl">{post.title}</h1>

        {/* メタ情報 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-200 pb-6 text-sm text-slate-500">
          {/* 著者 */}
          <Link href={`/profile/${post.author.id}`} className="flex items-center gap-2 hover:text-slate-800">
            {post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} alt="" className="h-6 w-6 rounded-full" />
            ) : (
              <FontAwesomeIcon icon={faUser} />
            )}
            <span className="font-bold">{post.author.name ?? "Unknown"}</span>
          </Link>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
            <time>{dayjs(post.createdAt).format("YYYY年MM月DD日")}</time>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FontAwesomeIcon icon={faTags} className="mr-1" />
            {post.categories.map((c) => (
              <span key={c.category.id} className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-bold">
                {c.category.name}
              </span>
            ))}
          </div>
        </div>

        {/* カバー画像 */}
        {coverImageUrl && (
          <div className="overflow-hidden rounded-2xl shadow-sm">
            <img src={coverImageUrl} alt={post.title} className="h-auto w-full object-cover" />
          </div>
        )}

        {/* PROJECT リンク */}
        {post.postType === "PROJECT" && (post.repoUrl || post.demoUrl) && (
          <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {post.repoUrl && (
              <a href={post.repoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700">
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> GitHub
              </a>
            )}
            {post.demoUrl && (
              <a href={post.demoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-500">
                🔗 デモを見る
              </a>
            )}
          </div>
        )}

        {/* 本文（Markdown） */}
        <div className="prose prose-slate max-w-none leading-relaxed">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* いいね・ブックマーク */}
        <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
          <button
            onClick={handleLike}
            disabled={!dbUser || isPending}
            className={twMerge(
              "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all",
              liked
                ? "border-red-300 bg-red-50 text-red-500"
                : "border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500",
              !dbUser && "cursor-default opacity-50",
            )}
          >
            <FontAwesomeIcon icon={faHeart} />
            {optimisticLikeCount}
          </button>
          <button
            onClick={handleBookmark}
            disabled={!dbUser}
            className={twMerge(
              "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all",
              bookmarked
                ? "border-indigo-300 bg-indigo-50 text-indigo-600"
                : "border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600",
              !dbUser && "cursor-default opacity-50",
            )}
          >
            <FontAwesomeIcon icon={faBookmark} />
            {bookmarked ? "保存済み" : "ブックマーク"}
          </button>
        </div>

        {/* コメント */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-800">
            コメント（{comments.length}件）
          </h2>

          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
              {c.author.avatarUrl ? (
                <img src={c.author.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                  <FontAwesomeIcon icon={faUser} className="text-sm text-slate-400" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-600">{c.author.name ?? "Unknown"}</p>
                <p className="mt-1 text-sm text-slate-700">{c.content}</p>
              </div>
            </div>
          ))}

          {dbUser ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを書く..."
                className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                rows={2}
              />
              <button
                type="submit"
                disabled={isCommentSubmitting || !newComment.trim()}
                className="self-end rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCommentSubmitting ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : "送信"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">
              コメントするには
              <Link href="/login" className="mx-1 font-bold text-indigo-600 underline">ログイン</Link>
              してください。
            </p>
          )}
        </section>
      </article>
    </main>
  );
};

export default Page;
