import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

const getDbUser = async (authHeader: string) => {
  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) return null;
  return prisma.user.findUnique({ where: { supabaseId: data.user.id } });
};

// 自分のプロフィールを取得
export const GET = async (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });

  return NextResponse.json(dbUser);
};

// 自分のプロフィールを更新
export const PATCH = async (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });

  try {
    const body = await req.json();
    const { bio, skills, techInterests, isOnboardingComplete, name } = body;

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(skills !== undefined && { skills }),
        ...(techInterests !== undefined && { techInterests }),
        ...(isOnboardingComplete !== undefined && { isOnboardingComplete }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "プロフィール更新に失敗しました" }, { status: 500 });
  }
};
