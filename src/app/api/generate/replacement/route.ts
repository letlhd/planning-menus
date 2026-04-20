import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateMealSuggestions } from "@/lib/claude";

const Schema = z.object({
  mealName: z.string(),
  reason: z.string().optional(),
  exclude: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mealName, reason, exclude } = Schema.parse(body);

  // Essayer d'abord en BDD
  const dbMeal = await prisma.meal.findFirst({
    where: { name: { notIn: [...exclude, mealName] } },
    include: { recipe: true },
    orderBy: { usageScore: "asc" },
  });

  if (dbMeal) {
    return NextResponse.json(dbMeal);
  }

  // Sinon via Claude
  if (process.env.ANTHROPIC_API_KEY) {
    const [suggestion] = await generateMealSuggestions({
      count: 1,
      adults: 2,
      children: 0,
      ambiance: reason === "Plus fun" ? "FUN" : reason === "Trop long" ? "LIGHT" : "BALANCED",
      budget: reason === "Budget" ? "CHEAP" : "NORMAL",
      vegetarian: reason === "Pas végé",
      exclude: [...exclude, mealName],
    });
    return NextResponse.json(suggestion);
  }

  return NextResponse.json({ error: "No replacement found" }, { status: 404 });
}
