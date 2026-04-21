"use client";

import { useEffect, useState } from "react";
import { format, addDays, addWeeks, startOfWeek, isSameDay, isSameWeek } from "date-fns";
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[] | null>(null);

  const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = addWeeks(baseWeekStart, weekOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);

  const isCurrentWeek = weekOffset === 0;
  const weekLabel = `${format(weekStart, "d MMM", { locale: fr })} – ${format(weekEnd, "d MMM", { locale: fr })}`;

  useEffect(() => {
    // Quand on change de semaine, sélectionner le lundi de la semaine affichée
    // (ou aujourd'hui si c'est la semaine courante)
    if (weekOffset === 0) {
      setSelectedDay(new Date());
    } else {
      setSelectedDay(weekStart);
    }
    fetchMeals();
  }, [weekOffset]);

  async function fetchMeals() {
    setLoading(true);
    try {
      const start = format(addWeeks(baseWeekStart, weekOffset), "yyyy-MM-dd");
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
    .sort((a, b) => a.mealType === "LUNCH" ? -1 : 1);

  return (
    <div className="px-4 pt-4">

      {/* Header semaine avec navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
          aria-label="Semaine précédente"
        >
          ‹
        </button>

        <div className="text-center">
          <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            {isCurrentWeek ? "Cette semaine" : weekOffset === -1 ? "Semaine dernière" : weekOffset === 1 ? "Semaine prochaine" : `S${weekOffset > 0 ? "+" : ""}${weekOffset}`}
          </p>
          <p className="text-sm font-semibold">{weekLabel}</p>
        </div>

        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
          aria-label="Semaine suivante"
        >
          ›
        </button>
      </div>

      {/* Bouton Générer la semaine */}
      <button
        onClick={() => setShowGenerate(true)}
        className="w-full py-3 rounded-xl font-medium text-white mb-4 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        style={{ background: "var(--terracotta)" }}
      >
        <span>✨</span>
        <span>Générer la semaine</span>
      </button>

      {/* Calendrier horizontal */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4">
        {weekDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());
          const hasMeal = plannedMeals.some((pm) =>
            isSameDay(new Date(String(pm.date).substring(0, 10) + "T12:00:00"), day)
          );
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className="flex flex-col items-center gap-0.5 min-w-[42px] py-2 rounded-xl transition-all"
              style={{
                background: isSelected ? "var(--terracotta)" : "var(--muted)",
                color: isSelected ? "white" : "var(--foreground)",
              }}
            >
              <span className="text-[10px] font-medium" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "var(--muted-foreground)" }}>
                {DAY_LABELS[i]}
              </span>
              <span className="text-base font-semibold leading-none">{format(day, "d")}</span>
              {isToday && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: isSelected ? "white" : "var(--terracotta)" }} />
              )}
              {!isToday && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: hasMeal ? (isSelected ? "rgba(255,255,255,0.6)" : "var(--terracotta)") : "transparent" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Repas du jour sélectionné */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3 capitalize">
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
          <div className="rounded-2xl p-5 text-center" style={{ background: "var(--muted)" }}>
            <p className="text-2xl mb-1">📅</p>
            <p className="text-sm font-medium mb-0.5">Aucun repas prévu</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Génère la semaine ou choisis un repas ci-dessus
            </p>
          </div>
        )}
      </section>

      {/* Vue d'ensemble de la semaine sélectionnée */}
      {plannedMeals.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
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
                        <span className="text-[9px] font-bold px-1 rounded shrink-0" style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "var(--gold)", color: "white" }}>Déj</span>
                        <span className="truncate">{lunch.meal.name}</span>
                      </span>
                    )}
                    {dinner && (
                      <span className="text-xs flex items-center gap-1 truncate" style={{ color: isSelected ? "rgba(255,255,255,0.85)" : "var(--muted-foreground)" }}>
                        <span className="text-sm">{mealEmoji(dinner.meal)}</span>
                        <span className="text-[9px] font-bold px-1 rounded shrink-0" style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "var(--terracotta)", color: "white" }}>Dîn</span>
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
