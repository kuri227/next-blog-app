import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getMutableDbUser } from "@/lib/auth";
import { parsePostInput } from "@/lib/post-input";

export const GET = async () => {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        content: true,
        postType: true,
        repoUrl: true,
        demoUrl: true,
        coverImageKey: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        categories: {
          select: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
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

export const POST = async (req: NextRequest) => {
  const user = await getMutableDbUser(req.headers.get("Authorization"));
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  try {
    const input = parsePostInput(await req.json());
    const recentPostCount = await prisma.post.count({
      where: {
        authorId: user.id,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentPostCount >= 10) {
      return NextResponse.json(
        { error: "短時間の投稿上限に達しました。しばらく待ってからお試しください" },
        { status: 429 },
      );
    }
    const categories = await prisma.category.count({
      where: { id: { in: input.categoryIds } },
    });
    if (categories !== input.categoryIds.length) {
      return NextResponse.json({ error: "存在しないカテゴリーが含まれています" }, { status: 400 });
    }

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          title: input.title,
          content: input.content,
          postType: input.postType,
          repoUrl: input.repoUrl,
          demoUrl: input.demoUrl,
          coverImageKey: input.coverImageKey,
          published: input.published,
          authorId: user.id,
        },
      });
      if (input.categoryIds.length) {
        await tx.postCategory.createMany({
          data: input.categoryIds.map((categoryId) => ({
            postId: created.id,
            categoryId,
          })),
        });
      }
      return created;
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "投稿に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};
