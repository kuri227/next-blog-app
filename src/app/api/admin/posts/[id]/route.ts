import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getAdminDbUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

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

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  const dbUser = await getAdminDbUser(req.headers.get("Authorization"));
  if (!dbUser) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  try {
    const { id } = await routeParams.params;

    // 投稿の存在確認と権限チェック
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
    }
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
      throw new Error("指定されたカテゴリが存在しません");
    }

    await prisma.postCategory.deleteMany({ where: { postId: id } });

    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        coverImageKey: coverImageKey ?? null,
        postType,
        repoUrl: repoUrl ?? null,
        demoUrl: demoUrl ?? null,
        published,
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
      { error: "投稿記事の変更に失敗しました" },
      { status: 500 },
    );
  }
};

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  const dbUser = await getAdminDbUser(req.headers.get("Authorization"));
  if (!dbUser) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  try {
    const { id } = await routeParams.params;

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
    }
    const post = await prisma.post.delete({ where: { id } });
    return NextResponse.json({ msg: `「${post.title}」を削除しました。` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の削除に失敗しました" },
      { status: 500 },
    );
  }
};
