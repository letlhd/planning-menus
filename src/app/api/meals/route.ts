import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const MealSchema = z.object({
  name: z.string().min(1),
  category: z.string().default("OTHER"),
  tags: z.array(z.string()).default([]),
  prepTime: z.number().int().min(0).default(0),
  cookTime: z.number().int().min(0).default(0),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("EASY"),
  budget: z.enum(["CHEAP", "NORMAL", "SPLURGE"]).default("NORMAL"),
  servings: z.number().int().default(4),
  foodMode: z.enum(["VEGETARIAN", "MEAT", "FISH", "FESTIVE", "RECEPTION"]).default("MEAT"),
  foodModes: z.array(z.enum(["VEGETARIAN", "MEAT", "FISH", "FESTIVE", "RECEPTION"])).default([]),
  mealTypes: z.array(z.enum(["LUNCH", "DINNER"])).default(["DINNER"]),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isFish: z.boolean().default(false),
  canPrepAhead: z.boolean().default(false),
  season: z.array(z.string()).default(["ALL_YEAR"]),
  ingredients: z.array(z.object({ name: z.string(), quantity: z.number(), unit: z.string() })).default([]),
  estimatedCost: z.number().optional(),
  isCustom: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const vegetarian = searchParams.get("vegetarian") === "true";

  const meals = await prisma.meal.findMany({
    where: {
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(vegetarian ? { OR: [{ foodMode: "VEGETARIAN" }, { isVegetarian: true }, { isVegan: true }] } : {}),
    },
    include: { recipe: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(meals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = MealSchema.parse(body);

  const meal = await prisma.meal.create({
    data: { ...data, category: data.category as never, season: data.season as never },
    include: { recipe: true },
  });

  return NextResponse.json(meal, { status: 201 });
}
