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

const FOOD_MODE_OPTS: { value: FoodMode; emoji: string }[] = [
  { value: "MEAT", emoji: "🥩" },
  { value: "FISH", emoji: "🐟" },
  { value: "VEGETARIAN", emoji: "🥗" },
  { value: "FESTIVE", emoji: "🎉" },
  { value: "RECEPTION", emoji: "🥂" },
];

type SwapCriteria = {
  foodMode?: FoodMode;
  budget?: "CHEAP" | "NORMAL" | "SPLURGE";
  maxTotalTime?: number;
  minTotalTime?: number;
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
  const [showSwap, setShowSwap] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<Meal>(pm.meal);
  const [swapping, setSwapping] = useState<string | null>(null); // which button is loading

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

  async function swapWith(label: string, criteria: SwapCriteria) {
    setSwapping(label);
    try {
      const res = await fetch("/api/generate/slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adults: 2,
          children: 2,
          foodMode: criteria.foodMode ?? currentMeal.foodMode,
          seasonPref: "ALL_YEAR",
          budget: criteria.budget ?? currentMeal.budget,
          mealType: pm.mealType,
          exclude: [currentMeal.name],
          ...(criteria.maxTotalTime !== undefined && { maxTotalTime: criteria.maxTotalTime }),
          ...(criteria.minTotalTime !== undefined && { minTotalTime: criteria.minTotalTime }),
        }),
      });
      if (res.ok) {
        const meal = await res.json();
        await applyMeal(meal as Meal);
      }
    } finally {
      setSwapping(null);
    }
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
              <span>⏱ {totalTime > 0 ? `${totalTime} min` : "—"}</span>
              <span>{currentMeal.difficulty === "EASY" ? "Facile" : currentMeal.difficulty === "MEDIUM" ? "Moyen" : "Difficile"}</span>
              {currentMeal.estimatedCost != null && <span>~{currentMeal.estimatedCost.toFixed(0)}€</span>}
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
            aria-label="Annuler ce repas"
          >
            🗑
          </button>
        </div>

        {/* Panneau de swap contextuel */}
        {showSwap && (
          <div className="mt-3 space-y-2.5">
            {/* Ligne 1 : Aléatoire + budget */}
            <div className="flex gap-1.5">
              <SwapBtn
                label="🎲"
                sublabel="Aléatoire"
                loading={swapping === "random"}
                onClick={() => swapWith("random", {})}
                accent
              />
              <SwapBtn
                label="€"
                sublabel="Moins cher"
                loading={swapping === "cheap"}
                onClick={() => swapWith("cheap", { budget: "CHEAP" })}
              />
              <SwapBtn
                label="€€€"
                sublabel="Plus cher"
                loading={swapping === "splurge"}
                onClick={() => swapWith("splurge", { budget: "SPLURGE" })}
              />
              <SwapBtn
                label="⚡"
                sublabel="Rapide"
                loading={swapping === "fast"}
                onClick={() => swapWith("fast", { maxTotalTime: 25 })}
              />
              <SwapBtn
                label="🕐"
                sublabel="Élaboré"
                loading={swapping === "long"}
                onClick={() => swapWith("long", { minTotalTime: 45 })}
              />
            </div>

            {/* Ligne 2 : modes alimentaires */}
            <div className="flex gap-1.5">
              {FOOD_MODE_OPTS.map(({ value, emoji }) => (
                <SwapBtn
                  key={value}
                  label={emoji}
                  sublabel={value === "MEAT" ? "Viande" : value === "FISH" ? "Poisson" : value === "VEGETARIAN" ? "Végé" : value === "FESTIVE" ? "Festif" : "Récep."}
                  loading={swapping === value}
                  active={currentMeal.foodMode === value}
                  onClick={() => swapWith(value, { foodMode: value })}
                />
              ))}
            </div>

            {/* Ligne 3 : saisie manuelle */}
            <button
              onClick={() => { setShowPicker(true); setShowSwap(false); }}
              className="w-full py-2 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px dashed var(--border)" }}
            >
              ✍️ Choisir manuellement
            </button>
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

function SwapBtn({
  label,
  sublabel,
  loading,
  active,
  accent,
  onClick,
}: {
  label: string;
  sublabel: string;
  loading: boolean;
  active?: boolean;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-center transition-all active:scale-90 disabled:opacity-60"
      style={{
        background: accent
          ? "var(--terracotta)"
          : active
          ? "color-mix(in srgb, var(--terracotta) 20%, var(--muted))"
          : "var(--muted)",
        color: accent ? "white" : "var(--foreground)",
        border: active ? "1px solid var(--terracotta)" : "1px solid transparent",
        minWidth: 0,
      }}
    >
      <span className="text-base leading-none">{loading ? "⏳" : label}</span>
      <span className="text-[9px] font-medium leading-none" style={{ color: accent ? "rgba(255,255,255,0.85)" : "var(--muted-foreground)" }}>
        {sublabel}
      </span>
    </button>
  );
}
