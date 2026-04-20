import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const UpdateSchema = z.object({
  mealId: z.string().optional(),
  status: z.enum(["PLANNED", "VALIDATED", "COOKED", "SKIPPED"]).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
}).partial();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data = UpdateSchema.parse(body);

  const planned = await prisma.plannedMeal.update({
    where: { id },
    data,
    include: { meal: true },
  });

  // Si rating → mettre à jour le score moyen du repas
  if (data.rating) {
    const allRatings = await prisma.plannedMeal.findMany({
      where: { mealId: planned.mealId, rating: { not: null } },
      select: { rating: true },
    });
    const avg = allRatings.reduce((s, r) => s + (r.rating ?? 0), 0) / allRatings.length;
    await prisma.meal.update({
      where: { id: planned.mealId },
      data: { rating: avg, ratingCount: allRatings.length },
    });
  }

  return NextResponse.json(planned);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.plannedMeal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
