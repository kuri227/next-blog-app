"use client";
import {
  useState, useEffect, useOptimistic, useTransition, useRef, useCallback,
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faCalendarDays, faTags, faChevronLeft, faHeart,
  faBookmark, faUser, faArrowUpRightFromSquare, faShare,
  faCopy, faCheck, faListUl,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

const bucketName = "cover-image";

// ── 型定義 ─────────────────────────────────────────────────────
type Post = {
  id: string; title: string; content: string;
  postType: "PROJECT" | "KNOWLEDGE";
  coverImageKey: string | null;
  repoUrl: string | null; demoUrl: string | null;
  published: boolean; createdAt: string;
  author: { id: string; name: string | null; avatarUrl: string | null; githubUrl: string | null };
  categories: { category: { id: string; name: string } }[];
  _count: { likes: number; comments: number };
};
type Comment = {
  id: string; content: string; createdAt: string;
  author: { id: string; name: string | null; avatarUrl: string | null };
};
type TocItem = { id: string; text: string; level: number };

// ── TOC 抽出 ────────────────────────────────────────────────────
const extractToc = (md: string): TocItem[] => {
  const lines = md.split("\n");
  const items: TocItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,3})\s+(.+)/);
    if (m) {
      const level = m[1].length;
      const text = m[2].trim();
      // インデックスを付加して ID の重複を防止
      const base = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      const id = `${base}-${items.length}`;
      items.push({ id, text, level });
    }
  }
  return items;
};

// ── アドモニション変換 ─────────────────────────────────────────
const parseAdmonition = (text: string): { type: string; title: string; body: string } | null => {
  const m = text.match(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n?([\s\S]*)/i);
  if (!m) return null;
  const typeMap: Record<string, string> = {
    NOTE: "ℹ️", TIP: "💡", IMPORTANT: "📌", WARNING: "⚠️", CAUTION: "🔥",
  };
  return { type: m[1].toLowerCase(), title: typeMap[m[1].toUpperCase()] + " " + m[1], body: m[2] };
};

// ── Mermaid ダイナミックコンポーネント ─────────────────────────
const MermaidChart: React.ComponentType<{ code: string }> = dynamic(
  () => import("../../_components/MermaidChart") as Promise<{ default: React.ComponentType<{ code: string }> }>,
  { ssr: false, loading: () => <div className="animate-pulse h-32 rounded-xl bg-slate-100" /> },
);

// ── コードコンポーネント（コピーボタン付き） ──────────────────
const CodeBlock = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  const [copied, setCopied] = useState(false);
  const code = String(children ?? "").trimEnd();
  const lang = (className ?? "").replace("language-", "");

  if (lang === "mermaid") return <MermaidChart code={code} />;

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="code-block-wrapper group">
      <button
        onClick={copy}
        className={`code-copy-btn ${copied ? "copied" : ""}`}
        aria-label="コードをコピー"
      >
        <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="mr-1" />
        {copied ? "Copied!" : "Copy"}
      </button>
      <code className={className}>{children}</code>
    </div>
  );
};

// ── カスタム blockquote（アドモニション対応） ─────────────────
const CustomBlockquote = ({ children }: { children?: React.ReactNode }) => {
  const raw = String(children ?? "");
  const adm = parseAdmonition(raw);
  if (adm) {
    return (
      <div className={`admonition adm-${adm.type}`}>
        <span className="admonition-icon">{adm.title.split(" ")[0]}</span>
        <div className="admonition-content">
          <strong>{adm.title.replace(/^\S+\s/, "")}</strong>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{adm.body}</ReactMarkdown>
        </div>
      </div>
    );
  }
  return <blockquote>{children}</blockquote>;
};

