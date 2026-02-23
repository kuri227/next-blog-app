"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faSave,
  faArrowLeft,
  faExclamationCircle,
  faLightbulb,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

const bucketName = "cover-image";
type Category = { id: string; name: string; isSelect: boolean };

// バリデーション定数
const TITLE_MAX = 100;
const CONTENT_MIN = 10;
const CONTENT_MAX = 5000;

const Page: React.FC = () => {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImageKey, setCoverImageKey] = useState<string | undefined>();
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch(`/api/posts/${id}`),
          fetch("/api/categories"),
        ]);
        const post = await pRes.json();
        const cats = await cRes.json();
        setTitle(post.title);
        setContent(post.content);

        // 既存の coverImageKey をセット
        if (post.coverImageKey) {
          setCoverImageKey(post.coverImageKey);
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(post.coverImageKey);
          setCoverImageUrl(urlData.publicUrl);
        }

        setCategories(
          cats.map((c: any) => ({
            ...c,
            isSelect: post.categories.some(
              (pc: any) => pc.category.id === c.id,
            ),
          })),
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 画像アップロード処理
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setCoverImageKey(undefined);
    setCoverImageUrl(undefined);

    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const path = `private/${file.name}`;

    setIsUploading(true);
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, { upsert: true });

      if (error || !data) {
        window.alert(`アップロードに失敗しました: ${error?.message}`);
        return;
      }

      setCoverImageKey(data.path);
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      setCoverImageUrl(urlData.publicUrl);
    } finally {
      setIsUploading(false);
    }
  };

  // バリデーション
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "タイトルは必須です";
    if (title.length > TITLE_MAX)
      errs.title = `${TITLE_MAX}文字以内で入力してください`;

    if (content.length < CONTENT_MIN)
      errs.content = `本文は${CONTENT_MIN}文字以上必要です`;
    if (content.length > CONTENT_MAX)
      errs.content = `本文は${CONTENT_MAX}文字以内で入力してください`;

    if (!coverImageKey)
      errs.coverImageKey = "カバー画像をアップロードしてください";

    if (categories.filter((c) => c.isSelect).length === 0)
      errs.categories = "カテゴリを最低1つ選択してください";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({
          title,
          content,
          coverImageKey,
          categoryIds: categories.filter((c) => c.isSelect).map((c) => c.id),
        }),
      });
      if (res.ok) router.push("/admin/posts");
      else throw new Error("更新に失敗しました");
    } catch (error) {
      console.error(error);
      window.alert("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-20 text-slate-300">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
      </div>
    );

  return (
    <main className="mx-auto max-w-5xl pb-20">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 transition-all hover:text-indigo-600"
      >
        <FontAwesomeIcon icon={faArrowLeft} /> 戻る
      </button>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10 lg:col-span-2">
          <h1 className="mb-10 text-3xl font-black tracking-tight text-slate-800">
            記事の編集
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* タイトル */}
            <div className="space-y-3">
              <label className="ml-1 text-sm font-bold text-slate-700">
                タイトル
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={twMerge(
                  "w-full rounded-2xl border px-5 py-4 text-lg font-bold transition-all focus:outline-none",
                  errors.title
                    ? "border-red-500 bg-red-50"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5",
                )}
              />
              {errors.title && (
                <p className="flex items-center gap-1 text-xs font-bold text-red-500">
                  <FontAwesomeIcon icon={faExclamationCircle} /> {errors.title}
                </p>
              )}
            </div>

            {/* 本文 */}
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <label className="ml-1 text-sm font-bold text-slate-700">
                  本文
                </label>
                <span
                  className={twMerge(
                    "rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold",
                    content.length > CONTENT_MAX
                      ? "bg-red-50 text-red-500"
                      : "text-slate-400",
                  )}
                >
                  {content.length.toLocaleString()} /{" "}
                  {CONTENT_MAX.toLocaleString()} 文字
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={twMerge(
                  "h-96 w-full resize-none rounded-2xl border px-5 py-4 leading-relaxed transition-all focus:outline-none",
                  errors.content
                    ? "border-red-500 bg-red-50"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5",
                )}
              />
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={twMerge(
                    "h-full transition-all duration-500",
                    content.length > CONTENT_MAX ? "bg-red-500" : "bg-indigo-600",
                  )}
                  style={{
                    width: `${Math.min((content.length / CONTENT_MAX) * 100, 100)}%`,
                  }}
                />
              </div>
              {errors.content && (
                <p className="flex items-center gap-1 text-xs font-bold text-red-500">
                  <FontAwesomeIcon icon={faExclamationCircle} />{" "}
                  {errors.content}
                </p>
              )}
            </div>

            {/* カバー画像アップロード */}
            <div className="space-y-4">
              <label className="ml-1 text-sm font-bold text-slate-700">
                カバー画像
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploading}
                className={twMerge(
                  "file:rounded file:px-2 file:py-1",
                  "file:bg-indigo-500 file:text-white hover:file:bg-indigo-600",
                  "file:cursor-pointer",
                  errors.coverImageKey ? "border border-red-500 rounded p-1" : "",
                )}
              />
              {/* 既存画像 or 新規アップロードのプレビュー */}
              {coverImageUrl && (
                <div className="group relative aspect-video overflow-hidden rounded-3xl border border-slate-200 shadow-inner">
                  <img
                    src={coverImageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-md">
                    <FontAwesomeIcon icon={faImage} className="mr-1" /> Live
                    Preview
                  </div>
                </div>
              )}
              {errors.coverImageKey && (
                <p className="flex items-center gap-1 text-xs font-bold text-red-500">
                  <FontAwesomeIcon icon={faExclamationCircle} />{" "}
                  {errors.coverImageKey}
                </p>
              )}
            </div>

            {/* カテゴリ選択 */}
            <div className="space-y-4">
              <label className="ml-1 text-sm font-bold text-slate-700">
                カテゴリ
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setCategories(
                        categories.map((cat) =>
                          cat.id === c.id
                            ? { ...cat, isSelect: !cat.isSelect }
                            : cat,
                        ),
                      )
                    }
                    className={twMerge(
                      "rounded-xl border px-5 py-2.5 text-xs font-black transition-all",
                      c.isSelect
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              {errors.categories && (
                <p className="flex items-center gap-1 text-xs font-bold text-red-500">
                  <FontAwesomeIcon icon={faExclamationCircle} />{" "}
                  {errors.categories}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full rounded-2xl bg-slate-900 py-5 font-black text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting || isUploading ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />{" "}
                  変更を保存して公開
                </>
              )}
            </button>
          </form>
        </div>

        {/* サイドバー Tips */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-indigo-600">
              <FontAwesomeIcon icon={faLightbulb} className="text-xl" />
              <h3 className="text-sm font-black tracking-widest uppercase">
                Writing Tips
              </h3>
            </div>
            <ul className="space-y-4 text-xs leading-relaxed font-medium text-indigo-800">
              <li className="flex gap-2 font-bold text-indigo-900">
                <span>・</span>
                本文が長い場合は、適度に段落を分けて読みやすくしましょう。
              </li>
              <li className="flex gap-2">
                <span>・</span>
                ゲージが満タンに近づくほど、内容の濃い記事であることを示します。
              </li>
              <li className="flex gap-2">
                <span>・</span>
                プレビューで画像が正しく表示されているか確認してください。
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Page;
