import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateMealSuggestions } from "@/lib/claude";

const GenerateSchema = z.object({
  adults: z.number().int().min(1),
  children: z.number().int().min(0).default(0),
  foodMode: z.enum(["VEGETARIAN", "MEAT", "FISH", "FESTIVE"]).default("MEAT"),
  seasonPref: z.enum(["SUMMER", "WINTER", "ALL_YEAR"]).default("ALL_YEAR"),
  budget: z.enum(["CHEAP", "NORMAL", "SPLURGE"]).default("NORMAL"),
  days: z.number().int().min(1).max(7).default(7),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const params = GenerateSchema.parse(body);

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const dbRatio = settings?.dbRatio ?? 0.7;

  const recentMeals = await prisma.plannedMeal.findMany({
    where: { date: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
    select: { meal: { select: { name: true } } },
  });
  const excludeNames = recentMeals.map((pm: { meal: { name: string } }) => pm.meal.name);

  const dbCount = Math.round(params.days * dbRatio);
  const claudeCount = params.days - dbCount;

  const vegetarianFilter =
    params.foodMode === "VEGETARIAN"
      ? { OR: [{ foodMode: "VEGETARIAN" as const }, { isVegetarian: true }, { isVegan: true }] }
      : {};

  const dbMeals = await prisma.meal.findMany({
    where: {
      ...vegetarianFilter,
      ...(params.budget === "CHEAP" ? { budget: "CHEAP" } : {}),
      name: { notIn: excludeNames },
    },
    include: { recipe: true },
    orderBy: { usageScore: "asc" },
    take: dbCount * 3,
  });

  const shuffled = dbMeals.sort(() => Math.random() - 0.5).slice(0, dbCount);

  let claudeMeals: object[] = [];
  if (claudeCount > 0 && process.env.ANTHROPIC_API_KEY) {
    try {
      claudeMeals = await generateMealSuggestions({
        count: claudeCount,
        adults: params.adults,
        children: params.children,
        foodMode: params.foodMode,
        seasonPref: params.seasonPref,
        budget: params.budget,
        exclude: [...excludeNames, ...shuffled.map((m: { name: string }) => m.name)],
      });
    } catch {
      const extra = await prisma.meal.findMany({
        where: { name: { notIn: [...excludeNames, ...shuffled.map((m) => m.name)] } },
        take: claudeCount,
        orderBy: { usageScore: "asc" },
        include: { recipe: true },
      });
      claudeMeals = extra;
    }
  }

  const allMeals = [...shuffled, ...claudeMeals].slice(0, params.days);
  return NextResponse.json({ meals: allMeals, dbCount: shuffled.length, claudeCount: claudeMeals.length });
}
