import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateMealSuggestions } from "@/lib/claude";

const SlotSchema = z.object({
  adults: z.number().int().min(1),
  children: z.number().int().min(0).default(0),
  foodMode: z.enum(["VEGETARIAN", "MEAT", "FISH", "FESTIVE", "RECEPTION"]).default("MEAT"),
  seasonPref: z.enum(["SUMMER", "WINTER", "ALL_YEAR"]).default("ALL_YEAR"),
  budget: z.enum(["CHEAP", "NORMAL", "SPLURGE"]).default("NORMAL"),
  mealType: z.enum(["LUNCH", "DINNER"]).default("DINNER"),
  exclude: z.array(z.string()).default([]),
});

function currentSeasonPref(): "SUMMER" | "WINTER" {
  const month = new Date().getMonth(); // 0-11
  return month >= 3 && month <= 8 ? "SUMMER" : "WINTER";
}

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

  // Filtre foodMode — cherche dans foodModes[] ET foodMode (compat)
  const foodModeFilter =
    params.foodMode === "VEGETARIAN"
      ? { OR: [{ foodModes: { has: "VEGETARIAN" as const } }, { foodMode: "VEGETARIAN" as const }, { isVegetarian: true }, { isVegan: true }] }
      : params.foodMode === "FISH"
      ? { OR: [{ foodModes: { has: "FISH" as const } }, { foodMode: "FISH" as const }, { isFish: true }] }
      : params.foodMode === "FESTIVE"
      ? { OR: [{ foodModes: { has: "FESTIVE" as const } }, { foodMode: "FESTIVE" as const }] }
      : params.foodMode === "RECEPTION"
      ? { OR: [{ foodModes: { has: "RECEPTION" as const } }, { foodMode: "RECEPTION" as const }] }
      : {}; // MEAT : pas de filtre spécifique

  // Filtre saison — ALL_YEAR = pas de filtre
  const seasonFilter =
    params.seasonPref === "ALL_YEAR"
      ? {}
      : params.seasonPref === "SUMMER"
      ? { season: { hasSome: ["SUMMER", "SPRING", "ALL_YEAR"] as never[] } }
      : { season: { hasSome: ["WINTER", "AUTUMN", "ALL_YEAR"] as never[] } };

  // Budget cascade: CHEAP=seulement CHEAP, NORMAL=CHEAP+NORMAL, SPLURGE=tout
  const budgetFilter =
    params.budget === "CHEAP"
      ? { budget: "CHEAP" as const }
      : params.budget === "NORMAL"
      ? { budget: { in: ["CHEAP" as const, "NORMAL" as const] } }
      : {};

  // ─── Nouvelle logique isFamiliar ─────────────────────────────────
  // dbRatio = probabilité de choisir un repas familier (connu)
  // 1 - dbRatio = probabilité de choisir une recette élaborée / nouvelle
  const useFamiliar = Math.random() < dbRatio;
  const baseFilter = { ...foodModeFilter, ...seasonFilter, ...budgetFilter, name: { notIn: excludeNames } };

  function pickRandom<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 1. Essayer les repas familiers (BDD connue)
  if (useFamiliar) {
    const meals = await prisma.meal.findMany({
      where: { ...baseFilter, isFamiliar: true },
      include: { recipe: true },
    });
    const meal = pickRandom(meals);
    if (meal) return NextResponse.json(meal);
  }

  // 2. Essayer les recettes élaborées en BDD (blogs)
  const novelMeals = await prisma.meal.findMany({
    where: { ...baseFilter, isFamiliar: false },
    include: { recipe: true },
  });
  const novelMeal = pickRandom(novelMeals);
  if (novelMeal) return NextResponse.json(novelMeal);

  // 3. Générer avec Claude (vraiment nouveau)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const [meal] = await generateMealSuggestions({
        count: 1,
        adults: params.adults,
        children: params.children,
        foodMode: params.foodMode,
        seasonPref: params.seasonPref === "ALL_YEAR" ? currentSeasonPref() : params.seasonPref,
        budget: params.budget,
        exclude: excludeNames,
      });
      return NextResponse.json(meal);
    } catch {
      // ignore, fallback BDD sans filtre
    }
  }

  // 4. Fallback ultime : n'importe quel repas en BDD
  const fallbacks = await prisma.meal.findMany({
    where: { name: { notIn: excludeNames } },
    include: { recipe: true },
  });
  const fallback = pickRandom(fallbacks);

  if (fallback) return NextResponse.json(fallback);
  return NextResponse.json({ error: "No meal found" }, { status: 404 });
}
