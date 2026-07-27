import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getMutableDbUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

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

  const dbUser = await getMutableDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "デモ閲覧モードでは変更できません" }, { status: 403 });

  const { id: postId } = await routeParams.params;
  const { content } = await req.json();

  if (typeof content !== "string" || content.trim().length === 0 || content.trim().length > 1000) {
    return NextResponse.json({ error: "コメントは1〜1,000文字で入力してください" }, { status: 400 });
  }

  try {
    const recentCommentCount = await prisma.comment.count({
      where: {
        authorId: dbUser.id,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (recentCommentCount >= 10) {
      return NextResponse.json(
        { error: "短時間のコメント上限に達しました" },
        { status: 429 },
      );
    }
    const comment = await prisma.comment.create({
      data: { content: content.trim(), postId, authorId: dbUser.id },
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
