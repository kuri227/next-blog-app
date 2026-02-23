import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

type RouteParams = { params: Promise<{ id: string }> };

const getDbUser = async (authHeader: string) => {
  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) return null;
  return prisma.user.findUnique({ where: { supabaseId: data.user.id } });
};

// フォロー
export const POST = async (req: NextRequest, routeParams: RouteParams) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });

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

  const dbUser = await getDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });

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
