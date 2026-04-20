"use client";

import { useEffect, useState } from "react";
import type { Meal } from "@/types";
import RecipeSheet from "@/components/meals/RecipeSheet";

const BUDGET_LABELS = { CHEAP: "€", NORMAL: "€€", SPLURGE: "€€€" };
const DIFF_LABELS = { EASY: "Facile", MEDIUM: "Moyen", HARD: "Difficile" };
const DIFF_COLORS = { EASY: "var(--sage)", MEDIUM: "var(--gold)", HARD: "var(--terracotta)" };

export default function RecettesPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterVege, setFilterVege] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  useEffect(() => {
    fetch("/api/meals")
      .then((r) => r.json())
      .then((data: Meal[]) => { setMeals(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = meals.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchVege = !filterVege || m.isVegetarian || m.isVegan;
    return matchSearch && matchVege;
  });

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-semibold mb-4">Bibliothèque</h1>

      {/* Barre de recherche */}
      <div className="relative mb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un repas..."
          className="w-full px-4 py-2.5 pl-9 rounded-xl text-sm border outline-none"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">🔍</span>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterVege(!filterVege)}
          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{ background: filterVege ? "var(--sage)" : "var(--muted)", color: filterVege ? "white" : "var(--foreground)" }}
        >
          🥗 Végé
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
          <p className="text-3xl mb-2">📖</p>
          <p>Aucun repas trouvé</p>
        </div>
      ) : (
        <div className="space-y-2 pb-4">
          {filtered.map((meal) => (
            <button
              key={meal.id}
              onClick={() => setSelectedMeal(meal)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all active:opacity-70"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{meal.name}</span>
                  {meal.isVegetarian && <span className="text-xs">🥗</span>}
                  {meal.isFish && <span className="text-xs">🐟</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {meal.prepTime + meal.cookTime} min
                  </span>
                  <span className="text-xs" style={{ color: DIFF_COLORS[meal.difficulty] }}>
                    {DIFF_LABELS[meal.difficulty]}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {BUDGET_LABELS[meal.budget]}
                  </span>
                  {meal.rating && (
                    <span className="text-xs">⭐ {meal.rating.toFixed(1)}</span>
                  )}
                </div>
              </div>
              <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>›</span>
            </button>
          ))}
        </div>
      )}

      {selectedMeal && (
        <RecipeSheet meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
      )}
    </div>
  );
}
