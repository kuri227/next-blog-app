"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faHeart, faComment, faUserPlus, faUserCheck, faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

const bucketName = "cover-image";

type ProfileUser = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  githubUrl: string | null;
  _count: { posts: number; followers: number; following: number };
  posts: {
    id: string;
    title: string;
    postType: "PROJECT" | "KNOWLEDGE";
    coverImageKey: string | null;
    createdAt: string;
    _count: { likes: number; comments: number };
  }[];
};

const Page: React.FC = () => {
  const { id } = useParams() as { id: string };
  const { token, dbUser } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((data) => { setProfile(data); setIsLoading(false); });
  }, [id]);

  const handleFollow = async () => {
    if (!token) return;
    setIsFollowLoading(true);
    const method = isFollowing ? "DELETE" : "POST";
    const res = await fetch(`/api/users/${id}/follow`, {
      method,
      headers: { Authorization: token },
    });
    if (res.ok) {
      setIsFollowing(!isFollowing);
      if (profile) {
        setProfile({
          ...profile,
          _count: {
            ...profile._count,
            followers: profile._count.followers + (isFollowing ? -1 : 1),
          },
        });
      }
    }
    setIsFollowLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-slate-300">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
      </div>
    );
  }

  if (!profile) {
    return <div className="py-10 text-center text-red-500">ユーザーが見つかりません</div>;
  }

  const isOwnProfile = dbUser?.id === id;

  return (
    <main className="mx-auto max-w-3xl pb-20">
      {/* プロフィールヘッダー */}
      <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="relative">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="h-24 w-24 rounded-full border-4 border-white shadow-md" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-3xl text-slate-400">👤</div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-800">{profile.name ?? "Unknown"}</h1>
          {profile.bio && <p className="mt-1 text-slate-600">{profile.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
            <span><strong className="text-slate-800">{profile._count.posts}</strong> 投稿</span>
            <span><strong className="text-slate-800">{profile._count.followers}</strong> フォロワー</span>
            <span><strong className="text-slate-800">{profile._count.following}</strong> フォロー中</span>
          </div>
          <div className="mt-3 flex gap-3">
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 hover:border-slate-400">
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> GitHub
              </a>
            )}
            {!isOwnProfile && dbUser && (
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={twMerge(
                  "flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-bold transition-all",
                  isFollowing
                    ? "border border-slate-300 text-slate-600 hover:border-red-300 hover:text-red-500"
                    : "bg-indigo-600 text-white hover:bg-indigo-700",
                  "disabled:opacity-50",
                )}
              >
                <FontAwesomeIcon icon={isFollowing ? faUserCheck : faUserPlus} />
                {isFollowing ? "フォロー中" : "フォローする"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 投稿一覧 */}
      <h2 className="mb-4 text-xl font-black text-slate-800">投稿（{profile._count.posts}件）</h2>
      <div className="space-y-3">
        {profile.posts.map((post) => {
          const coverUrl = post.coverImageKey
            ? supabase.storage.from(bucketName).getPublicUrl(post.coverImageKey).data.publicUrl
            : null;
          return (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:shadow-sm hover:-translate-y-0.5"
            >
              {coverUrl ? (
                <img src={coverUrl} alt="" className="h-14 w-20 rounded-xl object-cover" />
              ) : (
                <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                  {post.postType === "PROJECT" ? "🛠️" : "📚"}
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-slate-800 line-clamp-1">{post.title}</p>
                <p className="text-xs text-slate-500">{dayjs(post.createdAt).format("YYYY/MM/DD")}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><FontAwesomeIcon icon={faHeart} />{post._count.likes}</span>
                <span className="flex items-center gap-1"><FontAwesomeIcon icon={faComment} />{post._count.comments}</span>
              </div>
            </Link>
          );
        })}
        {profile.posts.length === 0 && (
          <p className="py-10 text-center text-slate-400">まだ投稿がありません</p>
        )}
      </div>
    </main>
  );
};

export default Page;
