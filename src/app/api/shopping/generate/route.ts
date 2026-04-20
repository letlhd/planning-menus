import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

const INGREDIENT_TO_AISLE: Record<string, string> = {
  // Légumes & fruits
  tomate: "PRODUCE", carotte: "PRODUCE", oignon: "PRODUCE", ail: "PRODUCE",
  poivron: "PRODUCE", courgette: "PRODUCE", aubergine: "PRODUCE", pomme: "PRODUCE",
  citron: "PRODUCE", salade: "PRODUCE", épinard: "PRODUCE", champignon: "PRODUCE",
  poireau: "PRODUCE", brocoli: "PRODUCE", chou: "PRODUCE", laitue: "PRODUCE",
  // Viandes & poissons
  poulet: "MEAT_FISH", boeuf: "MEAT_FISH", porc: "MEAT_FISH", veau: "MEAT_FISH",
  saumon: "MEAT_FISH", thon: "MEAT_FISH", crevette: "MEAT_FISH", cabillaud: "MEAT_FISH",
  lardons: "MEAT_FISH", jambon: "MEAT_FISH",
  // Frais
  oeuf: "DAIRY", fromage: "DAIRY", crème: "DAIRY", lait: "DAIRY",
  beurre: "DAIRY", yaourt: "DAIRY", gruyère: "DAIRY", parmesan: "DAIRY",
  mozzarella: "DAIRY", ricotta: "DAIRY",
  // Épicerie
  farine: "GROCERY", sucre: "GROCERY", huile: "GROCERY", vinaigre: "GROCERY",
  pâte: "GROCERY", riz: "GROCERY", lentille: "GROCERY", pois: "GROCERY",
  tomate_concassée: "GROCERY", bouillon: "GROCERY", sauce: "GROCERY",
  // Surgelés
  surgelé: "FROZEN",
};

function guessAisle(ingredientName: string): string {
  const lower = ingredientName.toLowerCase();
  for (const [key, aisle] of Object.entries(INGREDIENT_TO_AISLE)) {
    if (lower.includes(key)) return aisle;
  }
  return "GROCERY";
}

const Schema = z.object({ weekStart: z.string() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { weekStart } = Schema.parse(body);

  const start = new Date(weekStart);
  const end = addDays(start, 7);

  const plannedMeals = await prisma.plannedMeal.findMany({
    where: { date: { gte: start, lt: end } },
    include: { meal: true },
  });

  if (plannedMeals.length === 0) {
    return NextResponse.json({ error: "No meals planned this week" }, { status: 400 });
  }

  // Agrégation des ingrédients
  const aggregated = new Map<string, { quantity: number; unit: string; aisle: string; mealIds: string[] }>();

  for (const pm of plannedMeals) {
    const scale = pm.servings / pm.meal.servings;
    const ingredients = pm.meal.ingredients as { name: string; quantity: number; unit: string }[];

    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}__${ing.unit}`;
      const existing = aggregated.get(key);
      if (existing) {
        existing.quantity += ing.quantity * scale;
        existing.mealIds.push(pm.id);
      } else {
        aggregated.set(key, {
          quantity: ing.quantity * scale,
          unit: ing.unit,
          aisle: guessAisle(ing.name),
          mealIds: [pm.id],
        });
      }
    }
  }

  // Créer ou mettre à jour la liste
  const totalCost = plannedMeals.reduce((s, pm) => s + (pm.meal.estimatedCost ?? 0), 0);

  const list = await prisma.shoppingList.upsert({
    where: { id: `week-${weekStart}` },
    update: { totalCost, updatedAt: new Date() },
    create: { id: `week-${weekStart}`, weekStart: start, totalCost },
  });

  // Supprimer les anciens items générés
  await prisma.shoppingItem.deleteMany({ where: { listId: list.id, isManual: false } });

  // Créer les nouveaux items
  const items = await prisma.shoppingItem.createMany({
    data: Array.from(aggregated.entries()).map(([key, value]) => ({
      listId: list.id,
      name: key.split("__")[0],
      quantity: Math.round(value.quantity * 100) / 100,
      unit: value.unit,
      aisle: value.aisle as never,
    })),
  });

  const fullList = await prisma.shoppingList.findUnique({
    where: { id: list.id },
    include: { items: { orderBy: [{ aisle: "asc" }, { name: "asc" }] } },
  });

  return NextResponse.json(fullList);
}
