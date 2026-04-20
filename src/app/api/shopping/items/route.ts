import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  listId: z.string(),
  name: z.string().min(1),
  quantity: z.number().default(1),
  unit: z.string().default(""),
  aisle: z.enum(["PRODUCE", "MEAT_FISH", "DAIRY", "GROCERY", "FROZEN", "OTHER"]).default("OTHER"),
  isManual: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = Schema.parse(body);
  const item = await prisma.shoppingItem.create({ data });
  return NextResponse.json(item, { status: 201 });
}
