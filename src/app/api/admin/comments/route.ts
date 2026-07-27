import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminDbUser } from "@/lib/auth";

export const GET = async (req: NextRequest) => {
  const admin = await getAdminDbUser(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const comments = await prisma.comment.findMany({
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
      post: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(comments);
};
