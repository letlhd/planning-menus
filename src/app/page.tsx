"use client";

import { useEffect, useState } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import type { PlannedMeal } from "@/types";
import MealCard from "@/components/meals/MealCard";
import GenerateModal from "@/components/meals/GenerateModal";

export default function TodayPage() {
  const [todayMeals, setTodayMeals] = useState<PlannedMeal[]>([]);
  const [weekMeals, setWeekMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);

  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM", { locale: fr });

  useEffect(() => {
    fetchMeals();
  }, []);

  async function fetchMeals() {
    setLoading(true);
    try {
      const weekStart = format(today, "yyyy-MM-dd");
      const res = await fetch(`/api/planned-meals?weekStart=${weekStart}`);
      if (!res.ok) throw new Error();
      const data: PlannedMeal[] = await res.json();
      const todayStr = format(today, "yyyy-MM-dd");
      setTodayMeals(data.filter((m) => m.date === todayStr));
      setWeekMeals(data.slice(0, 5));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-6">
      <div className="mb-6">
        <p className="text-sm capitalize" style={{ color: "var(--muted-foreground)" }}>
          {formattedDate}
        </p>
        <h1 className="text-2xl font-semibold mt-0.5">Bonsoir 👋</h1>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">Ce soir</h2>
        {loading ? (
          <div className="skeleton h-32 w-full rounded-2xl" />
        ) : todayMeals.length > 0 ? (
          <div className="space-y-3">
            {todayMeals.map((pm) => (
              <MealCard key={pm.id} plannedMeal={pm} onUpdate={fetchMeals} />
            ))}
          </div>
        ) : (
          <EmptyDay onGenerate={() => setShowGenerate(true)} />
        )}
      </section>

      {weekMeals.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-3">Cette semaine</h2>
          <div className="space-y-2">
            {weekMeals.map((pm) => (
              <WeekPreviewRow key={pm.id} plannedMeal={pm} />
            ))}
          </div>
        </section>
      )}

      <button
        onClick={() => setShowGenerate(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-40 transition-transform active:scale-95"
        style={{ background: "var(--terracotta)", color: "white" }}
        aria-label="Générer la semaine"
      >
        ✨
      </button>

      {showGenerate && (
        <GenerateModal onClose={() => setShowGenerate(false)} onGenerated={fetchMeals} />
      )}
    </div>
  );
}

function EmptyDay({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="rounded-2xl p-6 text-center" style={{ background: "var(--muted)" }}>
      <p className="text-4xl mb-2">🍽️</p>
      <p className="font-medium mb-1">Rien de prévu ce soir</p>
      <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
        Génère un planning ou ajoute un repas manuellement
      </p>
      <button
        onClick={onGenerate}
        className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity active:opacity-80"
        style={{ background: "var(--terracotta)" }}
      >
        Générer la semaine ✨
      </button>
    </div>
  );
}

function WeekPreviewRow({ plannedMeal: pm }: { plannedMeal: PlannedMeal }) {
  const date = new Date(pm.date + "T00:00:00");
  let dayLabel = format(date, "EEEE", { locale: fr });
  if (isToday(date)) dayLabel = "Aujourd'hui";
  if (isTomorrow(date)) dayLabel = "Demain";

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <span className="text-xs font-medium w-24 capitalize shrink-0" style={{ color: "var(--muted-foreground)" }}>
        {dayLabel}
      </span>
      <span className="font-medium text-sm flex-1 truncate">{pm.meal.name}</span>
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        {pm.meal.prepTime + pm.meal.cookTime} min
      </span>
    </div>
  );
}
