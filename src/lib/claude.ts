import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = "claude-sonnet-4-6";

function logTokenUsage(label: string, usage: { input_tokens: number; output_tokens: number }) {
  if (process.env.NODE_ENV === "development") {
    const inputCost = (usage.input_tokens / 1_000_000) * 3;
    const outputCost = (usage.output_tokens / 1_000_000) * 15;
    console.log(
      `[Claude] ${label} — in:${usage.input_tokens} out:${usage.output_tokens} (~$${(inputCost + outputCost).toFixed(4)})`
    );
  }
}

const FOOD_MODE_FR: Record<string, string> = {
  VEGETARIAN: "végétarien",
  MEAT: "avec viande",
  FISH: "avec poisson ou fruits de mer",
  FESTIVE: "festif et convivial",
};
const SEASON_FR: Record<string, string> = {
  SUMMER: "estivale (légèreté, fraîcheur, produits de saison été)",
  WINTER: "hivernale (réconfortant, chaud, produits de saison hiver)",
};

export async function generateMealSuggestions(params: {
  count: number;
  adults: number;
  children: number;
  foodMode: string;
  seasonPref: string;
  budget: string;
  exclude: string[];
}): Promise<object[]> {
  const modeDesc = FOOD_MODE_FR[params.foodMode] ?? "";
  const seasonDesc = SEASON_FR[params.seasonPref] ? ` Cuisine ${SEASON_FR[params.seasonPref]}.` : "";

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `Tu es un assistant culinaire francophone. Réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour.`,
    messages: [
      {
        role: "user",
        content: `Propose ${params.count} idées de repas pour ${params.adults} adulte(s) et ${params.children} enfant(s).
Mode: ${modeDesc}. Budget: ${params.budget}.${seasonDesc}
Exclure: ${params.exclude.join(", ") || "rien"}.

Format JSON: [{"name":"...","category":"...","prepTime":N,"cookTime":N,"difficulty":"EASY|MEDIUM|HARD","budget":"CHEAP|NORMAL|SPLURGE","foodMode":"VEGETARIAN|MEAT|FISH|FESTIVE","isVegetarian":bool,"isVegan":bool,"isFish":bool,"canPrepAhead":bool,"estimatedCost":N,"season":["ALL_YEAR"],"tags":[],"ingredients":[{"name":"...","quantity":N,"unit":"..."}]}]`,
      },
    ],
  });

  logTokenUsage("generateMealSuggestions", response.usage);

  const text = response.content[0].type === "text" ? response.content[0].text : "[]";
  return JSON.parse(text);
}

export async function generateRecipe(mealName: string, servings: number): Promise<object> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `Tu es un chef cuisinier francophone. Réponds UNIQUEMENT en JSON valide, sans markdown.`,
    messages: [
      {
        role: "user",
        content: `Génère une recette complète pour "${mealName}" (${servings} personnes).

Format JSON: {"intro":"...","steps":[{"stepNumber":1,"description":"...","duration":N}],"tips":["..."],"variations":["..."],"nutritionEstimate":{"calories":N,"proteins":N,"carbs":N,"fats":N}}`,
      },
    ],
  });

  logTokenUsage(`generateRecipe:${mealName}`, response.usage);
  const totalTokens =
    response.usage.input_tokens + response.usage.output_tokens;

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  return { ...JSON.parse(text), tokenCost: totalTokens };
}

export async function analyzeScrapedRecipes(rawRecipes: string[]): Promise<object[]> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: `Tu analyses des recettes scrapées de blogs. Réponds UNIQUEMENT en JSON valide.`,
    messages: [
      {
        role: "user",
        content: `Analyse et structure ces ${rawRecipes.length} recettes en français.
Recettes brutes: ${JSON.stringify(rawRecipes.slice(0, 10))}

Format JSON: [{"name":"...","category":"...","prepTime":N,"cookTime":N,"difficulty":"EASY|MEDIUM|HARD","budget":"CHEAP|NORMAL|SPLURGE","isVegetarian":bool,"isVegan":bool,"isFish":bool,"estimatedCost":N,"ingredients":[{"name":"...","quantity":N,"unit":"..."}],"recipe":{"intro":"...","steps":[{"stepNumber":1,"description":"..."}],"tips":[],"variations":[]}}]`,
      },
    ],
  });

  logTokenUsage("analyzeScrapedRecipes", response.usage);
  const text = response.content[0].type === "text" ? response.content[0].text : "[]";
  return JSON.parse(text);
}
