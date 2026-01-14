"use client";
import type { Post } from "@/app/_types/Post";
import dayjs from "dayjs";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";

type Props = {
  post: Post;
};

const PostSummary: React.FC<Props> = (props) => {
  const { post } = props;
  const dtFmt = "YYYY-MM-DD";

  // 本文からタグを除去（抜粋表示用）
  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: [],
  });

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/posts/${post.id}`} className="flex h-full flex-col">
        {/* カバー画像エリア：DBのURLを反映 */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          <Image
            src={post.coverImage.url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
        </div>

        {/* コンテンツエリア */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <span
                key={category.id}
                className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
              >
                {category.name}
              </span>
            ))}
          </div>

          <h2 className="mb-2 line-clamp-2 text-xl font-bold text-slate-900 group-hover:text-blue-600">
            {post.title}
          </h2>

          <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-500">
            {safeHTML}
          </p>

          <div className="mt-auto flex items-center text-xs text-slate-400">
            <FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
            <time dateTime={post.createdAt}>
              {dayjs(post.createdAt).format(dtFmt)}
            </time>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default PostSummary;
