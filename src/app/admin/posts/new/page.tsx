"use client";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faLink, faCode, faGlobe, faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";

const bucketName = "cover-image";
const DRAFT_KEY = "techfeed_new_post_draft";

type CategoryApiResponse = { id: string; name: string };
type SelectableCategory = { id: string; name: string; isSelect: boolean };
type OgpData = { title: string | null; description: string | null; image: string | null; };

const Page: React.FC = () => {
  const router = useRouter();
  const { token, isLoading: authIsLoading, session } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingOgp, setIsFetchingOgp] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"KNOWLEDGE" | "PROJECT">("KNOWLEDGE");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [coverImageKey, setCoverImageKey] = useState<string | undefined>();
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const [ogpData, setOgpData] = useState<OgpData | null>(null);
  const [checkableCategories, setCheckableCategories] = useState<SelectableCategory[]>([]);

  // ── 下書き復元（初回マウント時） ──────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.title || draft.content) {
        const ok = window.confirm("下書きが見つかりました。復元しますか？");
        if (ok) {
          if (draft.title) setTitle(draft.title);
          if (draft.content) setContent(draft.content);
          if (draft.postType) setPostType(draft.postType);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 自動下書き保存（debounce 1s） ────────────────────────────
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!title && !content) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, postType }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }, 1000);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [title, content, postType]);

  useEffect(() => {
    if (!authIsLoading && !session) {
      window.alert("ログインが必要です");
      router.push("/login");
    }
  }, [authIsLoading, session, router]);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: CategoryApiResponse[]) =>
        setCheckableCategories(data.map((c) => ({ ...c, isSelect: false }))),
      );
  }, []);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setCoverImageKey(undefined);
    setCoverImageUrl(undefined);
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(`private/${file.name}`, file, { upsert: true });
      if (error || !data) {
        window.alert(`アップロード失敗: ${error?.message}`);
        return;
      }
      setCoverImageKey(data.path);
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
      setCoverImageUrl(urlData.publicUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchOgp = async (url: string) => {
    if (!url) return;
    setIsFetchingOgp(true);
    try {
      const res = await fetch(`/api/ogp?url=${encodeURIComponent(url)}`);
      if (res.ok) setOgpData(await res.json());
    } finally {
      setIsFetchingOgp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) { window.alert("ログインしてください"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({
          title,
          content,
          postType,
          repoUrl: repoUrl || undefined,
          demoUrl: demoUrl || undefined,
          coverImageKey,
          published,
          categoryIds: checkableCategories.filter((c) => c.isSelect).map((c) => c.id),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const post = await res.json();
      localStorage.removeItem(DRAFT_KEY);
      router.push(`/posts/${post.id}`);
    } catch (error) {
      window.alert(`投稿失敗: ${error instanceof Error ? error.message : error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session && !authIsLoading) return null;

  return (
    <main className="mx-auto max-w-3xl pb-20">
      <h1 className="mb-8 text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">
        新規投稿
      </h1>

      {(isSubmitting || isUploading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 px-8 py-4 shadow-lg text-gray-500 dark:text-gray-300">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            {isUploading ? "アップロード中..." : "投稿中..."}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 投稿タイプ */}
        <div className="flex gap-3">
          {(["KNOWLEDGE", "PROJECT"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPostType(t)}
              className={twMerge(
                "flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-black transition-all",
                postType === t
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-500",
              )}
            >
              <FontAwesomeIcon icon={t === "KNOWLEDGE" ? faCode : faGlobe} />
              {t === "KNOWLEDGE" ? "知見共有" : "作品共有"}
            </button>
          ))}
        </div>

        {/* タイトル */}
        <input
          type="text"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-5 py-4 text-xl font-bold focus:border-indigo-500 focus:outline-none"
        />

        {/* 本文（Markdown） */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">本文（Markdown 対応）</label>
          <textarea
            placeholder="## 見出し&#10;&#10;本文を Markdown で書いてください..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="h-64 w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-5 py-4 font-mono text-sm leading-relaxed focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* PROJECT の場合のみ URL 入力 */}
        {postType === "PROJECT" && (
          <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">プロジェクト URL</p>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faLink} className="text-slate-400" />
              <input
                type="url"
                placeholder="GitHub リポジトリ URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faGlobe} className="text-slate-400" />
              <input
                type="url"
                placeholder="デモサイト URL"
                value={demoUrl}
                onChange={(e) => {
                  setDemoUrl(e.target.value);
                  setOgpData(null);
                }}
                onBlur={(e) => fetchOgp(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {isFetchingOgp && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-slate-400" />}
            </div>
            {/* OGP プレビュー */}
            {ogpData && (
              <div className="mt-2 flex gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
                {ogpData.image && (
                  <img src={ogpData.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{ogpData.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{ogpData.description}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* カバー画像 */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">カバー画像（任意）</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isUploading}
            className="file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-indigo-600 hover:file:bg-indigo-100"
          />
          {coverImageUrl && (
            <img src={coverImageUrl} alt="preview" className="h-32 w-full rounded-xl object-cover" />
          )}
        </div>

        {/* カテゴリ */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">カテゴリ</label>
          <div className="flex flex-wrap gap-2">
            {checkableCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setCheckableCategories(
                    checkableCategories.map((cat) =>
                      cat.id === c.id ? { ...cat, isSelect: !cat.isSelect } : cat,
                    ),
                  )
                }
                className={twMerge(
                  "rounded-xl border px-4 py-1.5 text-xs font-black transition-all",
                  c.isSelect
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-500",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* 公開設定 */}
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">すぐに公開する（チェックを外すと下書き保存）</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting || isUploading || !title || !content}
          className="w-full rounded-2xl bg-slate-900 py-4 font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : "投稿する"}
        </button>
      </form>
    </main>
  );
};

export default Page;
