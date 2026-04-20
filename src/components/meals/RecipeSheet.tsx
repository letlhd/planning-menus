"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Meal, Recipe, FoodMode, Budget, Difficulty, MealType } from "@/types";

const FOOD_MODE_OPTIONS: { value: FoodMode; label: string }[] = [
  { value: "MEAT", label: "🥩 Viande" },
  { value: "FISH", label: "🐟 Poisson" },
  { value: "VEGETARIAN", label: "🥗 Végétarien" },
  { value: "FESTIVE", label: "🎉 Festif" },
  { value: "RECEPTION", label: "🥂 Réception" },
];

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: "LUNCH", label: "🥣 Déjeuner" },
  { value: "DINNER", label: "🍽️ Dîner" },
];
const BUDGET_OPTIONS: { value: Budget; label: string }[] = [
  { value: "CHEAP", label: "€ Serré" },
  { value: "NORMAL", label: "€€ Normal" },
  { value: "SPLURGE", label: "€€€ Plaisir" },
];
const DIFF_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "EASY", label: "Facile" },
  { value: "MEDIUM", label: "Moyen" },
  { value: "HARD", label: "Difficile" },
];
const SEASON_OPTIONS: { value: string; label: string; season: string[] }[] = [
  { value: "SUMMER", label: "☀️ Été", season: ["SUMMER"] },
  { value: "WINTER", label: "❄️ Hiver", season: ["WINTER"] },
  { value: "ALL_YEAR", label: "🌍 Toute saison", season: ["ALL_YEAR"] },
];

function mealSeasonKey(season: string[]): string {
  if (!season || season.includes("ALL_YEAR")) return "ALL_YEAR";
  const hasSummer = season.some((s) => ["SUMMER", "SPRING"].includes(s));
  const hasWinter = season.some((s) => ["WINTER", "AUTUMN"].includes(s));
  if (hasSummer && !hasWinter) return "SUMMER";
  if (hasWinter && !hasSummer) return "WINTER";
  return "ALL_YEAR";
}

