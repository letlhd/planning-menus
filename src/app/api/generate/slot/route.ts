import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateMealSuggestions } from "@/lib/claude";

const SlotSchema = z.object({
  adults: z.number().int().min(1),
  children: z.number().int().min(0).default(0),
  ambiance: z.enum(["LIGHT", "FUN", "BALANCED"]).default("BALANCED"),
  budget: z.enum(["CHEAP", "NORMAL", "SPLURGE"]).default("NORMAL"),
  vegetarian: z.boolean().default(false),
  mealType: z.enum(["LUNCH", "DINNER"]).default("DINNER"),
  exclude: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const params = SlotSchema.parse(body);

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const dbRatio = settings?.dbRatio ?? 0.7;

  const recentMeals = await prisma.plannedMeal.findMany({
    where: { date: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
    select: { meal: { select: { name: true } } },
  });
  const excludeNames = [...new Set([...recentMeals.map((pm) => pm.meal.name), ...params.exclude])];

  const useDB = Math.random() < dbRatio;

  if (useDB) {
    const meal = await prisma.meal.findFirst({
      where: {
        ...(params.vegetarian ? { OR: [{ isVegetarian: true }, { isVegan: true }] } : {}),
        ...(params.budget === "CHEAP" ? { budget: "CHEAP" } : {}),
        ...(params.ambiance === "LIGHT" ? { difficulty: "EASY" } : {}),
        ...(params.ambiance === "FUN" ? { tags: { hasSome: ["fun", "convivial", "enfants"] } } : {}),
        name: { notIn: excludeNames },
      },
      include: { recipe: true },
      orderBy: { usageScore: "asc" },
    });

    if (meal) return NextResponse.json(meal);
  }

  // Fallback Claude
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const [meal] = await generateMealSuggestions({
        count: 1,
        adults: params.adults,
        children: params.children,
        ambiance: params.ambiance,
        budget: params.budget,
        vegetarian: params.vegetarian,
        exclude: excludeNames,
      });
      return NextResponse.json(meal);
    } catch {
      // ignore, fallback BDD sans filtre
    }
  }

  // Fallback ultime
  const fallback = await prisma.meal.findFirst({
    where: { name: { notIn: excludeNames } },
    include: { recipe: true },
    orderBy: { usageScore: "asc" },
  });

  if (fallback) return NextResponse.json(fallback);
  return NextResponse.json({ error: "No meal found" }, { status: 404 });
}
