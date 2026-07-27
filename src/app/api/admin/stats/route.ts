import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminDbUser } from "@/lib/auth";

export const GET = async (req: NextRequest) => {
  const admin = await getAdminDbUser(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const [users, posts, publishedPosts, comments, categories] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.comment.count(),
    prisma.category.count(),
  ]);
  return NextResponse.json({ users, posts, publishedPosts, comments, categories });
};
