import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import {
  getAuthenticatedDbUser,
  getMutableDbUser,
} from "@/lib/auth";

// 自分のプロフィールを取得
export const GET = async (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getAuthenticatedDbUser(authHeader);
  if (!dbUser) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });

  return NextResponse.json(dbUser);
};

// 自分のプロフィールを更新
export const PATCH = async (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const dbUser = await getMutableDbUser(authHeader);
  if (!dbUser) {
    return NextResponse.json(
      { error: "デモ閲覧モードではプロフィールを変更できません" },
      { status: 403 },
    );
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { bio, skills, techInterests, isOnboardingComplete, name } = body;
    if (
      (name !== undefined && (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 60)) ||
      (bio !== undefined && (typeof bio !== "string" || bio.length > 500)) ||
      (skills !== undefined && (!Array.isArray(skills) || skills.length > 30 || skills.some((item) => typeof item !== "string" || item.length > 50))) ||
      (techInterests !== undefined && (!Array.isArray(techInterests) || techInterests.length > 30 || techInterests.some((item) => typeof item !== "string" || item.length > 50))) ||
      (isOnboardingComplete !== undefined && typeof isOnboardingComplete !== "boolean")
    ) {
      return NextResponse.json({ error: "プロフィールの入力内容が不正です" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        ...(typeof name === "string" && { name: name.trim() }),
        ...(typeof bio === "string" && { bio: bio.trim() }),
        ...(Array.isArray(skills) && { skills: [...new Set(skills as string[])] }),
        ...(Array.isArray(techInterests) && { techInterests: [...new Set(techInterests as string[])] }),
        ...(typeof isOnboardingComplete === "boolean" && { isOnboardingComplete }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "プロフィール更新に失敗しました" }, { status: 500 });
  }
};
