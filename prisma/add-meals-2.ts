import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type FM = "VEGETARIAN" | "MEAT" | "FISH" | "FESTIVE" | "RECEPTION";
type Cat = "PASTA" | "RICE_GRAINS" | "SALAD" | "SOUP" | "MEAT" | "FISH" | "VEGETARIAN" | "VEGAN" | "PIZZA_TART" | "STEW" | "STIR_FRY" | "SANDWICH" | "OTHER";
type Bud = "CHEAP" | "NORMAL" | "SPLURGE";
type Diff = "EASY" | "MEDIUM" | "HARD";
type Sea = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" | "ALL_YEAR";
type MT = "LUNCH" | "DINNER";

const meals = [
  {
    name: "Pâtes carbonara",
    category: "PASTA" as Cat, foodMode: "MEAT" as FM, mealTypes: ["DINNER", "LUNCH"] as MT[],
    season: ["ALL_YEAR"] as Sea[], budget: "CHEAP" as Bud, difficulty: "EASY" as Diff,
    prepTime: 5, cookTime: 15, servings: 4, estimatedCost: 5, isFamiliar: true,
    tags: ["rapide", "enfants", "pâtes", "crémeux"],
    ingredients: [
      { name: "spaghetti", quantity: 400, unit: "g" },
      { name: "lardons fumés", quantity: 150, unit: "g" },
      { name: "œufs", quantity: 4, unit: "" },
      { name: "parmesan râpé", quantity: 80, unit: "g" },
      { name: "poivre noir", quantity: 1, unit: "pincée" },
    ],
    recipe: {
      intro: "La vraie carbonara — sans crème ! Juste des œufs, du parmesan, des lardons et des pâtes. Prête en 20 minutes.",
      steps: [
        { stepNumber: 1, description: "Cuire les spaghetti al dente dans une grande casserole d'eau bouillante salée.", duration: 10 },
        { stepNumber: 2, description: "Pendant ce temps, faire revenir les lardons à sec dans une poêle jusqu'à légère dorure. Réserver.", duration: 5 },
        { stepNumber: 3, description: "Dans un bol, battre les œufs avec le parmesan et beaucoup de poivre noir.", duration: 2 },
        { stepNumber: 4, description: "Égoutter les pâtes en gardant une louche d'eau de cuisson. Hors du feu, mélanger pâtes + lardons + mélange œufs-parmesan + eau de cuisson. Remuer vite.", duration: 3 },
      ],
      tips: ["Hors du feu obligatoire pour ne pas cuire les œufs en omelette", "L'eau de cuisson est clé pour la texture crémeuse", "Pas de crème dans la vraie carbonara !"],
      variations: ["Avec guanciale (joue de porc) à la place des lardons", "Carbonara de courgettes (végé)", "Version penne"],
    },
  },
  {
    name: "Wraps poulet-crudités",
    category: "SANDWICH" as Cat, foodMode: "MEAT" as FM, mealTypes: ["LUNCH", "DINNER"] as MT[],
    season: ["ALL_YEAR"] as Sea[], budget: "CHEAP" as Bud, difficulty: "EASY" as Diff,
    prepTime: 15, cookTime: 10, servings: 4, estimatedCost: 8, isFamiliar: true,
    tags: ["rapide", "enfants", "pratique", "lunch"],
    ingredients: [
      { name: "tortillas de blé (grandes)", quantity: 4, unit: "" },
      { name: "blancs de poulet", quantity: 2, unit: "" },
      { name: "salade iceberg", quantity: 1, unit: "demi" },
      { name: "tomates", quantity: 2, unit: "" },
      { name: "concombre", quantity: 1, unit: "demi" },
      { name: "fromage à tartiner (type Philadelphia)", quantity: 4, unit: "cs" },
      { name: "huile d'olive", quantity: 1, unit: "cs" },
    ],
    recipe: {
      intro: "Des wraps frais et rapides à assembler — parfaits pour le déjeuner ou un dîner léger.",
      steps: [
        { stepNumber: 1, description: "Cuire les blancs de poulet à la poêle avec huile, sel, poivre et paprika. 5 min par côté. Laisser tiédir puis couper en lamelles.", duration: 12 },
        { stepNumber: 2, description: "Préparer les crudités : salade en lanières, tomates en dés, concombre en bâtonnets.", duration: 5 },
        { stepNumber: 3, description: "Étaler le fromage à tartiner sur chaque tortilla. Disposer salade, crudités et poulet. Rouler serré et couper en deux.", duration: 5 },
      ],
      tips: ["Réchauffer légèrement la tortilla pour qu'elle soit plus souple", "Ajouter du guacamole ou de la sauce sriracha", "Se prépare à l'avance et se conserve 2h emballé dans du film"],
      variations: ["Version végé (houmous + légumes grillés)", "Wrap saumon fumé + avocat", "Version caesar avec sauce et parmesan"],
    },
  },
  {
    name: "Pâtes au pesto frais",
    category: "PASTA" as Cat, foodMode: "VEGETARIAN" as FM, mealTypes: ["DINNER", "LUNCH"] as MT[],
    season: ["SPRING", "SUMMER", "ALL_YEAR"] as Sea[], budget: "CHEAP" as Bud, difficulty: "EASY" as Diff,
    prepTime: 5, cookTime: 12, servings: 4, estimatedCost: 5, isFamiliar: true,
    tags: ["rapide", "végé", "pesto", "estival", "simple"],
    ingredients: [
      { name: "pâtes (trofie ou fusilli)", quantity: 400, unit: "g" },
      { name: "basilic frais", quantity: 1, unit: "bouquet" },
      { name: "pignons de pin", quantity: 30, unit: "g" },
      { name: "parmesan râpé", quantity: 50, unit: "g" },
      { name: "ail", quantity: 1, unit: "gousse" },
      { name: "huile d'olive", quantity: 6, unit: "cs" },
    ],
    recipe: {
      intro: "Des pâtes au pesto maison — cinq ingrédients, dix minutes. Le meilleur rapport effort/plaisir.",
      steps: [
        { stepNumber: 1, description: "Cuire les pâtes al dente dans de l'eau bouillante salée.", duration: 12 },
        { stepNumber: 2, description: "Mixer basilic, pignons, ail, parmesan et huile d'olive jusqu'à obtenir une pâte lisse. Saler.", duration: 3 },
        { stepNumber: 3, description: "Égoutter les pâtes en gardant un peu d'eau de cuisson. Mélanger avec le pesto. Ajouter un filet d'eau si trop épais.", duration: 2 },
      ],
      tips: ["Ne jamais cuire le pesto — ça le noircit", "Conserver le pesto sous film avec un filet d'huile", "Le pesto du commerce dépanne très bien"],
      variations: ["Pesto de roquette", "Pesto aux noix", "Avec haricots verts et pommes de terre (recette génoise)"],
    },
  },
  {
    name: "Bowl quinoa avocat pois chiches",
    category: "RICE_GRAINS" as Cat, foodMode: "VEGETARIAN" as FM, mealTypes: ["LUNCH", "DINNER"] as MT[],
    season: ["ALL_YEAR"] as Sea[], budget: "NORMAL" as Bud, difficulty: "EASY" as Diff,
    prepTime: 10, cookTime: 15, servings: 2, estimatedCost: 7, isFamiliar: true,
    tags: ["végé", "healthy", "bowl", "rapide", "vegan"],
    ingredients: [
      { name: "quinoa", quantity: 200, unit: "g" },
      { name: "pois chiches en boîte", quantity: 1, unit: "boîte" },
      { name: "avocat", quantity: 2, unit: "" },
      { name: "tomates cerises", quantity: 200, unit: "g" },
      { name: "citron", quantity: 1, unit: "" },
      { name: "huile d'olive", quantity: 2, unit: "cs" },
      { name: "paprika fumé", quantity: 1, unit: "cc" },
    ],
    recipe: {
      intro: "Un bowl complet, nourrissant et coloré. Protéines végétales, bons gras et céréales complètes.",
      steps: [
        { stepNumber: 1, description: "Cuire le quinoa : rincer, puis cuire dans 2x son volume d'eau salée 12-15 min à feu doux.", duration: 15 },
        { stepNumber: 2, description: "Égoutter et rincer les pois chiches. Les faire revenir à la poêle avec huile, paprika, sel jusqu'à légère dorure (5 min).", duration: 5 },
        { stepNumber: 3, description: "Assembler les bols : quinoa + pois chiches + avocat tranché + tomates cerises. Presser le citron, filet d'huile, sel.", duration: 3 },
      ],
      tips: ["Préparer le quinoa à l'avance pour gagner du temps", "Ajouter des graines de sésame ou de la feta pour varier"],
      variations: ["Avec riz complet à la place du quinoa", "Ajout de concombre et houmous", "Version tahini-citron comme sauce"],
    },
  },
  {
    name: "Soupe de légumes surgelés express",
    category: "SOUP" as Cat, foodMode: "VEGETARIAN" as FM, mealTypes: ["DINNER", "LUNCH"] as MT[],
    season: ["AUTUMN", "WINTER", "ALL_YEAR"] as Sea[], budget: "CHEAP" as Bud, difficulty: "EASY" as Diff,
    prepTime: 5, cookTime: 20, servings: 4, estimatedCost: 4, isFamiliar: true,
    tags: ["rapide", "végé", "surgelés", "hivernal", "économique", "réconfort"],
    ingredients: [
      { name: "légumes surgelés variés (butternut, poireaux, carottes…)", quantity: 700, unit: "g" },
      { name: "bouillon de légumes", quantity: 1, unit: "L" },
      { name: "crème fraîche", quantity: 2, unit: "cs" },
      { name: "sel, poivre, muscade", quantity: 1, unit: "pincée" },
    ],
    recipe: {
      intro: "La soupe de secours : légumes surgelés + bouillon + mixeur. Prête en 25 minutes, zéro effort.",
      steps: [
        { stepNumber: 1, description: "Mettre les légumes surgelés directement dans une casserole avec le bouillon. Porter à ébullition.", duration: 5 },
        { stepNumber: 2, description: "Cuire 15-20 min à feu moyen jusqu'à ce que les légumes soient tendres.", duration: 20 },
        { stepNumber: 3, description: "Mixer finement. Ajouter la crème fraîche, ajuster sel, poivre et une pincée de muscade.", duration: 2 },
      ],
      tips: ["Un filet d'huile d'olive au moment de servir", "Avec des croûtons grillés à l'ail pour la texture", "Se congèle très bien par portions"],
      variations: ["Soupe butternut-gingembre-coco", "Soupe de poireaux pommes de terre", "Gazpacho (version froide en été)"],
    },
  },
  {
    name: "Crêpes",
    category: "PIZZA_TART" as Cat, foodMode: "VEGETARIAN" as FM, mealTypes: ["DINNER", "LUNCH"] as MT[],
    season: ["ALL_YEAR"] as Sea[], budget: "CHEAP" as Bud, difficulty: "EASY" as Diff,
    prepTime: 10, cookTime: 25, servings: 4, estimatedCost: 4, isFamiliar: true,
    tags: ["convivial", "enfants", "végé", "crêpes", "rapide", "breton"],
    ingredients: [
      { name: "farine de blé", quantity: 250, unit: "g" },
      { name: "œufs", quantity: 3, unit: "" },
      { name: "lait", quantity: 500, unit: "ml" },
      { name: "beurre fondu", quantity: 30, unit: "g" },
      { name: "sel", quantity: 1, unit: "pincée" },
    ],
    recipe: {
      intro: "Le repas préféré des enfants. Une pâte simple, une crêpière et des garnitures à volonté.",
      steps: [
        { stepNumber: 1, description: "Mélanger farine + sel. Creuser un puits, ajouter les œufs. Incorporer le lait progressivement en fouettant. Ajouter le beurre fondu. Laisser reposer 30 min si possible.", duration: 10 },
        { stepNumber: 2, description: "Huiler légèrement une crêpière. Verser une louche de pâte, incliner pour répartir. Cuire 1-2 min par face.", duration: 25 },
        { stepNumber: 3, description: "Servir avec garnitures : sucre, beurre, confiture, pâte à tartiner, jambon-fromage…", duration: 2 },
      ],
      tips: ["La pâte se conserve 24h au frigo", "Première crêpe souvent ratée — c'est normal !", "Ajouter un peu de rhum ou de fleur d'oranger pour parfumer"],
      variations: ["Crêpes salées (jambon-fromage, champignons-béchamel)", "Crêpes Suzette", "Crêpes frangipane"],
    },
  },
];

