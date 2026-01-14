"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faPencil,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

type PostApiResponse = {
  id: string;
  title: string;
  createdAt: string;
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
};

const Page: React.FC = () => {
  const [posts, setPosts] = useState<PostApiResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const requestUrl = "/api/posts";
      const res = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as PostApiResponse[];
      setPosts(data);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事の一覧のフェッチに失敗しました: ${error.message}`
          : `予期せぬエラーが発生しました ${error}`;
      console.error(errorMsg);
      setFetchError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`記事「${title}」を本当に削除しますか？`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const requestUrl = `/api/admin/posts/${id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      await fetchPosts();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `記事のDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  if (fetchError) {
    return <div className="text-red-500">{fetchError}</div>;
  }

  if (!posts) {
    return <div className="text-red-500">投稿記事の取得に失敗しました</div>;
  }

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-2xl font-bold">投稿記事の一覧</div>
        <Link
          href="/admin/posts/new"
          className={twMerge(
            "rounded-md px-5 py-1 font-bold",
            "bg-indigo-500 text-white hover:bg-indigo-600",
          )}
        >
          新規作成
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-gray-500">投稿記事は存在しません</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-300 px-4 py-2 text-left">
                  タイトル
                </th>
                <th className="border border-slate-300 px-4 py-2 text-left">
                  作成日
                </th>
                <th className="border border-slate-300 px-4 py-2 text-left">
                  カテゴリ
                </th>
                <th className="border border-slate-300 px-4 py-2 text-center">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50">
                  <td className="border border-slate-300 px-4 py-2">
                    {post.title}
                  </td>
                  <td className="border border-slate-300 px-4 py-2 text-sm text-gray-600">
                    {dayjs(post.createdAt).format("YYYY-MM-DD")}
                  </td>
                  <td className="border border-slate-300 px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {post.categories.map((c) => (
                        <span
                          key={c.category.id}
                          className="rounded-md border border-slate-400 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-600"
                        >
                          {c.category.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="border border-slate-300 px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className={twMerge(
                          "rounded-md px-3 py-1 text-sm font-bold",
                          "bg-blue-500 text-white hover:bg-blue-600",
                        )}
                      >
                        <FontAwesomeIcon icon={faPencil} className="mr-1" />
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        disabled={isDeleting}
                        className={twMerge(
                          "rounded-md px-3 py-1 text-sm font-bold",
                          "bg-red-500 text-white hover:bg-red-600",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-1" />
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default Page;
