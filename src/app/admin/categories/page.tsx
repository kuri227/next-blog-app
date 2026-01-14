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
  faSearch,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";

type Category = {
  id: string;
  name: string;
  createdAt: string;
  _count: { posts: number };
};

const Page: React.FC = () => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (res.ok) setCategories(await res.json());
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
      await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      await fetchCategories();
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories =
    categories?.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  return (
    <main className="space-y-6">
      <div className="flex border-b border-slate-200">
        <Link
          href="/admin/posts"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
          <FontAwesomeIcon icon={faTableList} />
          記事管理
        </Link>
        <Link
          href="/admin/categories"
          className="flex items-center gap-2 border-b-2 border-indigo-500 px-4 py-2 text-sm font-bold text-indigo-600"
        >
          <FontAwesomeIcon icon={faTags} />
          カテゴリ管理
        </Link>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          カテゴリ管理
        </h1>
        <div className="flex w-full gap-3 md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-slate-400"
            />
            <input
              type="text"
              placeholder="カテゴリ名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pr-4 pl-9 text-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none"
            />
          </div>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold whitespace-nowrap text-white shadow-sm hover:bg-indigo-700"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            新規作成
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-300">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4">カテゴリ名</th>
                <th className="px-6 py-4 text-center">記事数</th>
                <th className="px-6 py-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map((cat) => (
                <tr
                  key={cat.id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black text-indigo-600 ring-1 ring-indigo-600/20 ring-inset">
                      {cat._count.posts} 記事
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <Link
                        href={`/admin/categories/${cat.id}`}
                        className="p-2 text-slate-400 transition-all hover:text-indigo-600"
                      >
                        <FontAwesomeIcon icon={faPencil} />
                      </Link>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={isDeleting}
                        className="p-2 text-slate-400 transition-all hover:text-red-600 disabled:opacity-30"
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
        <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white py-24 text-slate-400">
          <FontAwesomeIcon
            icon={faFolderOpen}
            className="mb-4 text-6xl opacity-20"
          />
          <p className="mb-1 text-xl font-black text-slate-800">
            カテゴリが見つかりません
          </p>
        </div>
      )}
    </main>
  );
};

export default Page;
