"use client";

import { useState } from "react";
import type { PlannedMeal, Meal, FoodMode } from "@/types";
import RecipeSheet from "./RecipeSheet";
import MealPickerSheet, { mealEmoji } from "./MealPickerSheet";

const STATUS_CONFIG = {
  PLANNED: { emoji: "📋", label: "Planifié" },
  VALIDATED: { emoji: "✅", label: "Validé" },
  COOKED: { emoji: "🍴", label: "Cuisiné" },
  SKIPPED: { emoji: "⏭️", label: "Passé" },
};

const FOOD_MODE_OPTS: { value: FoodMode; emoji: string; label: string }[] = [
  { value: "MEAT",       emoji: "🥩", label: "Viande" },
  { value: "FISH",       emoji: "🐟", label: "Poisson" },
  { value: "VEGETARIAN", emoji: "🥗", label: "Végé" },
  { value: "FESTIVE",    emoji: "🎉", label: "Festif" },
  { value: "RECEPTION",  emoji: "🥂", label: "Récep." },
];

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
  const [showSwap, setShowSwap] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<Meal>(pm.meal);
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);

  async function cancelMeal() {
    await fetch(`/api/planned-meals/${pm.id}`, { method: "DELETE" });
    onUpdate();
  }

  async function applyMeal(meal: Meal) {
    await fetch(`/api/planned-meals/${pm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealId: meal.id }),
    });
    setCurrentMeal(meal);
    setShowSwap(false);
    onUpdate();
  }

  async function handleMealSelected(meal: Meal) {
    setShowPicker(false);
    await applyMeal(meal);
  }

  async function swap(btnKey: string, overrides: {
    foodMode?: FoodMode;
    budget?: string;
    complexity?: "SIMPLE" | "ELABORATE";
  }) {
    setLoadingBtn(btnKey);
    try {
      const res = await fetch("/api/generate/slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adults: 2,
          children: 2,
          foodMode: overrides.foodMode ?? currentMeal.foodMode,
          seasonPref: "ALL_YEAR",
          budget: overrides.budget ?? currentMeal.budget,
          mealType: pm.mealType,
          exclude: [currentMeal.name],
          ...(overrides.complexity && { complexity: overrides.complexity }),
        }),
      });
      if (res.ok) await applyMeal(await res.json() as Meal);
    } finally {
      setLoadingBtn(null);
    }
  }

  const totalTime = currentMeal.prepTime + currentMeal.cookTime;

  return (
    <>
      <div
        className="rounded-2xl p-4 transition-all"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* En-tête du repas */}
        <div className="flex items-start gap-3">
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
              <span>⏱ {totalTime > 0 ? `${totalTime} min` : "—"}</span>
              <span>{currentMeal.difficulty === "EASY" ? "Facile" : currentMeal.difficulty === "MEDIUM" ? "Moyen" : "Difficile"}</span>
              {currentMeal.estimatedCost != null && <span>~{currentMeal.estimatedCost.toFixed(0)}€</span>}
            </div>
          </div>
          <span className="text-lg">{STATUS_CONFIG[pm.status].emoji}</span>
        </div>

        {/* Boutons d'action */}
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
              onClick={() => { setShowSwap((v) => !v); setConfirmDelete(false); }}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{
                background: showSwap ? "var(--terracotta)" : "var(--muted)",
                color: showSwap ? "white" : "var(--foreground)",
              }}
            >
              ✏️ Changer
            </button>
          )}
          <button
            onClick={() => { setConfirmDelete(true); setShowSwap(false); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
          >
            🗑
          </button>
        </div>

        {/* Panneau de swap */}
        {showSwap && (
          <div className="mt-3 space-y-2">

            {/* Ligne 1 : modes alimentaires */}
            <div className="flex gap-1">
              {FOOD_MODE_OPTS.map(({ value, emoji, label }) => {
                const isActive = currentMeal.foodMode === value;
                return (
                  <button
                    key={value}
                    onClick={() => swap(value, { foodMode: value })}
                    disabled={loadingBtn !== null}
                    className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                    style={{
                      background: isActive ? "color-mix(in srgb, var(--terracotta) 15%, var(--muted))" : "var(--muted)",
                      border: isActive ? "1.5px solid var(--terracotta)" : "1.5px solid transparent",
                    }}
                  >
                    <span className="text-base leading-none">{loadingBtn === value ? "⏳" : emoji}</span>
                    <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Ligne 2 : budget + complexité */}
            <div className="flex gap-1.5">
              <button
                onClick={() => swap("cheap", { budget: "CHEAP" })}
                disabled={loadingBtn !== null}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                style={{
                  background: currentMeal.budget === "CHEAP" ? "color-mix(in srgb, var(--terracotta) 15%, var(--muted))" : "var(--muted)",
                  border: currentMeal.budget === "CHEAP" ? "1.5px solid var(--terracotta)" : "1.5px solid transparent",
                }}
              >
                <span className="text-sm font-semibold leading-none">{loadingBtn === "cheap" ? "⏳" : "€"}</span>
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Serré</span>
              </button>
              <button
                onClick={() => swap("splurge", { budget: "SPLURGE" })}
                disabled={loadingBtn !== null}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                style={{
                  background: currentMeal.budget === "SPLURGE" ? "color-mix(in srgb, var(--terracotta) 15%, var(--muted))" : "var(--muted)",
                  border: currentMeal.budget === "SPLURGE" ? "1.5px solid var(--terracotta)" : "1.5px solid transparent",
                }}
              >
                <span className="text-sm font-semibold leading-none">{loadingBtn === "splurge" ? "⏳" : "€€€"}</span>
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Plaisir</span>
              </button>
              <button
                onClick={() => swap("simple", { complexity: "SIMPLE" })}
                disabled={loadingBtn !== null}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                style={{ background: "var(--muted)", border: "1.5px solid transparent" }}
              >
                <span className="text-base leading-none">{loadingBtn === "simple" ? "⏳" : "🍃"}</span>
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Simple</span>
              </button>
              <button
                onClick={() => swap("elaborate", { complexity: "ELABORATE" })}
                disabled={loadingBtn !== null}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                style={{ background: "var(--muted)", border: "1.5px solid transparent" }}
              >
                <span className="text-base leading-none">{loadingBtn === "elaborate" ? "⏳" : "🔥"}</span>
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Élaboré</span>
              </button>
            </div>

            {/* Ligne 3 : aléatoire + manuel */}
            <div className="flex gap-1.5">
              <button
                onClick={() => swap("random", {})}
                disabled={loadingBtn !== null}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--terracotta)", color: "white" }}
              >
                {loadingBtn === "random" ? "⏳" : "🎲"} Au hasard
              </button>
              <button
                onClick={() => { setShowPicker(true); setShowSwap(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px dashed var(--border)" }}
              >
                ✍️ Manuel
              </button>
            </div>

          </div>
        )}

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
