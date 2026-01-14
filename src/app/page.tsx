"use client";
import { useState, useEffect } from "react";
import type { Post } from "@/app/_types/Post";
import PostSummary from "@/app/_components/PostSummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageURL: string; // ◀ APIレスポンスに項目を追加
  createdAt: string;
  categories: {
    category: { id: string; name: string };
  }[];
};

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("データの取得に失敗しました");
        const data = (await response.json()) as PostApiResponse[];

        setPosts(
          data.map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content,
            createdAt: post.createdAt,
            categories: post.categories.map((c) => ({
              id: c.category.id,
              name: c.category.name,
            })),
            // DBの実画像をセット
            coverImage: {
              url: post.coverImageURL,
              width: 1200,
              height: 630,
            },
          })),
        );
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました",
        );
      }
    };
    fetchPosts();
  }, []);

  if (fetchError) return <div className="py-10 text-red-500">{fetchError}</div>;
  if (!posts)
    return (
      <div className="flex justify-center py-20">
        <FontAwesomeIcon
          icon={faSpinner}
          className="animate-spin text-2xl text-slate-500"
        />
      </div>
    );

  return (
    <main className="pb-20">
      <div className="mb-12 border-b border-slate-200 py-10 text-center">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
          Tech Blog
        </h1>
        <p className="mt-4 font-medium text-slate-500">
          技術の知見を共有する場所
        </p>
      </div>

      {/* スマホ1列、PC3列のレスポンシブグリッド */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostSummary key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
};

export default Page;
