"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
// Image コンポーネントはAPIから coverImage が取得される場合に備えて残しています
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCalendarDays,
  faTags,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

import dayjs from "dayjs";
import DOMPurify from "isomorphic-dompurify";

// APIの新しいデータ構造に合わせて型を定義
type PostDetail = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
  // 必要に応じて他のフィールド（coverImage等）を定義
  coverImage?: {
    url: string;
    width: number;
    height: number;
  };
};

const Page: React.FC = () => {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { id } = useParams() as { id: string };

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/posts/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("記事の取得に失敗しました");
        }

        const data = await response.json();
        setPost(data);
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-slate-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (fetchError || !post) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-red-500">
          {fetchError || "記事が見つかりませんでした"}
        </div>
        <Link href="/" className="text-blue-500 hover:underline">
          一覧に戻る
        </Link>
      </div>
    );
  }

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
    ],
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="flex items-center text-sm text-slate-500 hover:text-slate-800"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
          一覧へ戻る
        </Link>
      </div>

      <article className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-200 pb-6 text-sm text-slate-500">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
            <time>{dayjs(post.createdAt).format("YYYY年MM月DD日")}</time>
          </div>

          <div className="flex items-center">
            <FontAwesomeIcon icon={faTags} className="mr-2" />
            <div className="flex gap-2">
              {/* APIの構造に合わせてカテゴリの取得経路を修正 */}
              {post.categories.map((item) => (
                <span
                  key={item.category.id}
                  className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-600"
                >
                  {item.category.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* APIからデータが取得できる場合のみ画像を表示 */}
        {post.coverImage && (
          <div className="overflow-hidden rounded-xl bg-slate-100 shadow-sm">
            <Image
              src={post.coverImage.url}
              alt={post.title}
              width={post.coverImage.width}
              height={post.coverImage.height}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <div
          className="prose prose-slate max-w-none leading-relaxed text-slate-700 [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:border-l-4 [&>h2]:border-slate-800 [&>h2]:pl-4 [&>h2]:text-2xl [&>h2]:font-bold"
          dangerouslySetInnerHTML={{ __html: safeHTML }}
        />
      </article>
    </main>
  );
};

export default Page;
