import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminDbUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export const PATCH = async (req: NextRequest, routeParams: RouteParams) => {
  const admin = await getAdminDbUser(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const { id } = await routeParams.params;
  if (id === admin.id) {
    return NextResponse.json({ error: "自分自身の管理者権限は変更できません" }, { status: 400 });
  }
  const body = (await req.json()) as { role?: unknown };
  if (body.role !== "ADMIN" && body.role !== "USER") {
    return NextResponse.json({ error: "指定できない権限です" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: body.role },
    select: { id: true, role: true },
  });
  return NextResponse.json(user);
};
