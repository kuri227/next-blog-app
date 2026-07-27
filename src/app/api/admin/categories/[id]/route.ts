import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Category } from "@/generated/prisma/client";
import { getAdminDbUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

type RequestBody = {
  name: string;
};

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  const admin = await getAdminDbUser(req.headers.get("Authorization"));
  if (!admin) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
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
  const admin = await getAdminDbUser(req.headers.get("Authorization"));
  if (!admin) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  try {
    const { id } = await routeParams.params;
    const { name }: RequestBody = await req.json();
    const normalizedName = typeof name === "string" ? name.trim() : "";
    if (normalizedName.length < 1 || normalizedName.length > 50) {
      return NextResponse.json({ error: "カテゴリー名は1〜50文字で入力してください" }, { status: 400 });
    }
    const category: Category = await prisma.category.update({
      where: { id },
      data: { name: normalizedName },
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
