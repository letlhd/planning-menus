import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateMealSuggestions } from "@/lib/claude";

const Schema = z.object({
  mealName: z.string(),
  reason: z.string().optional(),
  exclude: z.array(z.string()).default([]),
});

function reasonToParams(reason?: string): { foodMode: string; seasonPref: string; budget: string } {
  if (!reason) return { foodMode: "MEAT", seasonPref: "ALL_YEAR", budget: "NORMAL" };
  if (reason.includes("fun") || reason.includes("Festif")) return { foodMode: "FESTIVE", seasonPref: "ALL_YEAR", budget: "NORMAL" };
  if (reason.includes("léger") || reason.includes("Léger")) return { foodMode: "VEGETARIAN", seasonPref: "ALL_YEAR", budget: "NORMAL" };
  if (reason.includes("cher") || reason.includes("Moins cher")) return { foodMode: "MEAT", seasonPref: "ALL_YEAR", budget: "CHEAP" };
  if (reason.includes("Végétarien")) return { foodMode: "VEGETARIAN", seasonPref: "ALL_YEAR", budget: "NORMAL" };
  if (reason.includes("Poisson")) return { foodMode: "FISH", seasonPref: "ALL_YEAR", budget: "NORMAL" };
  return { foodMode: "MEAT", seasonPref: "ALL_YEAR", budget: "NORMAL" };
}

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
    const params = reasonToParams(reason);
    const [suggestion] = await generateMealSuggestions({
      count: 1,
      adults: 2,
      children: 0,
      foodMode: params.foodMode,
      seasonPref: params.seasonPref,
      budget: params.budget,
      exclude: [...exclude, mealName],
    });
    return NextResponse.json(suggestion);
  }

  return NextResponse.json({ error: "No replacement found" }, { status: 404 });
}
