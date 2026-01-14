import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        // _countを使用してリレーション先の記事数を取得
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリ一覧の取得に失敗しました" },
      { status: 500 },
    );
  }
};
