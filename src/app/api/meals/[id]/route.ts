import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  rating: z.number().optional(),
  isVegetarian: z.boolean().optional(),
  budget: z.enum(["CHEAP", "NORMAL", "SPLURGE"]).optional(),
}).partial();

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meal = await prisma.meal.findUnique({ where: { id }, include: { recipe: true } });
  if (!meal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(meal);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data = UpdateSchema.parse(body);
  const meal = await prisma.meal.update({ where: { id }, data, include: { recipe: true } });
  return NextResponse.json(meal);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.meal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
