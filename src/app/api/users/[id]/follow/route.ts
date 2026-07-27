import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getMutableDbUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

// フォロー
export const POST = async (req: NextRequest, routeParams: RouteParams) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getMutableDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "デモ閲覧モードでは変更できません" }, { status: 403 });

  const { id: followingId } = await routeParams.params;

  if (dbUser.id === followingId) {
    return NextResponse.json({ error: "自分自身はフォローできません" }, { status: 400 });
  }

  try {
    await prisma.follow.create({
      data: { followerId: dbUser.id, followingId },
    });
    return NextResponse.json({ following: true });
  } catch {
    return NextResponse.json({ error: "すでにフォロー中です" }, { status: 409 });
  }
};

// アンフォロー
export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getMutableDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "デモ閲覧モードでは変更できません" }, { status: 403 });

  const { id: followingId } = await routeParams.params;

  try {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: dbUser.id, followingId } },
    });
    return NextResponse.json({ following: false });
  } catch {
    return NextResponse.json({ error: "フォロー関係が見つかりません" }, { status: 404 });
  }
};
