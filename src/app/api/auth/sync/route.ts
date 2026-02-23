import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

// ログイン後にフロントエンドから呼び出す
// Supabase の認証ユーザーを Prisma の User テーブルに同期する
export const POST = async (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const supabaseUser = data.user;
  const meta = supabaseUser.user_metadata;

  try {
    const user = await prisma.user.upsert({
      where: { supabaseId: supabaseUser.id },
      update: {
        email: supabaseUser.email ?? "",
        name: meta?.full_name ?? meta?.user_name ?? null,
        avatarUrl: meta?.avatar_url ?? null,
        githubUrl: meta?.user_name
          ? `https://github.com/${meta.user_name}`
          : null,
      },
      create: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email ?? "",
        name: meta?.full_name ?? meta?.user_name ?? null,
        avatarUrl: meta?.avatar_url ?? null,
        githubUrl: meta?.user_name
          ? `https://github.com/${meta.user_name}`
          : null,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "ユーザー同期に失敗しました" },
      { status: 500 },
    );
  }
};
