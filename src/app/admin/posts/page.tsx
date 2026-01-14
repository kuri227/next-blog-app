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
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

type PostApiResponse = {
  id: string;
  title: string;
  createdAt: string;
  categories: { category: { id: string; name: string } }[];
};

const Page: React.FC = () => {
  const [posts, setPosts] = useState<PostApiResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/posts", { cache: "no-store" });
      if (!res.ok) throw new Error("取得失敗");
      setPosts(await res.json());
    } catch (error) {
      console.error(error);
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
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (res.ok) await fetchPosts();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="space-y-6">
      {/* 管理用サブナビゲーション */}
      <div className="flex border-b border-slate-200">
        <Link
          href="/admin/posts"
          className="border-b-2 border-indigo-500 px-4 py-2 text-sm font-bold text-indigo-600"
        >
          <FontAwesomeIcon icon={faTableList} className="mr-2" />
          記事管理
        </Link>
        <Link
          href="/admin/categories"
          className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          <FontAwesomeIcon icon={faTags} className="mr-2" />
          カテゴリ管理
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          記事一覧
        </h1>
        <Link
          href="/admin/posts/new"
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
      ) : posts && posts.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-4">タイトル</th>
                  <th className="px-6 py-4">カテゴリ</th>
                  <th className="px-6 py-4">投稿日</th>
                  <th className="px-6 py-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="transition hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {post.title}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {post.categories.map((c) => (
                          <span
                            key={c.category.id}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase"
                          >
                            {c.category.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {dayjs(post.createdAt).format("YYYY.MM.DD")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="rounded-md p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <FontAwesomeIcon icon={faPencil} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
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
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400">
          記事がありません。
        </div>
      )}
    </main>
  );
};

export default Page;
