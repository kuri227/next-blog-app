import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDbUser, getMutableDbUser } from "@/lib/auth";
import { parsePostInput } from "@/lib/post-input";

type RouteParams = { params: Promise<{ id: string }> };

const postSelect = {
  id: true,
  title: true,
  content: true,
  postType: true,
  repoUrl: true,
  demoUrl: true,
  coverImageKey: true,
  published: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      githubUrl: true,
    },
  },
  categories: {
    select: { category: { select: { id: true, name: true } } },
  },
  _count: { select: { likes: true, comments: true } },
} as const;

export const GET = async (req: NextRequest, routeParams: RouteParams) => {
  const { id } = await routeParams.params;
  const post = await prisma.post.findUnique({ where: { id }, select: postSelect });
  if (!post) {
    return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
  }

  if (!post.published) {
    const user = await getAuthenticatedDbUser(req.headers.get("Authorization"));
    if (!user || (user.id !== post.authorId && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
    }
  }

  return NextResponse.json(post);
};

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  const user = await getMutableDbUser(req.headers.get("Authorization"));
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id } = await routeParams.params;
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
  }
  if (existing.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "この投稿を編集する権限がありません" }, { status: 403 });
  }

  try {
    const input = parsePostInput(await req.json());
    const categories = await prisma.category.count({
      where: { id: { in: input.categoryIds } },
    });
    if (categories !== input.categoryIds.length) {
      return NextResponse.json({ error: "存在しないカテゴリーが含まれています" }, { status: 400 });
    }

    const post = await prisma.$transaction(async (tx) => {
      await tx.postCategory.deleteMany({ where: { postId: id } });
      if (input.categoryIds.length) {
        await tx.postCategory.createMany({
          data: input.categoryIds.map((categoryId) => ({ postId: id, categoryId })),
        });
      }
      return tx.post.update({
        where: { id },
        data: {
          title: input.title,
          content: input.content,
          postType: input.postType,
          repoUrl: input.repoUrl,
          demoUrl: input.demoUrl,
          coverImageKey: input.coverImageKey,
          published: input.published,
        },
      });
    });
    return NextResponse.json(post);
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  const user = await getMutableDbUser(req.headers.get("Authorization"));
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id } = await routeParams.params;
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
  }
  if (existing.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "この投稿を削除する権限がありません" }, { status: 403 });
  }
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
};
