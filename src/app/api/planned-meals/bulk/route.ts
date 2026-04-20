import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addDays, startOfWeek } from "date-fns";

const BulkSchema = z.object({
  meals: z.array(z.object({
    name: z.string(),
    date: z.string().optional(),
    mealType: z.enum(["LUNCH", "DINNER"]).optional(),
  })),
  mealType: z.enum(["LUNCH", "DINNER"]).default("DINNER"),
  weekStart: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { meals, mealType, weekStart } = BulkSchema.parse(body);

  const start = weekStart ? new Date(weekStart) : startOfWeek(new Date(), { weekStartsOn: 1 });

  const results = [];

  for (let i = 0; i < meals.length; i++) {
    const mealData = meals[i];
    const date = mealData.date ? new Date(mealData.date) : addDays(start, i);
    const type = mealData.mealType ?? mealType;

    // Trouver ou créer le meal en BDD
    let meal = await prisma.meal.findFirst({
      where: { name: { equals: mealData.name, mode: "insensitive" } },
    });

    if (!meal) {
      meal = await prisma.meal.create({
        data: {
          name: mealData.name,
          category: "OTHER",
          prepTime: 30,
          cookTime: 30,
          difficulty: "MEDIUM",
          budget: "NORMAL",
          ingredients: [],
          isCustom: true,
        },
      });
    }

    // Mettre à jour usageScore
    await prisma.meal.update({
      where: { id: meal.id },
      data: { usageScore: { increment: 10 }, lastUsedAt: new Date() },
    });

    const planned = await prisma.plannedMeal.upsert({
      where: { date_mealType: { date, mealType: type } },
      update: { mealId: meal.id },
      create: { mealId: meal.id, date, mealType: type },
      include: { meal: true },
    });

    results.push(planned);
  }

  return NextResponse.json(results, { status: 201 });
}
