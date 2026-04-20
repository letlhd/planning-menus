import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addDays, startOfWeek } from "date-fns";

const CreateSchema = z.object({
  mealId: z.string(),
  date: z.string(),
  mealType: z.enum(["LUNCH", "DINNER"]),
  servings: z.number().int().default(4),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekStartStr = searchParams.get("weekStart");

  const weekStart = weekStartStr
    ? new Date(weekStartStr)
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  const weekEnd = addDays(weekStart, 7);

  const meals = await prisma.plannedMeal.findMany({
    where: {
      date: { gte: weekStart, lt: weekEnd },
    },
    include: { meal: { include: { recipe: true } } },
    orderBy: [{ date: "asc" }, { mealType: "asc" }],
  });

  return NextResponse.json(meals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = CreateSchema.parse(body);

  const planned = await prisma.plannedMeal.upsert({
    where: { date_mealType: { date: new Date(data.date), mealType: data.mealType } },
    update: { mealId: data.mealId, servings: data.servings },
    create: {
      mealId: data.mealId,
      date: new Date(data.date),
      mealType: data.mealType,
      servings: data.servings,
    },
    include: { meal: { include: { recipe: true } } },
  });

  return NextResponse.json(planned, { status: 201 });
}
