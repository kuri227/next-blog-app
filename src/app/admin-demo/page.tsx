"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_hooks/useAuth";

type DemoPost = {
  id: string;
  title: string;
  published: boolean;
  author: string;
};
type DemoCategory = { id: string; name: string };
type DemoUser = { id: string; name: string; role: "ADMIN" | "USER"; posts: number };
type DemoComment = { id: string; author: string; content: string; postTitle: string };
type DemoState = {
  posts: DemoPost[];
  categories: DemoCategory[];
  users: DemoUser[];
  comments: DemoComment[];
};
type Tab = "dashboard" | "posts" | "categories" | "users" | "comments";

const STORAGE_KEY = "techfeed:interactive-admin-demo:v1";

const initialState: DemoState = {
  posts: [
    { id: "demo-post-1", title: "Next.jsで作る技術SNS", published: true, author: "Kuri227" },
    { id: "demo-post-2", title: "TypeScript設計の実践メモ", published: false, author: "Demo User" },
  ],
  categories: [
    { id: "demo-category-1", name: "Next.js" },
    { id: "demo-category-2", name: "TypeScript" },
    { id: "demo-category-3", name: "UI / UX" },
  ],
  users: [
    { id: "demo-user-1", name: "Kuri227", role: "ADMIN", posts: 5 },
    { id: "demo-user-2", name: "Demo User", role: "USER", posts: 2 },
  ],
  comments: [
    { id: "demo-comment-1", author: "Demo User", content: "とても参考になりました！", postTitle: "Next.jsで作る技術SNS" },
  ],
};

const Page = () => {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [state, setState] = useState<DemoState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) router.replace("/login");
  }, [authLoading, router, session]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved) as DemoState);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const stats = useMemo(
    () => ({
      posts: state.posts.length,
      published: state.posts.filter((post) => post.published).length,
      categories: state.categories.length,
      users: state.users.length,
      comments: state.comments.length,
    }),
    [state],
  );

  const addPost = () => {
    const title = window.prompt("新しい投稿のタイトルを入力してください");
    if (!title?.trim()) return;
    setState((current) => ({
      ...current,
      posts: [
        {
          id: crypto.randomUUID(),
          title: title.trim().slice(0, 120),
          published: false,
          author: "Demo Administrator",
        },
        ...current.posts,
      ],
    }));
  };

  const editPost = (post: DemoPost) => {
    const title = window.prompt("投稿タイトルを編集", post.title);
    if (!title?.trim()) return;
    setState((current) => ({
      ...current,
      posts: current.posts.map((item) =>
        item.id === post.id ? { ...item, title: title.trim().slice(0, 120) } : item,
      ),
    }));
  };

  const removePost = (post: DemoPost) => {
    if (!window.confirm(`「${post.title}」を削除しますか？`)) return;
    setState((current) => ({
      ...current,
      posts: current.posts.filter((item) => item.id !== post.id),
    }));
  };

  const addCategory = () => {
    const name = window.prompt("カテゴリー名を入力してください");
    if (!name?.trim()) return;
    setState((current) => ({
      ...current,
      categories: [
        ...current.categories,
        { id: crypto.randomUUID(), name: name.trim().slice(0, 50) },
      ],
    }));
  };

  const resetDemo = () => {
    if (!window.confirm("デモデータを初期状態に戻しますか？")) return;
    setState(initialState);
  };

  if (authLoading || !session || !ready) {
    return <div className="py-24 text-center text-slate-400">管理者デモを準備しています...</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "ダッシュボード" },
    { key: "posts", label: "投稿管理" },
    { key: "categories", label: "カテゴリー" },
    { key: "users", label: "ユーザー" },
    { key: "comments", label: "コメント" },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-20">
      <section className="rounded-3xl bg-slate-900 p-7 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-900">
              INTERACTIVE ADMIN DEMO
            </span>
            <h1 className="mt-4 text-3xl font-black">管理者モード体験</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              投稿・カテゴリー・ユーザー権限・コメント管理を自由に操作できます。
              変更はこのブラウザ内だけに保存され、本番データには影響しません。
            </p>
          </div>
          <button
            type="button"
            onClick={resetDemo}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10"
          >
            デモを初期化
          </button>
        </div>
      </section>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${
              tab === key ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "dashboard" && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["投稿", stats.posts],
            ["公開中", stats.published],
            ["カテゴリー", stats.categories],
            ["ユーザー", stats.users],
            ["コメント", stats.comments],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-black text-slate-400">{label}</p>
              <p className="mt-2 text-4xl font-black">{value}</p>
            </div>
          ))}
        </section>
      )}

      {tab === "posts" && (
        <DemoPanel title="投稿管理" actionLabel="新規投稿" onAction={addPost}>
          {state.posts.map((post) => (
            <DemoRow key={post.id}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${post.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {post.published ? "公開中" : "下書き"}
                  </span>
                  <span className="text-xs text-slate-400">{post.author}</span>
                </div>
                <p className="mt-2 truncate font-bold">{post.title}</p>
              </div>
              <button onClick={() => setState((current) => ({ ...current, posts: current.posts.map((item) => item.id === post.id ? { ...item, published: !item.published } : item) }))} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">
                {post.published ? "非公開" : "公開"}
              </button>
              <button onClick={() => editPost(post)} className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-bold text-indigo-600">編集</button>
              <button onClick={() => removePost(post)} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-600">削除</button>
            </DemoRow>
          ))}
        </DemoPanel>
      )}

      {tab === "categories" && (
        <DemoPanel title="カテゴリー管理" actionLabel="カテゴリー追加" onAction={addCategory}>
          {state.categories.map((category) => (
            <DemoRow key={category.id}>
              <p className="flex-1 font-bold">{category.name}</p>
              <button
                onClick={() => setState((current) => ({ ...current, categories: current.categories.filter((item) => item.id !== category.id) }))}
                className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-600"
              >
                削除
              </button>
            </DemoRow>
          ))}
        </DemoPanel>
      )}

      {tab === "users" && (
        <DemoPanel title="ユーザー権限管理">
          {state.users.map((user) => (
            <DemoRow key={user.id}>
              <div className="flex-1">
                <p className="font-bold">{user.name}</p>
                <p className="text-xs text-slate-400">投稿 {user.posts}件</p>
              </div>
              <select
                value={user.role}
                onChange={(event) => setState((current) => ({ ...current, users: current.users.map((item) => item.id === user.id ? { ...item, role: event.target.value as "ADMIN" | "USER" } : item) }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-900"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </DemoRow>
          ))}
        </DemoPanel>
      )}

      {tab === "comments" && (
        <DemoPanel title="コメント管理">
          {state.comments.map((comment) => (
            <DemoRow key={comment.id}>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400">{comment.author} / {comment.postTitle}</p>
                <p className="mt-1 text-sm">{comment.content}</p>
              </div>
              <button
                onClick={() => setState((current) => ({ ...current, comments: current.comments.filter((item) => item.id !== comment.id) }))}
                className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-600"
              >
                削除
              </button>
            </DemoRow>
          ))}
        </DemoPanel>
      )}

      <p className="text-center text-xs text-slate-400">
        デモ操作はlocalStorageにのみ保存されます。実際の管理者API・本番DB・他ユーザーのデータにはアクセスしません。
      </p>
    </main>
  );
};

const DemoPanel = ({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-black">{title}</h2>
      {actionLabel && (
        <button onClick={onAction} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
          {actionLabel}
        </button>
      )}
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-700">{children}</div>
  </section>
);

const DemoRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3 py-4">{children}</div>
);

export default Page;
