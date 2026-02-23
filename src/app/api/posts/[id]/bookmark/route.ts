import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

type RouteParams = { params: Promise<{ id: string }> };

const getDbUser = async (authHeader: string) => {
  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) return null;
  return prisma.user.findUnique({ where: { supabaseId: data.user.id } });
};

// ブックマーク追加
export const POST = async (req: NextRequest, routeParams: RouteParams) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });

  const { id: postId } = await routeParams.params;

  try {
    await prisma.bookmark.create({ data: { userId: dbUser.id, postId } });
    return NextResponse.json({ bookmarked: true });
  } catch {
    return NextResponse.json({ error: "すでにブックマーク済みです" }, { status: 409 });
  }
};

// ブックマーク削除
export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });

  const { id: postId } = await routeParams.params;

  try {
    await prisma.bookmark.delete({ where: { userId_postId: { userId: dbUser.id, postId } } });
    return NextResponse.json({ bookmarked: false });
  } catch {
    return NextResponse.json({ error: "ブックマークが見つかりません" }, { status: 404 });
  }
};
