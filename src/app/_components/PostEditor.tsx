"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faUpload } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";

type Category = { id: string; name: string };
type EditablePost = {
  id: string;
  title: string;
  content: string;
  postType: "PROJECT" | "KNOWLEDGE";
  repoUrl: string | null;
  demoUrl: string | null;
  coverImageKey: string | null;
  published: boolean;
  categories: { category: Category }[];
};

export const PostEditor = ({ postId }: { postId?: string }) => {
  const router = useRouter();
  const { token, dbUser, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"PROJECT" | "KNOWLEDGE">("KNOWLEDGE");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [coverImageKey, setCoverImageKey] = useState<string | null>(null);
  const [published, setPublished] = useState(true);
  const [isLoading, setIsLoading] = useState(Boolean(postId));
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !token) router.replace("/login");
  }, [authLoading, router, token]);

  useEffect(() => {
    const load = async () => {
      const categoryResponse = await fetch("/api/categories", { cache: "no-store" });
      if (categoryResponse.ok) setCategories(await categoryResponse.json());

      if (!postId || !token) {
        setIsLoading(false);
        return;
      }
      const response = await fetch(`/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) {
        setError("投稿を読み込めませんでした。編集権限を確認してください。");
        setIsLoading(false);
        return;
      }
      const post: EditablePost = await response.json();
      setTitle(post.title);
      setContent(post.content);
      setPostType(post.postType);
      setRepoUrl(post.repoUrl ?? "");
      setDemoUrl(post.demoUrl ?? "");
      setCoverImageKey(post.coverImageKey);
      setPublished(post.published);
      setSelectedCategories(post.categories.map(({ category }) => category.id));
      setIsLoading(false);
    };
    void load();
  }, [postId, token]);

  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !dbUser) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("画像は5MB以下の画像ファイルを選択してください。");
      return;
    }

    setIsUploading(true);
    setError("");
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${dbUser.supabaseId}/${crypto.randomUUID()}.${extension}`;
    const { data, error: uploadError } = await supabase.storage
      .from("cover-image")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError || !data) {
      setError(`画像のアップロードに失敗しました: ${uploadError?.message ?? "unknown"}`);
    } else {
      setCoverImageKey(data.path);
    }
    setIsUploading(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setError("");

    const response = await fetch(postId ? `/api/posts/${postId}` : "/api/posts", {
      method: postId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        content,
        postType,
        repoUrl,
        demoUrl,
        coverImageKey,
        published,
        categoryIds: selectedCategories,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "保存に失敗しました。");
      setIsSubmitting(false);
      return;
    }
    router.push(`/posts/${data.id}`);
    router.refresh();
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((current) =>
      current.includes(id)
        ? current.filter((categoryId) => categoryId !== id)
        : current.length < 5
          ? [...current, id]
          : current,
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center py-24 text-slate-400">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl pb-20">
      <h1 className="mb-8 text-3xl font-black text-slate-900 dark:text-white">
        {postId ? "投稿を編集" : "新しい投稿"}
      </h1>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-2">
          {(["KNOWLEDGE", "PROJECT"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPostType(type)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                postType === type
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              {type === "KNOWLEDGE" ? "技術記事" : "作品・プロジェクト"}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold">タイトル</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={1}
            maxLength={120}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:bg-slate-900"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold">本文（Markdown）</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={20000}
            required
            rows={18}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm dark:bg-slate-900"
          />
          <span className="mt-1 block text-right text-xs text-slate-400">
            {content.length.toLocaleString()} / 20,000
          </span>
        </label>

        {postType === "PROJECT" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold">GitHub URL</span>
              <input
                type="url"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:bg-slate-900"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold">デモURL</span>
              <input
                type="url"
                value={demoUrl}
                onChange={(event) => setDemoUrl(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:bg-slate-900"
              />
            </label>
          </div>
        )}

        <div>
          <span className="mb-2 block text-sm font-bold">カテゴリー（最大5件）</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                  selectedCategories.includes(category.id)
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold">カバー画像（5MBまで）</span>
          <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold">
            <FontAwesomeIcon icon={isUploading ? faSpinner : faUpload} className={isUploading ? "animate-spin" : ""} />
            画像を選択
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </span>
          {coverImageKey && <span className="ml-3 text-xs text-emerald-600">アップロード済み</span>}
        </label>

        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
          />
          すぐに公開する
        </label>

        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full rounded-xl bg-slate-900 py-4 font-black text-white disabled:opacity-50"
        >
          {isSubmitting ? "保存中..." : postId ? "変更を保存" : "投稿する"}
        </button>
      </form>
    </main>
  );
};
