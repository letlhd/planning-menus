import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const newMeals = [
  {
    name: "Sushis",
    category: "FISH", foodMode: "FISH", mealTypes: ["DINNER"],
    season: ["ALL_YEAR"], budget: "SPLURGE", difficulty: "EASY",
    prepTime: 0, cookTime: 0, servings: 4, estimatedCost: 40, isFamiliar: true,
    tags: ["restaurant", "japonais", "poisson"],
    ingredients: [] as object[],
    recipe: {
      intro: "Commande de sushis au restaurant ou à emporter — une soirée sans cuisine !",
      steps: [{ stepNumber: 1, description: "Commander chez votre restaurant japonais favori.", duration: 0 }],
      tips: ["Commander à l'avance le vendredi soir", "Prévoir makis + sashimis + chirashi"],
      variations: ["Plateau sashimi", "Menu chirashi", "Mix makis-californias"],
    },
  },
  {
    name: "Pizza Piumina",
    category: "PIZZA_TART", foodMode: "MEAT", mealTypes: ["DINNER"],
    season: ["ALL_YEAR"], budget: "NORMAL", difficulty: "EASY",
    prepTime: 0, cookTime: 0, servings: 4, estimatedCost: 30, isFamiliar: true,
    tags: ["restaurant", "pizza", "italien"],
    ingredients: [] as object[],
    recipe: {
      intro: "La pizza Piumina du restaurant — une valeur sûre pour toute la famille.",
      steps: [{ stepNumber: 1, description: "Commander ou aller chercher les pizzas.", duration: 0 }],
      tips: ["Commander tôt le vendredi", "Accompagner d'une salade verte"],
      variations: ["4 fromages", "Margherita", "Jambon-champignons"],
    },
  },
  {
    name: "Polenta au gorgonzola",
    category: "VEGETARIAN", foodMode: "VEGETARIAN", mealTypes: ["DINNER"],
    season: ["WINTER", "AUTUMN"], budget: "NORMAL", difficulty: "EASY",
    prepTime: 5, cookTime: 20, servings: 4, estimatedCost: 8, isFamiliar: true,
    tags: ["végé", "hivernal", "réconfort", "rapide"],
    ingredients: [
      { name: "polenta", quantity: 300, unit: "g" },
      { name: "gorgonzola", quantity: 150, unit: "g" },
      { name: "parmesan râpé", quantity: 50, unit: "g" },
      { name: "beurre", quantity: 30, unit: "g" },
      { name: "bouillon de légumes", quantity: 1.2, unit: "L" },
    ],
    recipe: {
      intro: "Une polenta crémeuse fondante au gorgonzola, réconfortante en hiver. Prête en 20 minutes.",
      steps: [
        { stepNumber: 1, description: "Porter le bouillon à ébullition. Verser la polenta en pluie en remuant constamment.", duration: 3 },
        { stepNumber: 2, description: "Cuire 15 min à feu doux en remuant régulièrement jusqu'à épaississement.", duration: 15 },
        { stepNumber: 3, description: "Hors du feu, incorporer le gorgonzola en morceaux, le beurre et le parmesan. Assaisonner.", duration: 2 },
      ],
      tips: ["Servir immédiatement, la polenta se fige vite", "Accompagner d'une salade de roquette", "Ajouter des noix concassées pour le croquant"],
      variations: ["Polenta au comté", "Polenta aux champignons poêlés", "Polenta grillée le lendemain"],
    },
  },
  {
    name: "Lasagnes bolognaise",
    category: "PASTA", foodMode: "MEAT", mealTypes: ["DINNER"],
    season: ["ALL_YEAR"], budget: "NORMAL", difficulty: "MEDIUM",
    prepTime: 30, cookTime: 45, servings: 6, estimatedCost: 14, isFamiliar: true,
    tags: ["familial", "convivial", "plat du dimanche", "à préparer à l'avance"],
    ingredients: [
      { name: "feuilles de lasagne", quantity: 250, unit: "g" },
      { name: "bœuf haché", quantity: 500, unit: "g" },
      { name: "sauce tomate", quantity: 400, unit: "g" },
      { name: "oignon", quantity: 2, unit: "" },
      { name: "carotte", quantity: 2, unit: "" },
      { name: "lait", quantity: 500, unit: "ml" },
      { name: "farine", quantity: 40, unit: "g" },
      { name: "beurre", quantity: 40, unit: "g" },
      { name: "gruyère râpé", quantity: 100, unit: "g" },
    ],
    recipe: {
      intro: "Des lasagnes bolognaise généreuses, le plat familial par excellence. Encore meilleures le lendemain.",
      steps: [
        { stepNumber: 1, description: "Faire revenir les oignons et carottes émincés. Ajouter le bœuf haché, dorer. Ajouter la sauce tomate, sel, poivre, herbes. Mijoter 20 min.", duration: 25 },
        { stepNumber: 2, description: "Préparer la béchamel : faire fondre le beurre, ajouter la farine, cuire 1 min. Verser le lait progressivement en remuant jusqu'à épaississement.", duration: 10 },
        { stepNumber: 3, description: "Alterner couches de bolognaise, feuilles de lasagne, béchamel. Terminer par béchamel + gruyère.", duration: 10 },
        { stepNumber: 4, description: "Cuire au four 180°C pendant 40 min jusqu'à dorure.", duration: 40 },
      ],
      tips: ["Préparer la bolognaise la veille", "Les lasagnes se congèlent très bien", "Laisser reposer 10 min avant de servir"],
      variations: ["Avec champignons", "Végétarienne aux légumes grillés", "Aux épinards et ricotta"],
    },
  },
  {
    name: "Lasagnes aux courgettes",
    category: "VEGETARIAN", foodMode: "VEGETARIAN", mealTypes: ["DINNER"],
    season: ["SUMMER", "SPRING"], budget: "NORMAL", difficulty: "MEDIUM",
    prepTime: 25, cookTime: 40, servings: 6, estimatedCost: 10, isFamiliar: true,
    tags: ["végé", "courgettes", "estival", "à préparer à l'avance"],
    ingredients: [
      { name: "feuilles de lasagne", quantity: 250, unit: "g" },
      { name: "courgettes", quantity: 4, unit: "" },
      { name: "ricotta", quantity: 250, unit: "g" },
      { name: "sauce tomate", quantity: 400, unit: "g" },
      { name: "mozzarella", quantity: 150, unit: "g" },
      { name: "parmesan râpé", quantity: 80, unit: "g" },
      { name: "ail", quantity: 2, unit: "gousses" },
      { name: "basilic frais", quantity: 1, unit: "bouquet" },
    ],
    recipe: {
      intro: "Des lasagnes légères et parfumées aux courgettes et ricotta, parfaites en été.",
      steps: [
        { stepNumber: 1, description: "Couper les courgettes en fines rondelles. Les faire revenir à l'huile d'olive avec l'ail jusqu'à légère dorure. Saler, poivrer.", duration: 15 },
        { stepNumber: 2, description: "Mélanger la ricotta avec le basilic ciselé, sel, poivre.", duration: 5 },
        { stepNumber: 3, description: "Monter les lasagnes : sauce tomate, lasagnes, courgettes, ricotta, mozzarella. Répéter. Terminer par sauce tomate + parmesan.", duration: 10 },
        { stepNumber: 4, description: "Cuire 180°C pendant 35-40 min jusqu'à dorure.", duration: 40 },
      ],
      tips: ["Faire dégorger les courgettes avec du sel avant cuisson", "Utiliser de la mozzarella di bufala pour plus de fondant"],
      variations: ["Ajout d'aubergines grillées", "Avec du thon émietté", "Version pesto"],
    },
  },
  {
    name: "Saucisse et semoule",
    category: "MEAT", foodMode: "MEAT", mealTypes: ["DINNER", "LUNCH"],
    season: ["ALL_YEAR"], budget: "CHEAP", difficulty: "EASY",
    prepTime: 5, cookTime: 20, servings: 4, estimatedCost: 8, isFamiliar: true,
    tags: ["rapide", "enfants", "simple", "économique"],
    ingredients: [
      { name: "saucisses", quantity: 8, unit: "" },
      { name: "semoule fine", quantity: 300, unit: "g" },
      { name: "bouillon de volaille", quantity: 350, unit: "ml" },
      { name: "beurre", quantity: 20, unit: "g" },
      { name: "sel", quantity: 1, unit: "cc" },
    ],
    recipe: {
      intro: "Un classique rapide et économique adoré des enfants. Saucisses grillées sur lit de semoule.",
      steps: [
        { stepNumber: 1, description: "Faire griller les saucisses à la poêle ou au four 20 min à 200°C.", duration: 20 },
        { stepNumber: 2, description: "Porter le bouillon à ébullition. Hors du feu, verser la semoule, couvrir 3 min. Égrener avec le beurre.", duration: 5 },
        { stepNumber: 3, description: "Servir les saucisses sur la semoule.", duration: 2 },
      ],
      tips: ["Ajouter des légumes poêlés pour équilibrer", "La semoule peut être assaisonnée avec du cumin"],
      variations: ["Avec merguez", "Semoule aux herbes", "Sauce tomate en accompagnement"],
    },
  },
  {
    name: "Dal de lentilles corail",
    category: "VEGETARIAN", foodMode: "VEGETARIAN", mealTypes: ["DINNER"],
    season: ["ALL_YEAR"], budget: "CHEAP", difficulty: "EASY",
    prepTime: 10, cookTime: 25, servings: 4, estimatedCost: 5, isFamiliar: true,
    tags: ["végé", "vegan", "indien", "épicé", "économique", "réconfort"],
    ingredients: [
      { name: "lentilles corail", quantity: 300, unit: "g" },
      { name: "lait de coco", quantity: 200, unit: "ml" },
      { name: "tomates concassées", quantity: 400, unit: "g" },
      { name: "oignon", quantity: 2, unit: "" },
      { name: "ail", quantity: 3, unit: "gousses" },
      { name: "gingembre frais", quantity: 2, unit: "cm" },
      { name: "curcuma", quantity: 1, unit: "cc" },
      { name: "cumin", quantity: 1, unit: "cc" },
      { name: "coriandre en poudre", quantity: 1, unit: "cc" },
      { name: "riz basmati", quantity: 300, unit: "g" },
    ],
    recipe: {
      intro: "Un dal réconfortant, épicé et crémeux. Économique, nourrissant, et prêt en 30 minutes.",
      steps: [
        { stepNumber: 1, description: "Faire revenir l'oignon émincé dans l'huile. Ajouter ail, gingembre râpé, épices. Faire revenir 2 min.", duration: 5 },
        { stepNumber: 2, description: "Ajouter les lentilles rincées, tomates concassées, 300 ml d'eau. Cuire 20 min à feu doux.", duration: 20 },
        { stepNumber: 3, description: "Ajouter le lait de coco, ajuster sel et épices. Cuire encore 5 min.", duration: 5 },
        { stepNumber: 4, description: "Servir avec le riz basmati et coriandre fraîche.", duration: 2 },
      ],
      tips: ["Les lentilles corail ne nécessitent pas de trempage", "Ajouter des épinards en fin de cuisson"],
      variations: ["Dal au beurre (dairy butter)", "Avec du pain naan", "Version soupe plus liquide"],
    },
  },
  {
    name: "Crozets savoyards",
    category: "PASTA", foodMode: "VEGETARIAN", mealTypes: ["DINNER"],
    season: ["WINTER", "AUTUMN"], budget: "NORMAL", difficulty: "EASY",
    prepTime: 10, cookTime: 30, servings: 4, estimatedCost: 9, isFamiliar: true,
    tags: ["savoyard", "hivernal", "fromage", "réconfort", "végé"],
    ingredients: [
      { name: "crozets", quantity: 400, unit: "g" },
      { name: "reblochon ou beaufort", quantity: 200, unit: "g" },
      { name: "lardons", quantity: 150, unit: "g" },
      { name: "oignon", quantity: 2, unit: "" },
      { name: "crème fraîche", quantity: 200, unit: "ml" },
      { name: "beurre", quantity: 20, unit: "g" },
    ],
    recipe: {
      intro: "Les crozets, ces petites pâtes savoyardes au sarrasin, gratinés avec du reblochon fondant.",
      steps: [
        { stepNumber: 1, description: "Cuire les crozets dans de l'eau bouillante salée 20 min. Égoutter.", duration: 20 },
        { stepNumber: 2, description: "Faire revenir les oignons et lardons à la poêle jusqu'à dorure.", duration: 8 },
        { stepNumber: 3, description: "Mélanger crozets, oignons-lardons, crème fraîche. Verser dans un plat à gratin. Disposer le fromage en tranches par-dessus.", duration: 5 },
        { stepNumber: 4, description: "Gratiner au four 200°C pendant 15 min.", duration: 15 },
      ],
      tips: ["Version végé : supprimer les lardons, ajouter des noix", "Accompagner d'une salade verte bien vinaigrée"],
      variations: ["Crozets au comté", "Version sans lardons avec champignons", "Crozets en gratin tartiflette"],
    },
  },
];

