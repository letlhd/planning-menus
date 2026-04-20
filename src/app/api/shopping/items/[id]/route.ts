import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const UpdateSchema = z.object({
  isChecked: z.boolean().optional(),
  quantity: z.number().optional(),
}).partial();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data = UpdateSchema.parse(body);
  const item = await prisma.shoppingItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.shoppingItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
