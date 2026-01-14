"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import type { Post } from "@/app/_types/Post";
import dummyPosts from "@/app/_mocks/dummyPosts";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCalendarDays,
  faTags,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import DOMPurify from "isomorphic-dompurify";

// 投稿記事の詳細表示 /posts/[id]
const Page: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 動的ルートパラメータから 記事id を取得
  const { id } = useParams() as { id: string };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      // dummyPosts から id に一致する投稿を取得
      setPost(dummyPosts.find((p) => p.id === id) || null);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="text-red-500">指定idの投稿の取得に失敗しました。</div>
        <Link href="/" className="mt-4 inline-block text-blue-500 underline">
          一覧へ戻る
        </Link>
      </div>
    );
  }

  // HTMLコンテンツのサニタイズ
  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* 戻るボタン */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
          投稿一覧へ戻る
        </Link>
      </div>

      <article className="space-y-6">
        {/* タイトルセクション */}
        <h1 className="text-3xl font-extrabold text-slate-800 md:text-4xl">
          {post.title}
        </h1>

        {/* メタ情報（日付・カテゴリ） */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-200 pb-6 text-sm text-slate-500">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
            <time dateTime={post.createdAt}>
              {dayjs(post.createdAt).format("YYYY年MM月DD日")}
            </time>
          </div>

          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faTags} className="mr-1" />
            <div className="flex flex-wrap gap-1.5">
              {post.categories.map((category) => (
                <span
                  key={category.id}
                  className={twMerge(
                    "rounded-md border border-slate-300 px-2 py-0.5",
                    "bg-slate-50 text-xs font-bold text-slate-600",
                  )}
                >
                  {category.name}
                </span>
              ))}
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
            className="h-auto w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* 本文 */}
        <div
          className="prose prose-slate max-w-none leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: safeHTML }}
        />
      </article>
    </main>
  );
};

export default Page;