async function main() {
  console.log("Adding 8 new meals...");
  for (const mealData of newMeals) {
    const { recipe, ...meal } = mealData;

    // Skip if already exists
    const existing = await prisma.meal.findFirst({ where: { name: meal.name } });
    if (existing) {
      console.log(`  ↳ Already exists: ${meal.name}`);
      continue;
    }

    type FM = "VEGETARIAN" | "MEAT" | "FISH" | "FESTIVE" | "RECEPTION";
    type Cat = "PASTA" | "RICE_GRAINS" | "SALAD" | "SOUP" | "MEAT" | "FISH" | "VEGETARIAN" | "VEGAN" | "PIZZA_TART" | "STEW" | "STIR_FRY" | "SANDWICH" | "OTHER";
    type Bud = "CHEAP" | "NORMAL" | "SPLURGE";
    type Diff = "EASY" | "MEDIUM" | "HARD";
    type Sea = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" | "ALL_YEAR";
    type MT = "LUNCH" | "DINNER";
    const created = await prisma.meal.create({
      data: {
        name: meal.name,
        category: meal.category as Cat,
        foodMode: meal.foodMode as FM,
        foodModes: [meal.foodMode as FM],
        mealTypes: meal.mealTypes as MT[],
        season: meal.season as Sea[],
        budget: meal.budget as Bud,
        difficulty: meal.difficulty as Diff,
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
    console.log(`  ✓ Created: ${created.name}`);
  }
  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
