"use client";

import { useState } from "react";
import type { PlannedMeal, Meal } from "@/types";
import RecipeSheet from "./RecipeSheet";
import MealPickerSheet, { mealEmoji } from "./MealPickerSheet";

const STATUS_CONFIG = {
  PLANNED: { emoji: "📋", label: "Planifié" },
  VALIDATED: { emoji: "✅", label: "Validé" },
  COOKED: { emoji: "🍴", label: "Cuisiné" },
  SKIPPED: { emoji: "⏭️", label: "Passé" },
};

export default function MealCard({
  plannedMeal: pm,
  onUpdate,
  allowChange = false,
}: {
  plannedMeal: PlannedMeal;
  onUpdate: () => void;
  allowChange?: boolean;
}) {
  const [showRecipe, setShowRecipe] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<Meal>(pm.meal);

  async function cancelMeal() {
    await fetch(`/api/planned-meals/${pm.id}`, { method: "DELETE" });
    onUpdate();
  }

  async function handleMealSelected(meal: Meal) {
    setShowPicker(false);
    await fetch(`/api/planned-meals/${pm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealId: meal.id }),
    });
    setCurrentMeal(meal);
    onUpdate();
  }

  const totalTime = currentMeal.prepTime + currentMeal.cookTime;

  return (
    <>
      <div
        className="rounded-2xl p-4 transition-all"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start gap-3">
          {/* Grande icône du repas */}
          <span className="text-3xl shrink-0 leading-none mt-0.5">{mealEmoji(currentMeal)}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                style={{
                  background: pm.mealType === "LUNCH" ? "var(--gold)" : "var(--terracotta)",
                  color: "white",
                }}
              >
                {pm.mealType === "LUNCH" ? "🥣 Déj." : "🍽️ Dîner"}
              </span>
              <h3 className="font-semibold text-base truncate">{currentMeal.name}</h3>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span>⏱ {totalTime} min</span>
              <span>{currentMeal.difficulty === "EASY" ? "Facile" : currentMeal.difficulty === "MEDIUM" ? "Moyen" : "Difficile"}</span>
              {currentMeal.estimatedCost && <span>~{currentMeal.estimatedCost.toFixed(0)}€</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{STATUS_CONFIG[pm.status].emoji}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setShowRecipe(true)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
          >
            👁 Voir
          </button>
          {allowChange && (
            <button
              onClick={() => setShowPicker(true)}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ background: "var(--muted)", color: "var(--foreground)" }}
            >
              ✏️ Changer
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
            aria-label="Annuler ce repas"
          >
            🗑
          </button>
        </div>

        {/* Confirmation suppression */}
        {confirmDelete && (
          <div className="mt-3 p-3 rounded-xl flex items-center justify-between gap-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Supprimer ce repas ?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                Non
              </button>
              <button
                onClick={cancelMeal}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ background: "#e05252" }}
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        )}

      </div>

      {showRecipe && <RecipeSheet meal={currentMeal} onClose={() => setShowRecipe(false)} />}

      {showPicker && (
        <MealPickerSheet
          title="Changer ce repas"
          onSelect={handleMealSelected}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
