"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faPencil,
  faTrash,
  faPlus,
  faTableList,
  faTags,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";

type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
};

const Page: React.FC = () => {
  const [categories, setCategories] = useState<CategoryApiResponse[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (!res.ok) throw new Error("取得失敗");
      setCategories(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`カテゴリ「${name}」を削除しますか？`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) await fetchCategories();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex border-b border-slate-200">
        <Link
          href="/admin/posts"
          className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
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

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          カテゴリ一覧
        </h1>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          新規作成
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:mx-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4">名前</th>
                <th className="px-6 py-4">作成日</th>
                <th className="px-6 py-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="transition hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {dayjs(cat.createdAt).format("YYYY.MM.DD")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Link
                        href={`/admin/categories/${cat.id}`}
                        className="rounded-md p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <FontAwesomeIcon icon={faPencil} />
                      </Link>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={isDeleting}
                        className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400">
          カテゴリがありません。
        </div>
      )}
    </main>
  );
};

export default Page;
