import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        coverImageURL: true, // ◀ 追加：DB内の画像URLを取得
        createdAt: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の一覧の取得に失敗しました" },
      { status: 500 },
    );
  }
};
