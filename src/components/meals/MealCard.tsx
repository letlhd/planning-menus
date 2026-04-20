"use client";

import { useState } from "react";
import type { PlannedMeal } from "@/types";
import RecipeSheet from "./RecipeSheet";

const STATUS_CONFIG = {
  PLANNED: { emoji: "📋", label: "Planifié" },
  VALIDATED: { emoji: "✅", label: "Validé" },
  COOKED: { emoji: "🍴", label: "Cuisiné" },
  SKIPPED: { emoji: "⏭️", label: "Passé" },
};

export default function MealCard({ plannedMeal: pm, onUpdate }: { plannedMeal: PlannedMeal; onUpdate: () => void }) {
  const [showRecipe, setShowRecipe] = useState(false);
  const [rating, setRating] = useState(pm.rating ?? 0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function markCooked() {
    await fetch(`/api/planned-meals/${pm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COOKED" }),
    });
    onUpdate();
  }

  async function submitRating(r: number) {
    setRating(r);
    await fetch(`/api/planned-meals/${pm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: r, status: "COOKED" }),
    });
    onUpdate();
  }

  async function cancelMeal() {
    await fetch(`/api/planned-meals/${pm.id}`, { method: "DELETE" });
    onUpdate();
  }

  const totalTime = pm.meal.prepTime + pm.meal.cookTime;

  return (
    <>
      <div
        className="rounded-2xl p-4 transition-all"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">{pm.meal.name}</h3>
              {pm.meal.isVegetarian && <span className="text-sm">🥗</span>}
              {pm.meal.isFish && <span className="text-sm">🐟</span>}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span>⏱ {totalTime} min</span>
              <span>{pm.meal.difficulty === "EASY" ? "Facile" : pm.meal.difficulty === "MEDIUM" ? "Moyen" : "Difficile"}</span>
              {pm.meal.estimatedCost && <span>~{pm.meal.estimatedCost.toFixed(0)}€</span>}
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
            👁 Voir la recette
          </button>
          {pm.status !== "COOKED" && (
            <button
              onClick={markCooked}
              className="flex-1 py-2 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
              style={{ background: "var(--terracotta)" }}
            >
              ✓ Cuisiné
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

        {/* Rating si cuisiné */}
        {pm.status === "COOKED" && (
          <div className="flex items-center gap-1 mt-3 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => submitRating(star)}
                className="text-xl transition-transform active:scale-110"
                style={{ filter: star <= rating ? "none" : "grayscale(1) opacity(0.3)" }}
              >
                ⭐
              </button>
            ))}
          </div>
        )}
      </div>

      {showRecipe && <RecipeSheet meal={pm.meal} onClose={() => setShowRecipe(false)} />}
    </>
  );
}
