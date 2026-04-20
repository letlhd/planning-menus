"use client";

import { useEffect, useState } from "react";
import type { Meal, FoodMode, Budget, Difficulty, MealType } from "@/types";

const FOOD_MODE_LABELS: Record<string, string> = {
  VEGETARIAN: "🥗", MEAT: "🥩", FISH: "🐟", FESTIVE: "🎉", RECEPTION: "🥂",
};
const FOOD_MODE_OPTIONS: { value: FoodMode; label: string }[] = [
  { value: "MEAT", label: "🥩 Viande" },
  { value: "FISH", label: "🐟 Poisson" },
  { value: "VEGETARIAN", label: "🥗 Végétarien" },
  { value: "FESTIVE", label: "🎉 Festif" },
  { value: "RECEPTION", label: "🥂 Réception" },
];
const BUDGET_OPTIONS: { value: Budget; label: string }[] = [
  { value: "CHEAP", label: "€" }, { value: "NORMAL", label: "€€" }, { value: "SPLURGE", label: "€€€" },
];
const DIFF_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "EASY", label: "Facile" }, { value: "MEDIUM", label: "Moyen" }, { value: "HARD", label: "Difficile" },
];
const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: "DINNER", label: "🍽️ Dîner" }, { value: "LUNCH", label: "🥣 Déjeuner" },
];
const SEASON_OPTIONS: { value: string; label: string; season: string[] }[] = [
  { value: "ALL_YEAR", label: "🌍 Toute saison", season: ["ALL_YEAR"] },
  { value: "SUMMER", label: "☀️ Été", season: ["SUMMER"] },
  { value: "WINTER", label: "❄️ Hiver", season: ["WINTER"] },
];

export function mealEmoji(meal: Meal): string {
  if (meal.foodMode === "FISH") return "🐟";
  if (meal.foodMode === "VEGETARIAN") return "🥗";
  if (meal.foodMode === "FESTIVE") return "🎉";
  if (meal.foodMode === "RECEPTION") return "🥂";
  const cat: Record<string, string> = {
    PASTA: "🍝", RICE_GRAINS: "🍚", SALAD: "🥗", SOUP: "🍲", MEAT: "🥩",
    FISH: "🐟", VEGETARIAN: "🥦", VEGAN: "🌱", PIZZA_TART: "🍕",
    STEW: "🫕", STIR_FRY: "🍜", SANDWICH: "🥪", OTHER: "🍽️",
  };
  return cat[meal.category] ?? "🍽️";
}

interface MealPickerSheetProps {
  onSelect: (meal: Meal) => void;
  onClose: () => void;
  title?: string;
}

