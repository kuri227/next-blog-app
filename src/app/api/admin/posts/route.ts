import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

type RequestBody = {
  title: string;
  content: string;
  coverImageKey?: string;
  categoryIds: string[];
  postType: "PROJECT" | "KNOWLEDGE";
  repoUrl?: string;
  demoUrl?: string;
  published: boolean;
};

// 認証ユーザーの DB User を取得するヘルパー
const getDbUser = async (authHeader: string) => {
  const { data, error } = await supabase.auth.getUser(authHeader);
  if (error || !data.user) return null;
  return prisma.user.findUnique({ where: { supabaseId: data.user.id } });
};

export const POST = async (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const dbUser = await getDbUser(authHeader);
  if (!dbUser) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  try {
    const requestBody: RequestBody = await req.json();
    const {
      title,
      content,
      coverImageKey,
      categoryIds,
      postType,
      repoUrl,
      demoUrl,
      published,
    } = requestBody;

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "指定されたカテゴリのいくつかが存在しません" },
        { status: 400 },
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        coverImageKey: coverImageKey ?? null,
        postType,
        repoUrl: repoUrl ?? null,
        demoUrl: demoUrl ?? null,
        published,
        authorId: dbUser.id,
      },
    });

    for (const categoryId of categoryIds) {
      await prisma.postCategory.create({
        data: { postId: post.id, categoryId },
      });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の作成に失敗しました" },
      { status: 500 },
    );
  }
};
