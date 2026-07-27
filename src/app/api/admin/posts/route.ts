import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminDbUser } from "@/lib/auth";

export const GET = async (req: NextRequest) => {
  const admin = await getAdminDbUser(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      published: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
      categories: { select: { category: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
};
