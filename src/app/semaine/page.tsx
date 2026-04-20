"use client";

import { useEffect, useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import type { PlannedMeal } from "@/types";
import MealCard from "@/components/meals/MealCard";
import { mealEmoji } from "@/components/meals/MealPickerSheet";
import GenerateModal, { type GeneratedResult } from "@/components/meals/GenerateModal";
import WeekPlanReview from "@/components/meals/WeekPlanReview";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function WeekPage() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [showGenerate, setShowGenerate] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[] | null>(null);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    fetchMeals();
  }, []);

  async function fetchMeals() {
    setLoading(true);
    try {
      const start = format(weekStart, "yyyy-MM-dd");
      const res = await fetch(`/api/planned-meals?weekStart=${start}`);
      if (!res.ok) throw new Error();
      setPlannedMeals(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const selectedDayMeals = plannedMeals.filter((pm) =>
    isSameDay(new Date(String(pm.date).substring(0, 10) + "T12:00:00"), selectedDay)
  );

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-semibold mb-4">Ma semaine</h1>

      {/* Calendrier horizontal */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
        {weekDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDay);
          const hasMeal = plannedMeals.some((pm) =>
            isSameDay(new Date(String(pm.date).substring(0, 10) + "T12:00:00"), day)
          );
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className="flex flex-col items-center gap-1 min-w-[44px] p-2 rounded-xl transition-all"
              style={{
                background: isSelected ? "var(--terracotta)" : "var(--muted)",
                color: isSelected ? "white" : "var(--foreground)",
              }}
            >
              <span className="text-[10px] font-medium">{DAY_LABELS[i]}</span>
              <span className="text-base font-semibold">{format(day, "d")}</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: hasMeal ? (isSelected ? "white" : "var(--terracotta)") : "transparent" }} />
            </button>
          );
        })}
      </div>

      {/* Repas du jour sélectionné */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium capitalize">
            {format(selectedDay, "EEEE d MMMM", { locale: fr })}
          </h2>
        </div>
        {loading ? (
          <div className="skeleton h-32 w-full rounded-2xl" />
        ) : selectedDayMeals.length > 0 ? (
          <div className="space-y-3">
            {selectedDayMeals.map((pm) => (
              <MealCard key={pm.id} plannedMeal={pm} onUpdate={fetchMeals} allowChange />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl p-6 text-center" style={{ background: "var(--muted)" }}>
            <p className="text-3xl mb-2">📅</p>
            <p className="font-medium mb-1">Aucun repas prévu</p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Génère la semaine ou ajoute un repas
            </p>
          </div>
        )}
      </section>

      {/* Récap semaine */}
      {plannedMeals.length > 0 && (
        <section className="mt-6 mb-6">
          <h2 className="text-base font-medium mb-3" style={{ color: "var(--muted-foreground)" }}>
            Vue d&apos;ensemble
          </h2>
          <div className="space-y-1">
            {weekDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDay);
              const lunch = plannedMeals.find((pm) =>
                isSameDay(new Date(String(pm.date).substring(0, 10) + "T12:00:00"), day) && pm.mealType === "LUNCH"
              );
              const dinner = plannedMeals.find((pm) =>
                isSameDay(new Date(String(pm.date).substring(0, 10) + "T12:00:00"), day) && pm.mealType === "DINNER"
              );
              if (!lunch && !dinner) return null;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all active:opacity-70"
                  style={{
                    background: isSelected ? "var(--terracotta)" : "var(--card)",
                    border: `1px solid ${isSelected ? "var(--terracotta)" : "var(--border)"}`,
                  }}
                >
                  <span
                    className="text-xs font-bold w-7 shrink-0"
                    style={{ color: isSelected ? "white" : "var(--muted-foreground)" }}
                  >
                    {DAY_LABELS[i]}
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    {lunch && (
                      <span className="text-xs flex items-center gap-1 truncate" style={{ color: isSelected ? "white" : "var(--foreground)" }}>
                        <span className="text-sm">{mealEmoji(lunch.meal)}</span>
                        <span
                          className="text-[9px] font-bold px-1 rounded shrink-0"
                          style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "var(--gold)", color: isSelected ? "white" : "white" }}
                        >
                          Déj
                        </span>
                        <span className="truncate">{lunch.meal.name}</span>
                      </span>
                    )}
                    {dinner && (
                      <span className="text-xs flex items-center gap-1 truncate" style={{ color: isSelected ? "rgba(255,255,255,0.85)" : "var(--muted-foreground)" }}>
                        <span className="text-sm">{mealEmoji(dinner.meal)}</span>
                        <span
                          className="text-[9px] font-bold px-1 rounded shrink-0"
                          style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "var(--terracotta)", color: "white" }}
                        >
                          Dîn
                        </span>
                        <span className="truncate">{dinner.meal.name}</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <button
        onClick={() => setShowGenerate(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-40 transition-transform active:scale-95"
        style={{ background: "var(--terracotta)", color: "white" }}
        aria-label="Générer"
      >
        ✨
      </button>

      {showGenerate && !generatedResults && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onGenerated={(results) => { setGeneratedResults(results); }}
        />
      )}

      {generatedResults && (
        <WeekPlanReview
          results={generatedResults}
          onDone={() => { setGeneratedResults(null); setShowGenerate(false); fetchMeals(); }}
          onClose={() => { setGeneratedResults(null); setShowGenerate(false); }}
        />
      )}
    </div>
  );
}
