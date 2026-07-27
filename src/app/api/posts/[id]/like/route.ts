import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getMutableDbUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

// いいね追加
export const POST = async (req: NextRequest, routeParams: RouteParams) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getMutableDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "デモ閲覧モードでは変更できません" }, { status: 403 });

  const { id: postId } = await routeParams.params;

  try {
    await prisma.like.create({ data: { userId: dbUser.id, postId } });
    const count = await prisma.like.count({ where: { postId } });
    return NextResponse.json({ liked: true, count });
  } catch {
    // すでにいいね済み（ユニーク制約エラー）の場合は 409
    return NextResponse.json({ error: "すでにいいね済みです" }, { status: 409 });
  }
};

// いいね取り消し
export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getMutableDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "デモ閲覧モードでは変更できません" }, { status: 403 });

  const { id: postId } = await routeParams.params;

  try {
    await prisma.like.delete({ where: { userId_postId: { userId: dbUser.id, postId } } });
    const count = await prisma.like.count({ where: { postId } });
    return NextResponse.json({ liked: false, count });
  } catch {
    return NextResponse.json({ error: "いいねが見つかりません" }, { status: 404 });
  }
};
