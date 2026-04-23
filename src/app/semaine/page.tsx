"use client";

import { useEffect, useState } from "react";
import { format, addDays, addWeeks, startOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import type { PlannedMeal } from "@/types";
import MealCard from "@/components/meals/MealCard";
import GenerateModal, { type GeneratedResult } from "@/components/meals/GenerateModal";
import WeekPlanReview from "@/components/meals/WeekPlanReview";
import { mealEmoji } from "@/components/meals/MealPickerSheet";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function WeekPage() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[] | null>(null);

  const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = addWeeks(baseWeekStart, weekOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Quand on navigue vers une autre semaine, sélectionner son lundi
  // (pas au 1er render : on garde aujourd'hui par défaut)
  const [hasNavigated, setHasNavigated] = useState(false);
  useEffect(() => {
    if (!hasNavigated) return;
    setSelectedDay(weekStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  useEffect(() => {
    fetchMeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

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

  const selectedDayMeals = plannedMeals
    .filter((pm) => isSameDay(new Date(String(pm.date).substring(0, 10) + "T12:00:00"), selectedDay))
    .sort((a, b) => (a.mealType === "LUNCH" ? -1 : 1));

  const weekLabel = weekOffset === 0 ? "Cette semaine" : weekOffset === 1 ? "Semaine prochaine" : weekOffset === -1 ? "Semaine dernière" : `Semaine du ${format(weekStart, "d MMM", { locale: fr })}`;

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header avec navigation de semaine */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { setHasNavigated(true); setWeekOffset((o) => o - 1); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90"
          style={{ background: "var(--muted)", color: "var(--foreground)" }}
        >
          ←
        </button>
        <div className="text-center">
          <h1 className="text-base font-semibold">{weekLabel}</h1>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {format(weekStart, "d MMM", { locale: fr })} — {format(addDays(weekStart, 6), "d MMM", { locale: fr })}
          </p>
        </div>
        <button
          onClick={() => { setHasNavigated(true); setWeekOffset((o) => o + 1); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90"
          style={{ background: "var(--muted)", color: "var(--foreground)" }}
        >
          →
        </button>
      </div>

      {/* Calendrier horizontal */}
      <div className="flex gap-1.5 pb-2 mb-4">
        {weekDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDay);
          const dayMeals = plannedMeals.filter((pm) =>
            isSameDay(new Date(String(pm.date).substring(0, 10) + "T12:00:00"), day)
          );
          const hasLunch = dayMeals.some((pm) => pm.mealType === "LUNCH");
          const hasDinner = dayMeals.some((pm) => pm.mealType === "DINNER");
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-xl transition-all"
              style={{
                background: isSelected ? "var(--terracotta)" : "var(--muted)",
                color: isSelected ? "white" : "var(--foreground)",
              }}
            >
              <span className="text-[9px] font-medium">{DAY_LABELS[i]}</span>
              <span className="text-sm font-semibold">{format(day, "d")}</span>
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: hasLunch ? (isSelected ? "rgba(255,255,255,0.7)" : "var(--gold)") : "transparent" }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: hasDinner ? (isSelected ? "white" : "var(--terracotta)") : "transparent" }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Repas du jour sélectionné */}
      <section className="mb-5">
        <h2 className="text-base font-medium capitalize mb-3">
          {format(selectedDay, "EEEE d MMMM", { locale: fr })}
        </h2>
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

      {/* Vue d'ensemble */}
      {(plannedMeals.length > 0 || !loading) && (
        <section className="mb-5">
          <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
            Vue d'ensemble
          </h2>
          <div className="space-y-1">
            {weekDays.map((day, i) => {
              const dayMeals = plannedMeals
                .filter((pm) => isSameDay(new Date(String(pm.date).substring(0, 10) + "T12:00:00"), day))
                .sort((a, b) => (a.mealType === "LUNCH" ? -1 : 1));
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDay);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all active:opacity-70"
                  style={{
                    background: isSelected ? "var(--muted)" : "var(--card)",
                    border: `1px solid ${isSelected ? "var(--terracotta)" : "var(--border)"}`,
                  }}
                >
                  {/* Jour */}
                  <div className="shrink-0 w-10 text-center">
                    <p className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>{DAY_LABELS[i]}</p>
                    <p className={`text-sm font-bold ${isToday ? "text-white" : ""}`}
                      style={isToday ? { background: "var(--terracotta)", borderRadius: "50%", width: 22, height: 22, lineHeight: "22px", margin: "0 auto" } : {}}>
                      {format(day, "d")}
                    </p>
                  </div>

                  {/* Repas */}
                  <div className="flex-1 min-w-0">
                    {dayMeals.length === 0 ? (
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>—</p>
                    ) : (
                      <div className="space-y-0.5">
                        {dayMeals.map((pm) => (
                          <div key={pm.id} className="flex items-center gap-1.5">
                            <span
                              className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0"
                              style={{
                                background: pm.mealType === "LUNCH" ? "var(--gold)" : "var(--terracotta)",
                                color: "white",
                              }}
                            >
                              {pm.mealType === "LUNCH" ? "Déj" : "Dîn"}
                            </span>
                            <span className="text-sm shrink-0">{mealEmoji(pm.meal)}</span>
                            <span className="text-xs truncate">{pm.meal.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Bouton Générer la semaine */}
      <button
        onClick={() => setShowGenerate(true)}
        className="w-full py-3 rounded-xl font-medium text-white transition-all active:scale-95"
        style={{ background: "var(--terracotta)" }}
      >
        ✨ Générer la semaine
      </button>

      {showGenerate && !generatedResults && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onGenerated={(results) => setGeneratedResults(results)}
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
