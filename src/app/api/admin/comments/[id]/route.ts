import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminDbUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  const admin = await getAdminDbUser(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  const { id } = await routeParams.params;
  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
};