export default function MealPickerSheet({
  onSelect,
  onClose,
  title = "Choisir un repas",
}: MealPickerSheetProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetch("/api/meals")
      .then((r) => r.json())
      .then((data: Meal[]) => { setMeals(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = meals.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreated(meal: Meal) {
    onSelect(meal);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col"
        style={{ background: "var(--card)", maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: "var(--border)" }} />
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="text-sm px-3 py-1 rounded-lg" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
              Fermer
            </button>
          </div>
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              autoFocus
              className="w-full px-4 py-2.5 pl-9 rounded-xl text-sm outline-none"
              style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {loading ? (
            <div className="space-y-2 py-2">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
              <p className="text-2xl mb-2">🍽️</p>
              <p className="text-sm mb-3">Aucun repas trouvé</p>
              <button
                onClick={() => setShowAdd(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "var(--terracotta)" }}
              >
                ➕ Créer ce repas
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => onSelect(meal)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-[0.98]"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  <span className="text-2xl shrink-0">{mealEmoji(meal)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{meal.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {FOOD_MODE_LABELS[meal.foodMode]} · {meal.prepTime + meal.cookTime} min
                      {meal.mealTypes?.includes("LUNCH") && !meal.mealTypes?.includes("DINNER") ? " · Déjeuner" : ""}
                      {meal.mealTypes?.includes("DINNER") && !meal.mealTypes?.includes("LUNCH") ? " · Dîner" : ""}
                    </p>
                  </div>
                  <span className="text-base shrink-0">›</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bouton créer */}
        {!showAdd && filtered.length > 0 && (
          <div className="px-5 py-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ background: "var(--muted)", color: "var(--foreground)" }}
            >
              ➕ Créer un nouveau repas
            </button>
          </div>
        )}

        {/* Formulaire d'ajout rapide */}
        {showAdd && (
          <QuickAddForm
            defaultName={search}
            onCreated={handleCreated}
            onCancel={() => setShowAdd(false)}
          />
        )}
      </div>
    </div>
  );
}

function QuickAddForm({
  defaultName,
  onCreated,
  onCancel,
}: {
  defaultName: string;
  onCreated: (meal: Meal) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [foodMode, setFoodMode] = useState<FoodMode>("MEAT");
  const [mealTypes, setMealTypes] = useState<MealType[]>(["DINNER"]);
  const [budget, setBudget] = useState<Budget>("NORMAL");
  const [difficulty, setDifficulty] = useState<Difficulty>("EASY");
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(20);
  const [season, setSeason] = useState("ALL_YEAR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleMealType(t: MealType) {
    setMealTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function submit() {
    if (!name.trim()) { setError("Le nom est requis"); return; }
    setSaving(true);
    const seasonArr = SEASON_OPTIONS.find((s) => s.value === season)?.season ?? ["ALL_YEAR"];
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), foodMode, mealTypes, budget, difficulty, prepTime, cookTime, season: seasonArr }),
      });
      if (res.ok) {
        const meal: Meal = await res.json();
        onCreated(meal);
      } else {
        setError("Erreur lors de la création");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 pb-4 pt-3 shrink-0 space-y-3 overflow-y-auto" style={{ borderTop: "1px solid var(--border)", maxHeight: "60dvh" }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Nouveau repas</p>
        <button onClick={onCancel} className="text-xs" style={{ color: "var(--muted-foreground)" }}>Annuler</button>
      </div>

      <input
        type="text" value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
        placeholder="Nom du repas"
        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: "var(--muted)", border: `1px solid ${error ? "var(--terracotta)" : "var(--border)"}`, color: "var(--foreground)" }}
      />
      {error && <p className="text-xs" style={{ color: "var(--terracotta)" }}>{error}</p>}

      {/* Déjeuner / Dîner */}
      <div className="flex gap-2">
        {MEAL_TYPE_OPTIONS.map(({ value, label }) => (
          <button key={value} onClick={() => toggleMealType(value)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: mealTypes.includes(value) ? "var(--terracotta)" : "var(--muted)", color: mealTypes.includes(value) ? "white" : "var(--foreground)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Mode alimentaire */}
      <div className="grid grid-cols-5 gap-1">
        {FOOD_MODE_OPTIONS.map(({ value, label }) => (
          <button key={value} onClick={() => setFoodMode(value)}
            className="py-1.5 rounded-lg text-xs font-medium transition-all text-center"
            style={{ background: foodMode === value ? "var(--terracotta)" : "var(--muted)", color: foodMode === value ? "white" : "var(--foreground)" }}>
            {label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Saison + Budget + Difficulté */}
      <div className="flex gap-1">
        {SEASON_OPTIONS.map(({ value, label }) => (
          <button key={value} onClick={() => setSeason(value)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: season === value ? "var(--terracotta)" : "var(--muted)", color: season === value ? "white" : "var(--foreground)" }}>
            {label.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        {BUDGET_OPTIONS.map(({ value, label }) => (
          <button key={value} onClick={() => setBudget(value)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: budget === value ? "var(--terracotta)" : "var(--muted)", color: budget === value ? "white" : "var(--foreground)" }}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        {DIFF_OPTIONS.map(({ value, label }) => (
          <button key={value} onClick={() => setDifficulty(value)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: difficulty === value ? "var(--terracotta)" : "var(--muted)", color: difficulty === value ? "white" : "var(--foreground)" }}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Prép. (min)</p>
          <input type="number" value={prepTime} onChange={(e) => setPrepTime(Math.max(0, +e.target.value || 0))}
            className="w-full px-3 py-2 rounded-xl text-sm text-right outline-none"
            style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="flex-1">
          <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Cuisson (min)</p>
          <input type="number" value={cookTime} onChange={(e) => setCookTime(Math.max(0, +e.target.value || 0))}
            className="w-full px-3 py-2 rounded-xl text-sm text-right outline-none"
            style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
      </div>

      <button
        onClick={submit} disabled={saving}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all active:scale-95"
        style={{ background: "var(--terracotta)" }}
      >
        {saving ? "Création..." : "Créer et sélectionner ✓"}
      </button>
    </div>
  );
}
