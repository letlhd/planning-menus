"use client";

import { useEffect, useState } from "react";
import type { Meal, FoodMode, Budget, Difficulty } from "@/types";
import RecipeSheet from "@/components/meals/RecipeSheet";

const BUDGET_LABELS: Record<string, string> = { CHEAP: "€", NORMAL: "€€", SPLURGE: "€€€" };
const DIFF_LABELS: Record<string, string> = { EASY: "Facile", MEDIUM: "Moyen", HARD: "Difficile" };
const DIFF_COLORS: Record<string, string> = { EASY: "var(--sage)", MEDIUM: "var(--gold)", HARD: "var(--terracotta)" };

const FOOD_MODE_LABELS: Record<string, string> = {
  VEGETARIAN: "🥗 Végé",
  MEAT: "🥩 Viande",
  FISH: "🐟 Poisson",
  FESTIVE: "🎉 Festif",
};
const FOOD_MODE_COLORS: Record<string, string> = {
  VEGETARIAN: "var(--sage)",
  MEAT: "var(--terracotta)",
  FISH: "#4A90D9",
  FESTIVE: "var(--gold)",
};

function mealSeasonLabel(season: string[]): string {
  if (!season || season.length === 0) return "🌍 Toute saison";
  if (season.includes("ALL_YEAR")) return "🌍 Toute saison";
  const hasSummer = season.some((s) => ["SUMMER", "SPRING"].includes(s));
  const hasWinter = season.some((s) => ["WINTER", "AUTUMN"].includes(s));
  if (hasSummer && !hasWinter) return "☀️ Été";
  if (hasWinter && !hasSummer) return "❄️ Hiver";
  return "🌍 Toute saison";
}

const FOOD_MODE_OPTIONS: { value: FoodMode; label: string }[] = [
  { value: "MEAT", label: "🥩 Viande" },
  { value: "FISH", label: "🐟 Poisson" },
  { value: "VEGETARIAN", label: "🥗 Végétarien" },
  { value: "FESTIVE", label: "🎉 Festif" },
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

export default function RecettesPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FoodMode | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function fetchMeals() {
    fetch("/api/meals")
      .then((r) => r.json())
      .then((data: Meal[]) => { setMeals(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchMeals(); }, []);

  const filtered = meals.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchMode = !filterMode || m.foodMode === filterMode ||
      (filterMode === "VEGETARIAN" && (m.isVegetarian || m.isVegan)) ||
      (filterMode === "FISH" && m.isFish);
    return matchSearch && matchMode;
  });

  async function deleteMeal(id: string) {
    await fetch(`/api/meals/${id}`, { method: "DELETE" });
    setSelectedMeal(null);
    fetchMeals();
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Bibliothèque</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-medium text-white transition-all active:scale-95"
          style={{ background: "var(--terracotta)" }}
          aria-label="Ajouter un repas"
        >
          +
        </button>
      </div>

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

      {/* Filtres par mode */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {FOOD_MODE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterMode(filterMode === value ? null : value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0"
            style={{
              background: filterMode === value ? FOOD_MODE_COLORS[value] : "var(--muted)",
              color: filterMode === value ? "white" : "var(--foreground)",
            }}
          >
            {label}
          </button>
        ))}
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
                <span className="font-medium text-sm truncate block">{meal.name}</span>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {/* Badge foodMode */}
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: FOOD_MODE_COLORS[meal.foodMode] + "22", color: FOOD_MODE_COLORS[meal.foodMode] }}
                  >
                    {FOOD_MODE_LABELS[meal.foodMode] ?? meal.foodMode}
                  </span>
                  {/* Badge saison */}
                  <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                    {mealSeasonLabel(meal.season)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {meal.prepTime + meal.cookTime} min
                  </span>
                  <span className="text-xs" style={{ color: DIFF_COLORS[meal.difficulty] }}>
                    {DIFF_LABELS[meal.difficulty]}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {BUDGET_LABELS[meal.budget]}
                  </span>
                </div>
              </div>
              <span className="text-sm shrink-0" style={{ color: "var(--muted-foreground)" }}>›</span>
            </button>
          ))}
        </div>
      )}

      {selectedMeal && (
        <RecipeSheet
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onDelete={() => deleteMeal(selectedMeal.id)}
          onUpdated={(updated) => {
            setSelectedMeal(updated);
            fetchMeals();
          }}
        />
      )}

      {showAdd && (
        <AddMealSheet
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); fetchMeals(); }}
        />
      )}
    </div>
  );
}

/* ──────────── Sheet d'ajout ──────────── */
function AddMealSheet({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [foodMode, setFoodMode] = useState<FoodMode>("MEAT");
  const [season, setSeason] = useState("ALL_YEAR");
  const [budget, setBudget] = useState<Budget>("NORMAL");
  const [difficulty, setDifficulty] = useState<Difficulty>("EASY");
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(20);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) { setError("Le nom est requis"); return; }
    setSaving(true);
    const seasonArr = SEASON_OPTIONS.find((s) => s.value === season)?.season ?? ["ALL_YEAR"];
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), foodMode, season: seasonArr, budget, difficulty, prepTime, cookTime }),
      });
      if (res.ok) onAdded();
      else setError("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        className="w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col"
        style={{ background: "var(--card)", maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />
          <h2 className="text-xl font-semibold">Ajouter un repas</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4">
          {/* Nom */}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Nom</p>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Ex : Poulet rôti aux herbes"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            {error && <p className="text-xs mt-1" style={{ color: "var(--terracotta)" }}>{error}</p>}
          </div>

          {/* Mode alimentaire */}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Mode alimentaire</p>
            <div className="grid grid-cols-4 gap-1">
              {FOOD_MODE_OPTIONS.map(({ value, label }) => (
                <button key={value} onClick={() => setFoodMode(value)}
                  className="py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background: foodMode === value ? "var(--terracotta)" : "var(--muted)", color: foodMode === value ? "white" : "var(--foreground)" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Saison */}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Saison</p>
            <div className="flex gap-1">
              {SEASON_OPTIONS.map(({ value, label }) => (
                <button key={value} onClick={() => setSeason(value)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background: season === value ? "var(--terracotta)" : "var(--muted)", color: season === value ? "white" : "var(--foreground)" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
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

          {/* Difficulté */}
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

          {/* Temps */}
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Préparation (min)</p>
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
        </div>

        <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={submit}
            disabled={saving}
            className="w-full py-3 rounded-xl font-medium text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "var(--terracotta)" }}
          >
            {saving ? "Ajout en cours..." : "Ajouter le repas ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
