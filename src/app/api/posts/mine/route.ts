import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedDbUser } from "@/lib/auth";

export const GET = async (req: NextRequest) => {
  const user = await getAuthenticatedDbUser(req.headers.get("Authorization"));
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    select: {
      id: true,
      title: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(posts);
};