export default function RecipeSheet({
  meal,
  onClose,
  onDelete,
  onUpdated,
}: {
  meal: Meal;
  onClose: () => void;
  onDelete?: () => void;
  onUpdated?: (updated: Meal) => void;
}) {
  const [recipe, setRecipe] = useState<Recipe | null>(meal.recipe ?? null);
  const [loading, setLoading] = useState(!meal.recipe);
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!meal.recipe) {
      fetch(`/api/recipe/${meal.id}`)
        .then((r) => r.json())
        .then((r: Recipe) => { setRecipe(r); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [meal]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex flex-col"
        style={{ background: "var(--background)" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 pt-safe" style={{ borderBottom: "1px solid var(--border)" }}>
          <button onClick={onClose} className="text-2xl">←</button>
          <h1 className="font-semibold text-lg truncate mx-2 flex-1 text-center">{meal.name}</h1>
          {!editMode && (
            <button
              onClick={() => setCookingMode(!cookingMode)}
              className="text-sm px-3 py-1.5 rounded-xl font-medium transition-all"
              style={{ background: cookingMode ? "var(--terracotta)" : "var(--muted)", color: cookingMode ? "white" : "var(--foreground)" }}
            >
              {cookingMode ? "👨‍🍳 Mode" : "🍳 Cuisiner"}
            </button>
          )}
        </div>

        {editMode ? (
          <EditMealPanel
            meal={meal}
            onCancel={() => setEditMode(false)}
            onSaved={(updated) => { setEditMode(false); onUpdated?.(updated); }}
          />
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <div className="text-4xl animate-spin">🍳</div>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Génération de la recette...</p>
          </div>
        ) : !recipe ? (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: "var(--muted-foreground)" }}>Recette non disponible</p>
          </div>
        ) : cookingMode ? (
          <CookingMode recipe={recipe} currentStep={currentStep} onStepChange={setCurrentStep} meal={meal} />
        ) : (
          <RecipeDetail recipe={recipe} meal={meal} />
        )}

        {/* Footer actions (hors cooking mode et edit mode) */}
        {!cookingMode && !editMode && onDelete && (
          <div className="px-4 py-3 shrink-0 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => setEditMode(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ background: "var(--muted)", color: "var(--foreground)" }}
            >
              ✏️ Modifier
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                style={{ background: "var(--muted)", color: "#e05252" }}
              >
                🗑 Supprimer
              </button>
            ) : (
              <>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "var(--muted)" }}
                >
                  Annuler
                </button>
                <button
                  onClick={onDelete}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ background: "#e05252" }}
                >
                  Confirmer 🗑
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function RecipeDetail({ recipe, meal }: { recipe: Recipe; meal: Meal }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <p className="text-sm leading-relaxed mb-6 italic" style={{ color: "var(--muted-foreground)", fontFamily: "Lora, serif" }}>
        {recipe.intro}
      </p>

      {/* Ingrédients */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Ingrédients</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {meal.ingredients.map((ing, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < meal.ingredients.length - 1 ? "1px solid var(--border)" : "none", background: "var(--card)" }}>
              <span className="text-sm">{ing.name}</span>
              <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>{ing.quantity} {ing.unit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Étapes */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Préparation</h2>
        <div className="space-y-3">
          {recipe.steps.map((step) => (
            <div key={step.stepNumber} className="flex gap-3">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ background: "var(--terracotta)", color: "white" }}
              >
                {step.stepNumber}
              </span>
              <div className="flex-1">
                <p className="text-sm leading-relaxed">{step.description}</p>
                {step.duration && (
                  <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>⏱ {step.duration} min</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Astuces */}
      {recipe.tips.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">💡 Astuces</h2>
          <ul className="space-y-2">
            {recipe.tips.map((tip, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span style={{ color: "var(--gold)" }}>•</span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Variations */}
      {recipe.variations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">🔄 Variations</h2>
          <ul className="space-y-2">
            {recipe.variations.map((v, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span style={{ color: "var(--sage)" }}>•</span>
                {v}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Nutrition */}
      {recipe.nutritionEstimate && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">📊 Nutrition (par portion)</h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Calories", value: `${recipe.nutritionEstimate.calories}`, unit: "kcal" },
              { label: "Protéines", value: `${recipe.nutritionEstimate.proteins}`, unit: "g" },
              { label: "Glucides", value: `${recipe.nutritionEstimate.carbs}`, unit: "g" },
              { label: "Lipides", value: `${recipe.nutritionEstimate.fats}`, unit: "g" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="rounded-xl p-2 text-center" style={{ background: "var(--muted)" }}>
                <p className="text-lg font-bold">{value}</p>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{unit}</p>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EditMealPanel({
  meal,
  onCancel,
  onSaved,
}: {
  meal: Meal;
  onCancel: () => void;
  onSaved: (updated: Meal) => void;
}) {
  const [foodMode, setFoodMode] = useState<FoodMode>(meal.foodMode ?? "MEAT");
  const [mealTypes, setMealTypes] = useState<MealType[]>(meal.mealTypes ?? ["DINNER"]);
  const [budget, setBudget] = useState<Budget>(meal.budget);
  const [difficulty, setDifficulty] = useState<Difficulty>(meal.difficulty);
  const [seasonKey, setSeasonKey] = useState(mealSeasonKey(meal.season));
  const [prepTime, setPrepTime] = useState(meal.prepTime);
  const [cookTime, setCookTime] = useState(meal.cookTime);
  const [saving, setSaving] = useState(false);

  function toggleMealType(t: MealType) {
    setMealTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  async function save() {
    setSaving(true);
    const seasonArr = SEASON_OPTIONS.find((s) => s.value === seasonKey)?.season ?? ["ALL_YEAR"];
    try {
      const res = await fetch(`/api/meals/${meal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodMode, mealTypes, budget, difficulty, season: seasonArr, prepTime, cookTime }),
      });
      if (res.ok) {
        const updated: Meal = await res.json();
        onSaved(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <div>
        <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Type de repas</p>
        <div className="flex gap-2">
          {MEAL_TYPE_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => toggleMealType(value)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: mealTypes.includes(value) ? "var(--terracotta)" : "var(--muted)", color: mealTypes.includes(value) ? "white" : "var(--foreground)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Mode alimentaire</p>
        <div className="grid grid-cols-5 gap-1">
          {FOOD_MODE_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setFoodMode(value)}
              className="py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: foodMode === value ? "var(--terracotta)" : "var(--muted)", color: foodMode === value ? "white" : "var(--foreground)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Saison</p>
        <div className="flex gap-1">
          {SEASON_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setSeasonKey(value)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: seasonKey === value ? "var(--terracotta)" : "var(--muted)", color: seasonKey === value ? "white" : "var(--foreground)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Budget</p>
        <div className="flex gap-1">
          {BUDGET_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setBudget(value)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: budget === value ? "var(--terracotta)" : "var(--muted)", color: budget === value ? "white" : "var(--foreground)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Difficulté</p>
        <div className="flex gap-1">
          {DIFF_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setDifficulty(value)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: difficulty === value ? "var(--terracotta)" : "var(--muted)", color: difficulty === value ? "white" : "var(--foreground)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Prép. (min)</p>
          <input type="number" value={prepTime} onChange={(e) => setPrepTime(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-xl text-sm text-right outline-none"
            style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Cuisson (min)</p>
          <input type="number" value={cookTime} onChange={(e) => setCookTime(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-xl text-sm text-right outline-none"
            style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "var(--muted)" }}>
          Annuler
        </button>
        <button onClick={save} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--terracotta)" }}>
          {saving ? "Sauvegarde..." : "Enregistrer ✓"}
        </button>
      </div>
    </div>
  );
}

function CookingMode({ recipe, meal, currentStep, onStepChange }: { recipe: Recipe; meal: Meal; currentStep: number; onStepChange: (i: number) => void }) {
  const step = recipe.steps[currentStep];
  const isLast = currentStep >= recipe.steps.length - 1;

  return (
    <div className="flex-1 flex flex-col px-4 py-6" style={{ background: "var(--background)" }}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <span className="text-5xl font-bold mb-2" style={{ color: "var(--terracotta)" }}>
          {currentStep + 1}
        </span>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>sur {recipe.steps.length} étapes</p>
        <p className="text-xl leading-relaxed font-medium">{step.description}</p>
        {step.duration && (
          <div className="mt-4 px-4 py-2 rounded-xl" style={{ background: "var(--muted)" }}>
            <span className="text-sm">⏱ {step.duration} minutes</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex-1 py-4 rounded-2xl text-sm font-medium transition-all disabled:opacity-30"
          style={{ background: "var(--muted)" }}
        >
          ← Précédent
        </button>
        <button
          onClick={() => !isLast && onStepChange(currentStep + 1)}
          className="flex-1 py-4 rounded-2xl text-sm font-medium text-white transition-all active:scale-95"
          style={{ background: isLast ? "var(--sage)" : "var(--terracotta)" }}
        >
          {isLast ? "✓ Terminé !" : "Suivant →"}
        </button>
      </div>

      {/* Ingrédients en bas */}
      <div className="mt-4 p-4 rounded-2xl" style={{ background: "var(--muted)" }}>
        <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Ingrédients totaux</p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{meal.ingredients.map((i) => `${i.quantity}${i.unit} ${i.name}`).join(", ")}</p>
      </div>
    </div>
  );
}