async function main() {
  for (const mealData of meals) {
    const { recipe, ...meal } = mealData;
    const existing = await prisma.meal.findFirst({ where: { name: meal.name } });
    if (existing) { console.log("↳ Already exists:", meal.name); continue; }

    await prisma.meal.create({
      data: {
        name: meal.name,
        category: meal.category,
        foodMode: meal.foodMode,
        foodModes: [meal.foodMode],
        mealTypes: meal.mealTypes,
        season: meal.season,
        budget: meal.budget,
        difficulty: meal.difficulty,
        prepTime: meal.prepTime,
        cookTime: meal.cookTime,
        servings: meal.servings,
        estimatedCost: meal.estimatedCost,
        isFamiliar: meal.isFamiliar,
        tags: meal.tags,
        ingredients: meal.ingredients,
        isVegetarian: meal.foodMode === "VEGETARIAN",
        isVegan: false,
        isFish: meal.foodMode === "FISH",
        isCustom: false,
        canPrepAhead: false,
        ratingCount: 0,
        usageScore: 0,
        recipe: {
          create: {
            intro: recipe.intro,
            steps: recipe.steps,
            tips: recipe.tips,
            variations: recipe.variations,
            generatedByAI: false,
          },
        },
      },
    });
    console.log("✓ Created:", meal.name);
  }
  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
