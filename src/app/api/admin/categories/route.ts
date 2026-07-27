import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Category } from "@/generated/prisma/client";
import { getAdminDbUser } from "@/lib/auth";

type RequestBody = {
  name: string;
};

export const POST = async (req: NextRequest) => {
  const admin = await getAdminDbUser(req.headers.get("Authorization"));
  if (!admin) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  try {
    const { name }: RequestBody = await req.json();
    const normalizedName = typeof name === "string" ? name.trim() : "";
    if (normalizedName.length < 1 || normalizedName.length > 50) {
      return NextResponse.json({ error: "カテゴリー名は1〜50文字で入力してください" }, { status: 400 });
    }
    const category: Category = await prisma.category.create({
      data: {
        name: normalizedName,
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの作成に失敗しました" },
      { status: 500 },
    );
  }
};
