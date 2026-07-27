import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

export const POST = async (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) {
    console.error("[sync] Supabase getUser failed:", error?.message);
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const supabaseUser = data.user;
  const meta = supabaseUser.user_metadata;
  const providers = Array.isArray(supabaseUser.app_metadata?.providers)
    ? supabaseUser.app_metadata.providers
    : [supabaseUser.app_metadata?.provider];
  if (!providers.includes("github")) {
    return NextResponse.json(
      { error: "GitHub OAuthでログインしてください" },
      { status: 403 },
    );
  }

  try {
    const user = await prisma.user.upsert({
      where: { supabaseId: supabaseUser.id },
      update: {
        name: meta?.full_name ?? meta?.user_name ?? null,
        avatarUrl: meta?.avatar_url ?? null,
        githubUrl: meta?.user_name
          ? `https://github.com/${meta.user_name}`
          : null,
      },
      create: {
        supabaseId: supabaseUser.id,
        name: meta?.full_name ?? meta?.user_name ?? null,
        avatarUrl: meta?.avatar_url ?? null,
        githubUrl: meta?.user_name
          ? `https://github.com/${meta.user_name}`
          : null,
        isOnboardingComplete: false,
        skills: [],
        techInterests: [],
      },
    });

    return NextResponse.json(user);
  } catch (err: unknown) {
    // 詳細エラーをログ出力
    if (err instanceof Error) {
      console.error("[sync] Prisma error:", err.message);
      console.error("[sync] Error name:", err.name);
      console.error("[sync] Stack:", err.stack?.split("\n").slice(0, 5).join("\n"));
    } else {
      console.error("[sync] Unknown error:", JSON.stringify(err));
    }
    return NextResponse.json(
      { error: "ユーザー同期に失敗しました" },
      { status: 500 },
    );
  }
};
