export type Category =
  | "PASTA" | "RICE_GRAINS" | "SALAD" | "SOUP" | "MEAT" | "FISH"
  | "VEGETARIAN" | "VEGAN" | "PIZZA_TART" | "STEW" | "STIR_FRY"
  | "SANDWICH" | "OTHER";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type Budget = "CHEAP" | "NORMAL" | "SPLURGE";
export type Season = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" | "ALL_YEAR";
export type MealType = "LUNCH" | "DINNER";
export type PlanStatus = "PLANNED" | "VALIDATED" | "COOKED" | "SKIPPED";
export type Ambiance = "LIGHT" | "FUN" | "BALANCED";
export type Aisle = "PRODUCE" | "MEAT_FISH" | "DAIRY" | "GROCERY" | "FROZEN" | "OTHER";

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeStep {
  stepNumber: number;
  description: string;
  duration?: number;
}

export interface NutritionEstimate {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  id: string;
  name: string;
  category: Category;
  tags: string[];
  prepTime: number;
  cookTime: number;
  difficulty: Difficulty;
  budget: Budget;
  servings: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isFish: boolean;
  canPrepAhead: boolean;
  season: Season[];
  ingredients: Ingredient[];
  estimatedCost?: number;
  usageScore: number;
  lastUsedAt?: string;
  rating?: number;
  ratingCount: number;
  sourceBlog?: string;
  sourceUrl?: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  recipe?: Recipe;
}

export interface Recipe {
  id: string;
  mealId: string;
  intro: string;
  steps: RecipeStep[];
  tips: string[];
  variations: string[];
  nutritionEstimate?: NutritionEstimate;
  generatedByAI: boolean;
  tokenCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlannedMeal {
  id: string;
  mealId: string;
  meal: Meal;
  date: string;
  mealType: MealType;
  servings: number;
  status: PlanStatus;
  rating?: number;
  notes?: string;
  weekId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  plannedMealId?: string;
  name: string;
  quantity: number;
  unit: string;
  aisle: Aisle;
  isChecked: boolean;
  isManual: boolean;
  estimatedCost?: number;
}

export interface ShoppingList {
  id: string;
  weekStart: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  totalCost?: number;
  items: ShoppingItem[];
  createdAt: string;
}

export interface Settings {
  id: string;
  adultsCount: number;
  childrenCount: number;
  defaultDays: number[];
  defaultMealType: MealType;
  defaultBudget: Budget;
  defaultAmbiance: Ambiance;
  vegetarianOverride: boolean;
  maxPrepTime?: number;
  dbRatio: number;
  weeklyBudgetGoal?: number;
}

export interface GenerationParams {
  adults: number;
  children: number;
  ambiance: Ambiance;
  budget: Budget;
  vegetarian: boolean;
  days: number;
}
