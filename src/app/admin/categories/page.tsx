"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const Page: React.FC = () => {
  const [categories, setCategories] = useState<CategoryApiResponse[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const requestUrl = "/api/categories";
      const res = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as CategoryApiResponse[];
      setCategories(data);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
          : `予期せぬエラーが発生しました ${error}`;
      console.error(errorMsg);
      setFetchError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`カテゴリ「${name}」を本当に削除しますか？`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const requestUrl = `/api/admin/categories/${id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      await fetchCategories();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリのDELETEリクエストに失敗しました\n${error.message}`
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

  if (!categories) {
    return <div className="text-red-500">カテゴリの取得に失敗しました</div>;
  }

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-2xl font-bold">カテゴリの一覧</div>
        <Link
          href="/admin/categories/new"
          className={twMerge(
            "rounded-md px-5 py-1 font-bold",
            "bg-indigo-500 text-white hover:bg-indigo-600",
          )}
        >
          新規作成
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="text-gray-500">カテゴリは存在しません</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-300 px-4 py-2 text-left">
                  名前
                </th>
                <th className="border border-slate-300 px-4 py-2 text-left">
                  作成日
                </th>
                <th className="border border-slate-300 px-4 py-2 text-center">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50">
                  <td className="border border-slate-300 px-4 py-2">
                    {category.name}
                  </td>
                  <td className="border border-slate-300 px-4 py-2 text-sm text-gray-600">
                    {dayjs(category.createdAt).format("YYYY-MM-DD")}
                  </td>
                  <td className="border border-slate-300 px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className={twMerge(
                          "rounded-md px-3 py-1 text-sm font-bold",
                          "bg-blue-500 text-white hover:bg-blue-600",
                        )}
                      >
                        <FontAwesomeIcon icon={faPencil} className="mr-1" />
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
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