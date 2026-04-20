"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Meal, Recipe } from "@/types";

export default function RecipeSheet({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const [recipe, setRecipe] = useState<Recipe | null>(meal.recipe ?? null);
  const [loading, setLoading] = useState(!meal.recipe);
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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
        className="fixed inset-0 z-50 flex flex-col"
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
          <button
            onClick={() => setCookingMode(!cookingMode)}
            className="text-sm px-3 py-1.5 rounded-xl font-medium transition-all"
            style={{ background: cookingMode ? "var(--terracotta)" : "var(--muted)", color: cookingMode ? "white" : "var(--foreground)" }}
          >
            {cookingMode ? "👨‍🍳 Mode" : "🍳 Cuisiner"}
          </button>
        </div>

        {loading ? (
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
