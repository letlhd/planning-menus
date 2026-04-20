import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateMealSuggestions } from "@/lib/claude";

const GenerateSchema = z.object({
  adults: z.number().int().min(1),
  children: z.number().int().min(0).default(0),
  ambiance: z.enum(["LIGHT", "FUN", "BALANCED"]).default("BALANCED"),
  budget: z.enum(["CHEAP", "NORMAL", "SPLURGE"]).default("NORMAL"),
  vegetarian: z.boolean().default(false),
  days: z.number().int().min(1).max(7).default(7),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const params = GenerateSchema.parse(body);

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const dbRatio = settings?.dbRatio ?? 0.7;

  // Repas récemment utilisés à exclure
  const recentMeals = await prisma.plannedMeal.findMany({
    where: { date: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
    select: { meal: { select: { name: true } } },
  });
  const excludeNames = recentMeals.map((pm) => pm.meal.name);

  const dbCount = Math.round(params.days * dbRatio);
  const claudeCount = params.days - dbCount;

  // === Repas depuis la BDD ===
  const dbMeals = await prisma.meal.findMany({
    where: {
      ...(params.vegetarian ? { OR: [{ isVegetarian: true }, { isVegan: true }] } : {}),
      ...(params.budget === "CHEAP" ? { budget: "CHEAP" } : {}),
      ...(params.budget === "SPLURGE" ? { budget: { in: ["NORMAL", "SPLURGE"] } } : {}),
      name: { notIn: excludeNames },
    },
    include: { recipe: true },
    orderBy: { usageScore: "asc" },
    take: dbCount * 3,
  });

  // Sélection aléatoire pondérée parmi les résultats BDD
  const shuffled = dbMeals.sort(() => Math.random() - 0.5).slice(0, dbCount);

  // === Repas depuis Claude ===
  let claudeMeals: object[] = [];
  if (claudeCount > 0 && process.env.ANTHROPIC_API_KEY) {
    try {
      claudeMeals = await generateMealSuggestions({
        count: claudeCount,
        adults: params.adults,
        children: params.children,
        ambiance: params.ambiance,
        budget: params.budget,
        vegetarian: params.vegetarian,
        exclude: [...excludeNames, ...shuffled.map((m) => m.name)],
      });
    } catch {
      // fallback to more BDD meals
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
