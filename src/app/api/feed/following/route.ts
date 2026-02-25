import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

export const GET = async (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: data.user.id },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        author: {
          followers: {
            some: { followerId: dbUser.id },
          },
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        postType: true,
        repoUrl: true,
        demoUrl: true,
        coverImageKey: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        categories: {
          select: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "フォロー中フィードの取得に失敗しました" },
      { status: 500 },
    );
  }
};
