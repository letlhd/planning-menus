import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SettingsSchema = z.object({
  adultsCount: z.number().int().min(1).max(20).optional(),
  childrenCount: z.number().int().min(0).max(10).optional(),
  defaultMealType: z.enum(["LUNCH", "DINNER"]).optional(),
  defaultBudget: z.enum(["CHEAP", "NORMAL", "SPLURGE"]).optional(),
  defaultFoodModes: z.array(z.enum(["VEGETARIAN", "MEAT", "FISH", "FESTIVE", "RECEPTION"])).optional(),
  defaultDinnerFoodModes: z.array(z.enum(["VEGETARIAN", "MEAT", "FISH", "FESTIVE", "RECEPTION"])).optional(),
  festiveDays: z.array(z.number().int().min(0).max(6)).optional(),
  noLunchDays: z.array(z.number().int().min(0).max(6)).optional(),
  maxPrepTime: z.number().int().optional().nullable(),
  dbRatio: z.number().min(0).max(1).optional(),
  weeklyBudgetGoal: z.number().optional().nullable(),
}).partial();

const DEFAULT_SETTINGS = {
  id: "singleton",
  adultsCount: 2,
  childrenCount: 2,
  defaultDays: [1, 2, 3, 4, 5, 6, 0],
  defaultMealType: "DINNER" as const,
  defaultBudget: "NORMAL" as const,
  defaultFoodModes: ["MEAT"],
  defaultDinnerFoodModes: ["VEGETARIAN"],
  festiveDays: [5, 6, 0],
  noLunchDays: [1, 2, 4, 5],
  maxPrepTime: null,
  dbRatio: 0.7,
  weeklyBudgetGoal: null,
};

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: "singleton" } });

    if (!settings) {
      settings = await prisma.settings.create({ data: DEFAULT_SETTINGS });
    }

    return NextResponse.json(settings);
  } catch (e) {
    console.error("[GET /api/settings] Erreur Prisma — fallback sur defaults :", e);
    // Fallback : renvoie les valeurs par défaut pour que la page puisse s'afficher
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data = SettingsSchema.parse(body);

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { ...DEFAULT_SETTINGS, ...data },
    });

    return NextResponse.json(settings);
  } catch (e) {
    console.error("[PUT /api/settings] Erreur Prisma :", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
