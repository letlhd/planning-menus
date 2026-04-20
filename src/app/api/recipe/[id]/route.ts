import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRecipe } from "@/lib/claude";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const meal = await prisma.meal.findUnique({
    where: { id },
    include: { recipe: true },
  });

  if (!meal) return NextResponse.json({ error: "Meal not found" }, { status: 404 });

  // Cache hit
  if (meal.recipe) {
    return NextResponse.json(meal.recipe);
  }

  // Vérifier le cache global
  const cached = await prisma.recipeCache.findUnique({ where: { name: meal.name } });
  if (cached) {
    const recipe = await prisma.recipe.create({
      data: {
        mealId: id,
        intro: (cached.data as { intro?: string }).intro ?? "",
        steps: (cached.data as { steps?: object[] }).steps ?? [],
        tips: (cached.data as { tips?: string[] }).tips ?? [],
        variations: (cached.data as { variations?: string[] }).variations ?? [],
        generatedByAI: true,
      },
    });
    return NextResponse.json(recipe);
  }

  // Générer via Claude
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }

  const generated = await generateRecipe(meal.name, meal.servings) as {
    intro: string;
    steps: object[];
    tips: string[];
    variations: string[];
    nutritionEstimate?: object;
    tokenCost?: number;
  };

  const recipe = await prisma.recipe.create({
    data: {
      mealId: id,
      intro: generated.intro,
      steps: generated.steps,
      tips: generated.tips,
      variations: generated.variations,
      nutritionEstimate: generated.nutritionEstimate ?? null,
      generatedByAI: true,
      tokenCost: generated.tokenCost,
    },
  });

  // Stocker dans le cache global
  await prisma.recipeCache.upsert({
    where: { name: meal.name },
    update: { data: generated },
    create: { name: meal.name, data: generated, source: "claude" },
  });

  return NextResponse.json(recipe);
}
