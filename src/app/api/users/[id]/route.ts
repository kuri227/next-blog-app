import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

type RouteParams = { params: Promise<{ id: string }> };

const getDbUser = async (authHeader: string) => {
  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) return null;
  return prisma.user.findUnique({ where: { supabaseId: data.user.id } });
};

// プロフィール取得
export const GET = async (req: NextRequest, routeParams: RouteParams) => {
  const { id } = await routeParams.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        githubUrl: true,
        createdAt: true,
        _count: {
          select: { posts: true, followers: true, following: true },
        },
        posts: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            postType: true,
            coverImageKey: true,
            createdAt: true,
            _count: { select: { likes: true, comments: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "プロフィールの取得に失敗しました" }, { status: 500 });
  }
};
