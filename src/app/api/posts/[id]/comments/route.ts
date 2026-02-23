import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

type RouteParams = { params: Promise<{ id: string }> };

const getDbUser = async (authHeader: string) => {
  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) return null;
  return prisma.user.findUnique({ where: { supabaseId: data.user.id } });
};

// コメント一覧取得
export const GET = async (req: NextRequest, routeParams: RouteParams) => {
  const { id: postId } = await routeParams.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "コメントの取得に失敗しました" }, { status: 500 });
  }
};

// コメント投稿
export const POST = async (req: NextRequest, routeParams: RouteParams) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });

  const { id: postId } = await routeParams.params;
  const { content } = await req.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "コメントを入力してください" }, { status: 400 });
  }

  try {
    const comment = await prisma.comment.create({
      data: { content, postId, authorId: dbUser.id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    return NextResponse.json(comment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "コメントの投稿に失敗しました" }, { status: 500 });
  }
};
