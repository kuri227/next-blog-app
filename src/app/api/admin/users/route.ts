import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminDbUser } from "@/lib/auth";

export const GET = async (req: NextRequest) => {
  const admin = await getAdminDbUser(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      githubUrl: true,
      role: true,
      createdAt: true,
      _count: { select: { posts: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
};
