"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faSave,
  faArrowLeft,
  faTableList,
  faTags,
} from "@fortawesome/free-solid-svg-icons";

const Page: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error("作成に失敗しました");

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert("エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="space-y-6">
      {/* 管理用サブナビゲーション */}
      <div className="flex border-b border-slate-200">
        <Link
          href="/admin/posts"
          className="px-4 py-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
        >
          <FontAwesomeIcon icon={faTableList} className="mr-2" />
          記事管理
        </Link>
        <Link
          href="/admin/categories"
          className="border-b-2 border-indigo-500 px-4 py-2 text-sm font-bold text-indigo-600"
        >
          <FontAwesomeIcon icon={faTags} className="mr-2" />
          カテゴリ管理
        </Link>
      </div>

      <div className="mx-auto max-w-2xl md:mx-0">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 transition hover:text-indigo-600"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          戻る
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-8 text-2xl font-black tracking-tight text-slate-800">
            カテゴリの新規作成
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="ml-1 text-sm font-bold text-slate-700"
              >
                カテゴリ名
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: TypeScript"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    カテゴリを作成
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Page;
