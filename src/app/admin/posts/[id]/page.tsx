"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};

type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageURL: string;
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
};

const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImageURL, setCoverImageURL] = useState("");
  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  const { id } = useParams() as { id: string };
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // カテゴリの取得
        const categoriesRes = await fetch("/api/categories", {
          method: "GET",
          cache: "no-store",
        });
        if (!categoriesRes.ok) {
          throw new Error("カテゴリの取得に失敗しました");
        }
        const categoriesData = (await categoriesRes.json()) as CategoryApiResponse[];

        // 投稿記事の取得
        const postRes = await fetch(`/api/posts/${id}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!postRes.ok) {
          throw new Error("投稿記事の取得に失敗しました");
        }
        const postData = (await postRes.json()) as PostApiResponse;

        // 選択されたカテゴリのIDを取得
        const selectedCategoryIds = postData.categories.map(
          (c) => c.category.id,
        );

        setTitle(postData.title);
        setContent(postData.content);
        setCoverImageURL(postData.coverImageURL);
        setCheckableCategories(
          categoriesData.map((c) => ({
            id: c.id,
            name: c.name,
            isSelect: selectedCategoryIds.includes(c.id),
          })),
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : "予期せぬエラーが発生しました";
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const switchCategoryState = (categoryId: string) => {
    if (!checkableCategories) return;

    setCheckableCategories(
      checkableCategories.map((category) =>
        category.id === categoryId
          ? { ...category, isSelect: !category.isSelect }
          : category,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestBody = {
        title,
        content,
        coverImageURL,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };
      const requestUrl = `/api/admin/posts/${id}`;
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      setIsSubmitting(false);
      router.push(`/posts/${id}`);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPUTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`この記事を本当に削除しますか？`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestUrl = `/api/admin/posts/${id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      router.replace("/admin/posts");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `記事のDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
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

  if (fetchErrorMsg) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  if (!checkableCategories) {
    return <div className="text-red-500">データの取得に失敗しました</div>;
  }

  return (
    <main>
      <div className="mb-4 text-2xl font-bold">投稿記事の編集・削除</div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="flex items-center text-gray-500">処理中...</div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={twMerge("space-y-4", isSubmitting && "opacity-50")}
      >
        <div className="space-y-1">
          <label htmlFor="title" className="block font-bold">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full rounded-md border-2 px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block font-bold">
            本文
          </label>
          <textarea
            id="content"
            name="content"
            className="h-48 w-full rounded-md border-2 px-2 py-1"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="本文を記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="coverImageURL" className="block font-bold">
            カバーイメージ (URL)
          </label>
          <input
            type="url"
            id="coverImageURL"
            name="coverImageURL"
            className="w-full rounded-md border-2 px-2 py-1"
            value={coverImageURL}
            onChange={(e) => setCoverImageURL(e.target.value)}
            placeholder="カバーイメージのURLを記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="font-bold">タグ</div>
          <div className="flex flex-wrap gap-x-3.5">
            {checkableCategories.length > 0 ? (
              checkableCategories.map((c) => (
                <label key={c.id} className="flex space-x-1">
                  <input
                    id={c.id}
                    type="checkbox"
                    checked={c.isSelect}
                    className="mt-0.5 cursor-pointer"
                    onChange={() => switchCategoryState(c.id)}
                  />
                  <span className="cursor-pointer">{c.name}</span>
                </label>
              ))
            ) : (
              <div>選択可能なカテゴリが存在しません。</div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="submit"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            disabled={isSubmitting}
          >
            変更を保存
          </button>

          <button
            type="button"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-red-500 text-white hover:bg-red-600",
            )}
            onClick={handleDelete}
          >
            削除
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;