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
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";

type Post = {
  id: string;
  title: string;
  createdAt: string;
  categories: { category: { id: string; name: string } }[];
};

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/posts", { cache: "no-store" });
      if (res.ok) setPosts(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`「${title}」を削除しますか？`)) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      await fetchPosts();
    } finally {
      setIsDeleting(false);
    }
  };

  // ライブフィルタリング（タイトルで検索）
  const filteredPosts =
    posts?.filter((post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  return (
    <main className="space-y-6">
      <div className="flex border-b border-slate-200">
        <Link
          href="/admin/posts"
          className="flex items-center gap-2 border-b-2 border-indigo-500 px-4 py-2 text-sm font-bold text-indigo-600"
        >
          <FontAwesomeIcon icon={faTableList} />
          記事管理
        </Link>
        <Link
          href="/admin/categories"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
          <FontAwesomeIcon icon={faTags} />
          カテゴリ管理
        </Link>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          記事管理
        </h1>
        <div className="flex w-full gap-3 md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-slate-400"
            />
            <input
              type="text"
              placeholder="タイトルで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pr-4 pl-9 text-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none"
            />
          </div>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold whitespace-nowrap text-white shadow-sm hover:bg-indigo-700"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            新規投稿
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-300">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4">タイトル</th>
                <th className="px-6 py-4">カテゴリ</th>
                <th className="px-6 py-4">投稿日</th>
                <th className="px-6 py-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPosts.map((post) => (
                <tr
                  key={post.id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {post.title}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {post.categories.map((c) => (
                        <span
                          key={c.category.id}
                          className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase"
                        >
                          {c.category.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-500">
                    {dayjs(post.createdAt).format("YYYY.MM.DD")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="p-2 text-slate-400 transition-all hover:text-indigo-600"
                      >
                        <FontAwesomeIcon icon={faPencil} />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
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
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white py-24 text-slate-400">
          <FontAwesomeIcon
            icon={faBoxOpen}
            className="mb-4 text-6xl opacity-20"
          />
          <p className="mb-1 text-xl font-black text-slate-800">
            記事が見つかりません
          </p>
          <p className="text-sm font-medium">
            条件を変えて検索するか、新しい記事を作成してください。
          </p>
        </div>
      )}
    </main>
  );
};

export default Page;
