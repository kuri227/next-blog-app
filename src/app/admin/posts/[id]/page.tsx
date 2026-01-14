"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faSave,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

type Category = { id: string; name: string; isSelect: boolean };

const Page: React.FC = () => {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImageURL, setCoverImageURL] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, catRes] = await Promise.all([
          fetch(`/api/posts/${id}`),
          fetch("/api/categories"),
        ]);
        const post = await postRes.json();
        const cats = await catRes.json();

        setTitle(post.title);
        setContent(post.content);
        setCoverImageURL(post.coverImageURL);
        setCategories(
          cats.map((c: any) => ({
            ...c,
            isSelect: post.categories.some(
              (pc: any) => pc.category.id === c.id,
            ),
          })),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          coverImageURL,
          categoryIds: categories.filter((c) => c.isSelect).map((c) => c.id),
        }),
      });
      if (res.ok) router.push("/admin/posts");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
      </div>
    );

  return (
    <main className="mx-auto max-w-3xl pb-20">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm font-bold text-slate-500 transition hover:text-indigo-600"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        戻る
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-8 text-2xl font-black tracking-tight text-slate-800">
          記事の編集
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">本文</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-64 w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              カバー画像 (URL)
            </label>
            <input
              type="url"
              value={coverImageURL}
              onChange={(e) => setCoverImageURL(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">
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
                    "rounded-full border px-4 py-1.5 text-xs font-bold transition",
                    c.isSelect
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  変更を保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Page;
