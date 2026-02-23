import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Category } from "@/generated/prisma/client";
import { supabase } from "@/utils/supabase";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

type RequestBody = {
  name: string;
};

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  // 認証チェック
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  try {
    const { id } = await routeParams.params;
    const category: Category = await prisma.category.delete({ where: { id } });
    return NextResponse.json({ msg: `「${category.name}」を削除しました。` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの削除に失敗しました" },
      { status: 500 },
    );
  }
};

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  // 認証チェック
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  try {
    const { id } = await routeParams.params;
    const { name }: RequestBody = await req.json();
    const category: Category = await prisma.category.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの名前変更に失敗しました" },
      { status: 500 },
    );
  }
};
