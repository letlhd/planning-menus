import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");

  const list = await prisma.shoppingList.findFirst({
    where: weekStart ? { weekStart: new Date(weekStart) } : {},
    include: { items: { orderBy: [{ aisle: "asc" }, { name: "asc" }] } },
    orderBy: { createdAt: "desc" },
  });

  if (!list) return NextResponse.json(null);
  return NextResponse.json(list);
}
