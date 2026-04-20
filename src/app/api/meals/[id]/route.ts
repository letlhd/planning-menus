import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  foodMode: z.enum(["VEGETARIAN", "MEAT", "FISH", "FESTIVE", "RECEPTION"]).optional(),
  foodModes: z.array(z.enum(["VEGETARIAN", "MEAT", "FISH", "FESTIVE", "RECEPTION"])).optional(),
  mealTypes: z.array(z.enum(["LUNCH", "DINNER"])).optional(),
  budget: z.enum(["CHEAP", "NORMAL", "SPLURGE"]).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  prepTime: z.number().int().min(0).optional(),
  cookTime: z.number().int().min(0).optional(),
  servings: z.number().int().min(1).optional(),
  canPrepAhead: z.boolean().optional(),
  season: z.array(z.string()).optional(),
  rating: z.number().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isFish: z.boolean().optional(),
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
  const meal = await prisma.meal.update({
    where: { id },
    data: data as never,
    include: { recipe: true },
  });
  return NextResponse.json(meal);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.meal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