// ── メインページ ──────────────────────────────────────────────
const Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { dbUser, token } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const articleRef = useRef<HTMLDivElement>(null);

  const [optimisticLikeCount, updateLikes] = useOptimistic(
    post?._count.likes ?? 0,
    (state: number, delta: number) => state + delta,
  );

  // ── 投稿・コメント取得 ────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/posts/${id}`).then((r) => r.json()),
      fetch(`/api/posts/${id}/comments`).then((r) => r.json()),
    ]).then(([p, c]) => {
      setPost(p);
      setComments(c);
      setToc(extractToc(p.content));
      setIsLoading(false);
    });
  }, [id]);

  // ── 読了プログレスバー ────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const winH = window.innerHeight;
      const scrolled = -top;
      const total = height - winH;
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── 読了目安時間 ──────────────────────────────────────────────
  const readingMin = post ? Math.max(1, Math.ceil(post.content.length / 500)) : 0;

  // ── カバー画像URL ─────────────────────────────────────────────
  const coverImageUrl = post?.coverImageKey
    ? supabase.storage.from(bucketName).getPublicUrl(post.coverImageKey).data.publicUrl
    : null;

  // ── いいね ─────────────────────────────────────────────────────
  const handleLike = useCallback(() => {
    if (!token || !post) return;
    startTransition(async () => {
      updateLikes(liked ? -1 : 1);
      setLiked((v) => !v);
      try {
        const res = await fetch(`/api/posts/${post.id}/like`, {
          method: liked ? "DELETE" : "POST",
          headers: { Authorization: token },
        });
        if (res.ok) {
          const data = await res.json();
          // サーバーからの最新のカウントでベースステートを更新
          setPost((prev) =>
            prev ? { ...prev, _count: { ...prev._count, likes: data.count } } : null,
          );
        } else {
          // エラー時はロールバック
          setLiked((v) => !v);
        }
      } catch (e) {
        setLiked((v) => !v); // 通信エラー時もロールバック
      }
    });
  }, [token, post, liked, updateLikes, startTransition]);

  // ── ブックマーク ──────────────────────────────────────────────
  const handleBookmark = useCallback(async () => {
    if (!token || !post) return;
    setBookmarked((v) => !v);
    await fetch(`/api/posts/${post.id}/bookmark`, {
      method: bookmarked ? "DELETE" : "POST",
      headers: { Authorization: token },
    });
  }, [token, post, bookmarked]);

  // ── コメント投稿 ──────────────────────────────────────────────
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newComment.trim()) return;
    const res = await fetch(`/api/posts/${post!.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ content: newComment }),
    });
    if (res.ok) {
      const c: Comment = await res.json();
      setComments((prev) => [...prev, c]);
      setNewComment("");
    }
  };

  // ── シェア ─────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg("URLをコピーしました！");
      setTimeout(() => setShareMsg(""), 2000);
    }
  };

  // ── ローディング ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-slate-300" />
      </div>
    );
  }
  if (!post) return <div className="py-32 text-center text-slate-400">記事が見つかりません</div>;

  return (
    <>
      {/* 読了プログレスバー */}
      <div id="reading-progress" style={{ width: `${progress}%` }} />

      <div className="mx-auto flex max-w-screen-xl gap-8 py-8 lg:py-10">
        {/* ── メインコンテンツ ─────────────────────────────── */}
        <div className="min-w-0 flex-1" ref={articleRef}>
          <Link href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-base)]">
            <FontAwesomeIcon icon={faChevronLeft} /> 一覧へ
          </Link>

          <article className="space-y-6">
            {/* タイプバッジ */}
            <span className={twMerge(
              "inline-block rounded-full px-3 py-1 text-xs font-black tracking-widest uppercase",
              post.postType === "PROJECT"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
            )}>
              {post.postType === "PROJECT" ? "🛠️ 作品" : "📚 知見"}
            </span>

            <h1 className="text-3xl font-extrabold leading-tight text-[var(--text-base)] md:text-4xl">
              {post.title}
            </h1>

            {/* メタ情報 */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[var(--border)] pb-5 text-sm text-[var(--text-muted)]">
              <Link href={`/profile/${post.author.id}`} className="flex items-center gap-2 hover:text-[var(--text-base)]">
                {post.author.avatarUrl
                  ? <img src={post.author.avatarUrl} alt="" className="h-6 w-6 rounded-full" />
                  : <FontAwesomeIcon icon={faUser} />}
                <span className="font-bold">{post.author.name ?? "Unknown"}</span>
              </Link>
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCalendarDays} />
                <time>{dayjs(post.createdAt).format("YYYY年MM月DD日")}</time>
              </span>
              {/* 読了時間 */}
              <span className="flex items-center gap-1.5">
                🕐 約 {readingMin} 分
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <FontAwesomeIcon icon={faTags} className="text-slate-400" />
                {post.categories.map((c) => (
                  <span key={c.category.id}
                    className="rounded-md border border-[var(--border)] bg-slate-50 px-2 py-0.5 text-xs font-bold dark:bg-slate-800">
                    {c.category.name}
                  </span>
                ))}
              </div>
              {/* SP向けTOC開閉ボタン */}
              {toc.length > 0 && (
                <button onClick={() => setTocOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-bold text-[var(--text-muted)] hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden">
                  <FontAwesomeIcon icon={faListUl} /> 目次
                </button>
              )}
            </div>

            {/* SP向けTOC（折りたたみ） */}
            {tocOpen && toc.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-slate-50 p-4 dark:bg-slate-800 lg:hidden">
                <p className="mb-2 text-xs font-black uppercase text-[var(--text-muted)]">目次</p>
                <ul className="space-y-1">
                  {toc.map((item) => (
                    <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
                      <a href={`#${item.id}`} onClick={() => setTocOpen(false)}
                        className="block text-sm text-[var(--text-muted)] hover:text-indigo-500">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* カバー画像 */}
            {coverImageUrl && (
              <div className="overflow-hidden rounded-2xl shadow-sm">
                <img src={coverImageUrl} alt={post.title} className="h-auto w-full object-cover" />
              </div>
            )}

            {/* PROJECT リンク */}
            {post.postType === "PROJECT" && (post.repoUrl || post.demoUrl) && (
              <div className="flex flex-wrap gap-3 rounded-2xl border border-[var(--border)] bg-slate-50 p-4 dark:bg-slate-800">
                {post.repoUrl && (
                  <a href={post.repoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700">
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> GitHub
                  </a>
                )}
                {post.demoUrl && (
                  <a href={post.demoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-base)] hover:border-slate-400">
                    🔗 デモを見る
                  </a>
                )}
              </div>
            )}

            {/* 本文 */}
            <div className="prose prose-slate max-w-none leading-relaxed dark:prose-invert">
              <ReactMarkdown
                rehypePlugins={[rehypeHighlight, rehypeSlug]}
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ className, children, ...props }: any) => {
                    const isMatch = /language-(\w+)/.exec(className || "") || className?.includes("hljs");
                    const isBlock = isMatch || String(children).includes("\n");
                    if (isBlock) {
                      return <CodeBlock className={className}>{children}</CodeBlock>;
                    }
                    return (
                      <code className={twMerge("rounded bg-slate-100 px-1.5 py-0.5 text-sm font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200", className)} {...props}>
                        {children}
                      </code>
                    );
                  },
                  blockquote: ({ children }) => (
                    <CustomBlockquote>{children}</CustomBlockquote>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* シェア + いいね + ブックマーク */}
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
              <button onClick={handleShare}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-muted)] transition hover:border-indigo-300 hover:text-indigo-600">
                <FontAwesomeIcon icon={faShare} />
                {shareMsg || "シェア"}
              </button>
              <button onClick={handleLike} disabled={!dbUser || isPending}
                className={twMerge(
                  "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all",
                  liked
                    ? "border-red-300 bg-red-50 text-red-500 dark:bg-red-950"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-red-300 hover:text-red-500",
                  !dbUser && "cursor-default opacity-50",
                )}>
                <FontAwesomeIcon icon={faHeart} /> {optimisticLikeCount}
              </button>
              <button onClick={handleBookmark} disabled={!dbUser}
                className={twMerge(
                  "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all",
                  bookmarked
                    ? "border-indigo-300 bg-indigo-50 text-indigo-600 dark:bg-indigo-950"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-indigo-300 hover:text-indigo-600",
                  !dbUser && "cursor-default opacity-50",
                )}>
                <FontAwesomeIcon icon={faBookmark} />
                {bookmarked ? "保存済み" : "ブックマーク"}
              </button>
            </div>

            {/* コメント */}
            <section className="space-y-4">
              <h2 className="text-xl font-black text-[var(--text-base)]">
                コメント（{comments.length}件）
              </h2>
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  {c.author.avatarUrl
                    ? <img src={c.author.avatarUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-full" />
                    : <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                      <FontAwesomeIcon icon={faUser} className="text-xs text-slate-500" />
                    </div>}
                  <div>
                    <p className="text-xs font-black text-[var(--text-muted)]">
                      {c.author.name ?? "Unknown"}
                      <span className="ml-2 font-normal">{dayjs(c.createdAt).format("YYYY/MM/DD")}</span>
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-base)]">{c.content}</p>
                  </div>
                </div>
              ))}
              {dbUser ? (
                <form onSubmit={handleComment} className="flex gap-2">
                  <input
                    value={newComment} onChange={(e) => setNewComment(e.target.value)}
                    placeholder="コメントを書く..." required
                    className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <button type="submit"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">
                    送信
                  </button>
                </form>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">
                  <Link href="/login" className="text-indigo-500 underline">ログイン</Link>
                  してコメントを投稿する
                </p>
              )}
            </section>
          </article>
        </div>

        {/* ── TOC サイドバー（PC のみ） ──────────────────────── */}
        {toc.length > 0 && (
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="sticky top-20 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <p className="mb-3 text-xs font-black uppercase text-[var(--text-muted)]">目次</p>
              <ul className="space-y-1.5">
                {toc.map((item) => (
                  <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 10}px` }}>
                    <a href={`#${item.id}`}
                      className="block text-xs leading-snug text-[var(--text-muted)] hover:text-indigo-500">
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </>
  );
};

export default Page;
