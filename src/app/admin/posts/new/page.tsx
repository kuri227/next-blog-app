"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";

const bucketName = "cover-image";

// カテゴリをフェッチしたときのレスポンスのデータ型
type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// 投稿記事のカテゴリ選択用のデータ型
type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};

// 投稿記事の新規作成のページ
const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [coverImageKey, setCoverImageKey] = useState<string | undefined>();
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();

  const { token, isLoading: authIsLoading, session } = useAuth();
  const router = useRouter();

  // 認証チェック
  useEffect(() => {
    if (!authIsLoading && !session) {
      window.alert("記事を投稿するにはログインが必要です");
      router.push("/login");
    }
  }, [authIsLoading, session, router]);

  // カテゴリ配列 (State)。取得中と取得失敗時は null、既存カテゴリが0個なら []
  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  // コンポーネントがマウントされたとき (初回レンダリングのとき) に1回だけ実行
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const requestUrl = "/api/categories";
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }

        const apiResBody = (await res.json()) as CategoryApiResponse[];
        setCheckableCategories(
          apiResBody.map((body) => ({
            id: body.id,
            name: body.name,
            isSelect: false,
          })),
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // チェックボックスの状態 (State) を更新する関数
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

  // 画像ファイル選択・アップロード処理
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
      const publicUrlResult = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      setCoverImageUrl(publicUrlResult.data.publicUrl);
    } finally {
      setIsUploading(false);
    }
  };

  // フォームの送信処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      window.alert("トークンが取得できません。もう一度ログインしてください。");
      return;
    }

    if (!session) {
      window.alert("セッションが無効です。ログインしてください。");
      return;
    }

    if (!coverImageKey) {
      window.alert("カバー画像をアップロードしてください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        title: newTitle,
        content: newContent,
        coverImageKey,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };
      const requestUrl = "/api/admin/posts";
      console.log(`${requestUrl} => ${JSON.stringify(requestBody, null, 2)}`);
      const res = await fetch(requestUrl, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const postResponse = await res.json();
      setIsSubmitting(false);
      router.push(`/posts/${postResponse.id}`);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPOSTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-slate-400">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-10 text-center text-red-500">
        記事を投稿するにはログインが必要です
      </div>
    );
  }

  return (
    <main>
      <div className="mb-4 text-2xl font-bold">投稿記事の新規作成</div>

      {(isSubmitting || isUploading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="flex items-center text-gray-500">
              {isUploading ? "アップロード中..." : "処理中..."}
            </div>
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
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
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
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="本文を記入してください"
            required
          />
        </div>

        {/* 画像アップロード */}
        <div className="space-y-2">
          <label className="block font-bold">カバー画像</label>
          <input
            id="imgSelector"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isUploading}
            className={twMerge(
              "file:rounded file:px-2 file:py-1",
              "file:bg-indigo-500 file:text-white hover:file:bg-indigo-600",
              "file:cursor-pointer",
            )}
          />
          {coverImageUrl && (
            <div className="mt-2">
              <img
                src={coverImageUrl}
                alt="カバー画像プレビュー"
                className="h-40 w-full rounded-md object-cover"
              />
              <p className="mt-1 break-all text-xs text-slate-500">
                key: {coverImageKey}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="font-bold">タグ</div>
          <div className="flex flex-wrap gap-x-3.5">
            {checkableCategories && checkableCategories.length > 0 ? (
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

        {fetchErrorMsg && (
          <div className="text-sm text-red-500">{fetchErrorMsg}</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed",
            )}
            disabled={isSubmitting || isUploading || !coverImageKey}
          >
            記事を投稿
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
