"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import type { Post } from "@/app/_types/Post";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCalendarDays,
  faTags,
  faChevronLeft,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import DOMPurify from "isomorphic-dompurify";

// 投稿記事の詳細表示 /posts/[id]
const Page: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 動的ルートパラメータから id を取得
  const { id } = useParams() as { id: string };

  // 環境変数の取得
  const apiBaseEp = process.env.NEXT_PUBLIC_MICROCMS_BASE_EP!;
  const apiKey = process.env.NEXT_PUBLIC_MICROCMS_API_KEY!;

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        // microCMS の個別取得エンドポイントは [ベースURL]/[エンドポイント名]/[コンテンツID] です
        // apiBaseEp が "https://.../api/v1" の場合、以下の構築で正しくなります
        // もし apiBaseEp に "/posts" まで入れている場合は、URLを調整してください
        const requestUrl = `${apiBaseEp}/posts/${id}`;

        const response = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
          headers: {
            "X-MICROCMS-API-KEY": apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(
            "記事データの取得に失敗しました。URLやAPIキーを確認してください。",
          );
        }

        const data = await response.json();
        setPost(data as Post);
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id && apiBaseEp && apiKey) {
      fetchPost();
    }
  }, [id, apiBaseEp, apiKey]);

  // エラー表示
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500">
        <FontAwesomeIcon icon={faCircleExclamation} className="mb-4 text-5xl" />
        <p className="font-bold">{fetchError}</p>
        <Link href="/" className="mt-4 text-blue-500 hover:underline">
          一覧に戻る
        </Link>
      </div>
    );
  }

  // 読み込み中表示
  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-slate-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
        読み込み中...
      </div>
    );
  }

  // データがない場合
  if (!post) return null;

  // microCMS のリッチエディタ（pタグや見出しなど）に対応できるよう許可タグを拡張
  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: [
      "b",
      "strong",
      "i",
      "em",
      "u",
      "br",
      "p",
      "h1",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "a",
    ],
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* 戻るボタン */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="mr-1.5" />
          一覧へ戻る
        </Link>
      </div>

      <article className="space-y-8">
        {/* タイトルセクション */}
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
            {post.title}
          </h1>

          {/* 投稿日とカテゴリ */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-200 pb-6 text-sm text-slate-500">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
              <time dateTime={post.createdAt}>
                {dayjs(post.createdAt).format("YYYY年MM月DD日")}
              </time>
            </div>

            <div className="flex items-center">
              <FontAwesomeIcon icon={faTags} className="mr-2" />
              <div className="flex flex-wrap gap-2">
                {post.categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-600"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* カバー画像 */}
        <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
          <Image
            src={post.coverImage.url}
            alt={post.title}
            width={post.coverImage.width}
            height={post.coverImage.height}
            priority
            className="h-auto w-full object-cover"
          />
        </div>

        {/* 本文（スタイル調整） */}
        <div
          className="prose prose-slate max-w-none leading-relaxed text-slate-700 [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:border-l-4 [&>h2]:border-slate-800 [&>h2]:pl-4 [&>h2]:text-2xl [&>h2]:font-bold [&>p]:mb-4"
          dangerouslySetInnerHTML={{ __html: safeHTML }}
        />
      </article>
    </main>
  );
};

export default Page;
