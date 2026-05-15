import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── 1. Ajouter recettes manquantes + fixer catégorie/flags ───────
  const missing = [
    {
      name: "Omelette légumes",
      category: "VEGETARIAN" as const,
      isVegetarian: true,
      isFish: false,
      recipe: {
        intro: "Une omelette généreuse garnie de légumes du frigo — rapide, simple, toujours bon.",
        steps: [
          { stepNumber: 1, description: "Battre 4-6 œufs avec sel, poivre, une pincée d'herbes de Provence.", duration: 2 },
          { stepNumber: 2, description: "Faire revenir les légumes coupés (courgette, poivron, oignon…) 5 min à l'huile d'olive.", duration: 5 },
          { stepNumber: 3, description: "Verser les œufs battus sur les légumes. Cuire à feu moyen jusqu'à prise, puis plier.", duration: 8 },
        ],
        tips: ["Ajouter du fromage râpé avant de plier", "Servir avec une salade verte"],
        variations: ["Omelette champignons-chèvre", "Omelette épinards-ricotta", "Version tortilla espagnole avec pommes de terre"],
      },
    },
    {
      name: "Poulet + legumes",
      category: "MEAT" as const,
      isVegetarian: false,
      isFish: false,
      recipe: {
        intro: "Poulet rôti accompagné de légumes de saison au four — plat complet et sans prise de tête.",
        steps: [
          { stepNumber: 1, description: "Préchauffer le four à 200°C. Couper les légumes (carottes, courgettes, pommes de terre) en morceaux.", duration: 10 },
          { stepNumber: 2, description: "Disposer les morceaux de poulet et les légumes dans un plat. Huiler, saler, poivrer, herbes de Provence.", duration: 5 },
          { stepNumber: 3, description: "Enfourner 35-40 min en retournant à mi-cuisson.", duration: 40 },
        ],
        tips: ["Mariner le poulet la veille dans citron + ail + huile d'olive", "Vérifier la cuisson : le jus doit être clair"],
        variations: ["Version curry", "Avec des olives et tomates", "Cuisses de poulet à la moutarde"],
      },
    },
    {
      name: "Filet mignon legumes",
      category: "MEAT" as const,
      isVegetarian: false,
      isFish: false,
      recipe: {
        intro: "Filet mignon de porc tendre avec légumes de saison — élégant et simple à la fois.",
        steps: [
          { stepNumber: 1, description: "Saisir le filet mignon dans une cocotte avec beurre + huile, 2 min sur chaque face.", duration: 5 },
          { stepNumber: 2, description: "Ajouter les légumes coupés (carottes, champignons, oignons). Mouiller avec un peu de bouillon. Couvrir.", duration: 5 },
          { stepNumber: 3, description: "Cuire à feu doux 25-30 min à couvert. Vérifier la cuisson (intérieur rosé).", duration: 30 },
        ],
        tips: ["Ne pas trop cuire pour garder la tendreté", "Lier la sauce avec de la crème fraîche en fin de cuisson"],
        variations: ["En croûte de moutarde", "Avec champignons et crème", "À la normande (pommes, calvados)"],
      },
    },
    {
      name: "Truite fumée et salade",
      category: "FISH" as const,
      isVegetarian: false,
      isFish: true,
      recipe: {
        intro: "Assiette fraîche de truite fumée avec salade composée — zéro cuisson, prêt en 10 minutes.",
        steps: [
          { stepNumber: 1, description: "Préparer la salade : roquette ou mélange de feuilles, tomates cerises, avocat tranché.", duration: 5 },
          { stepNumber: 2, description: "Disposer les tranches de truite fumée sur la salade. Ajouter câpres et oignon rouge émincé.", duration: 3 },
          { stepNumber: 3, description: "Assaisonner : huile d'olive, citron, sel, poivre. Servir avec pain grillé.", duration: 2 },
        ],
        tips: ["Servir bien frais", "Un peu de crème fraîche à l'aneth complète parfaitement"],
        variations: ["Avec blinis et crème citronnée", "Salade au pamplemousse", "En tartelette"],
      },
    },
  ];

  for (const m of missing) {
    const { recipe, ...fields } = m;
    const meal = await prisma.meal.findFirst({ where: { name: m.name } });
    if (!meal) { console.log("Not found:", m.name); continue; }

    // Update category + flags
    await prisma.meal.update({
      where: { id: meal.id },
      data: { category: fields.category, isVegetarian: fields.isVegetarian, isFish: fields.isFish },
    });

    // Upsert recipe
    const existingRecipe = await prisma.recipe.findUnique({ where: { mealId: meal.id } });
    if (!existingRecipe) {
      await prisma.recipe.create({
        data: {
          mealId: meal.id,
          intro: recipe.intro,
          steps: recipe.steps,
          tips: recipe.tips,
          variations: recipe.variations,
          generatedByAI: false,
        },
      });
      console.log("✓ Recipe added:", m.name);
    } else {
      console.log("↳ Recipe already exists:", m.name);
    }
  }

  // ─── 2. Sync foodModes[] pour tous les repas où c'est vide ────────
  const all = await prisma.meal.findMany();
  let synced = 0;
  for (const meal of all) {
    if (!meal.foodModes || meal.foodModes.length === 0) {
      await prisma.meal.update({
        where: { id: meal.id },
        data: { foodModes: [meal.foodMode] },
      });
      synced++;
    }
  }
  console.log(`✓ Synced foodModes for ${synced} meals`);

  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
