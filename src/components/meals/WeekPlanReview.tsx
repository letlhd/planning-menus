"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { GeneratedResult } from "./GenerateModal";
import type { Meal } from "@/types";

const SWAP_REASONS = ["Plus fun 🍕", "Plus léger 🥗", "Moins cher 💰", "Plus élaboré ⭐", "Végétarien 🥦", "Autre chose 🔀"];
const BUDGET_LABELS: Record<string, string> = { CHEAP: "€", NORMAL: "€€", SPLURGE: "€€€" };
const DIFF_LABELS: Record<string, string> = { EASY: "Facile", MEDIUM: "Moyen", HARD: "Difficile" };

interface WeekPlanReviewProps {
  results: GeneratedResult[];
  onDone: () => void;
  onClose: () => void;
}

interface SlotState {
  date: string;
  mealType: string;
  meal: Meal;
  validated: boolean;
  swapping: boolean;
}

export default function WeekPlanReview({ results, onDone, onClose }: WeekPlanReviewProps) {
  const [slots, setSlots] = useState<SlotState[]>(() =>
    results.map((r) => ({
      date: r.date,
      mealType: r.mealType,
      meal: r.meal as unknown as Meal,
      validated: false,
      swapping: false,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [activeSwap, setActiveSwap] = useState<string | null>(null);

  const validatedCount = slots.filter((s) => s.validated).length;

  function slotKey(s: { date: string; mealType: string }) {
    return `${s.date}_${s.mealType}`;
  }

  function toggleValidate(key: string) {
    setSlots((prev) =>
      prev.map((s) => (slotKey(s) === key ? { ...s, validated: !s.validated } : s))
    );
  }

  function validateAll() {
    setSlots((prev) => prev.map((s) => ({ ...s, validated: true })));
  }

  async function swap(key: string, reason: string) {
    const slot = slots.find((s) => slotKey(s) === key);
    if (!slot) return;
    setSlots((prev) => prev.map((s) => slotKey(s) === key ? { ...s, swapping: true } : s));
    setActiveSwap(null);

    try {
      const res = await fetch("/api/generate/replacement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: slot.meal.name,
          reason,
          exclude: slots.map((s) => s.meal.name),
        }),
      });
      if (res.ok) {
        const newMeal = await res.json();
        setSlots((prev) => prev.map((s) => slotKey(s) === key ? { ...s, meal: newMeal, swapping: false } : s));
      } else {
        setSlots((prev) => prev.map((s) => slotKey(s) === key ? { ...s, swapping: false } : s));
      }
    } catch {
      setSlots((prev) => prev.map((s) => slotKey(s) === key ? { ...s, swapping: false } : s));
    }
  }

  async function saveValidated() {
    const toSave = slots.filter((s) => s.validated);
    if (toSave.length === 0) return;
    setSaving(true);
    try {
      await fetch("/api/planned-meals/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meals: toSave.map((s) => ({
            name: s.meal.name,
            date: s.date,
            mealType: s.mealType,
          })),
      }),
      });
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={onClose} className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          ← Annuler
        </button>
        <h1 className="font-semibold text-base">Mes repas proposés</h1>
        <button
          onClick={validateAll}
          className="text-sm font-medium"
          style={{ color: "var(--terracotta)" }}
        >
          Tout valider
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
          <span>{validatedCount} validé{validatedCount > 1 ? "s" : ""} sur {slots.length}</span>
          <span>{slots.length - validatedCount} restant{slots.length - validatedCount > 1 ? "s" : ""}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${slots.length ? (validatedCount / slots.length) * 100 : 0}%`, background: "var(--terracotta)" }}
          />
        </div>
      </div>

      {/* Liste scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {slots.map((slot) => {
          const key = slotKey(slot);
          const date = new Date(slot.date + "T12:00:00");
          const dayLabel = format(date, "EEEE d MMMM", { locale: fr });
          const isSwapOpen = activeSwap === key;

          return (
            <div
              key={key}
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                border: `2px solid ${slot.validated ? "var(--sage)" : "var(--border)"}`,
                background: "var(--card)",
                opacity: slot.swapping ? 0.6 : 1,
              }}
            >
              {/* En-tête du slot */}
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{ background: slot.validated ? "var(--sage)" : "var(--muted)" }}
              >
                <span className="text-xs font-semibold capitalize" style={{ color: slot.validated ? "white" : "var(--muted-foreground)" }}>
                  {dayLabel}
                </span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(0,0,0,0.1)", color: slot.validated ? "white" : "var(--muted-foreground)" }}
                >
                  {slot.mealType === "DINNER" ? "Dîner" : "Déjeuner"}
                </span>
              </div>

              {/* Contenu */}
              <div className="p-4">
                {slot.swapping ? (
                  <div className="flex items-center gap-2 py-2" style={{ color: "var(--muted-foreground)" }}>
                    <span className="animate-spin text-lg">🔄</span>
                    <span className="text-sm">Recherche d&apos;un autre repas...</span>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-base mb-1">{slot.meal.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {slot.meal.isVegetarian && <Tag>🥗 Végé</Tag>}
                      {slot.meal.isFish && <Tag>🐟 Poisson</Tag>}
                      {slot.meal.canPrepAhead && <Tag>⏰ Prép. avance</Tag>}
                      <Tag>⏱ {(slot.meal.prepTime ?? 0) + (slot.meal.cookTime ?? 0)} min</Tag>
                      {slot.meal.budget && <Tag>{BUDGET_LABELS[slot.meal.budget] ?? slot.meal.budget}</Tag>}
                      {slot.meal.difficulty && <Tag>{DIFF_LABELS[slot.meal.difficulty] ?? slot.meal.difficulty}</Tag>}
                    </div>

                    {/* Boutons actions */}
                    {!isSwapOpen ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleValidate(key)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                          style={{
                            background: slot.validated ? "var(--sage)" : "var(--terracotta)",
                            color: "white",
                          }}
                        >
                          {slot.validated ? "✓ Validé" : "✓ Valider"}
                        </button>
                        <button
                          onClick={() => setActiveSwap(key)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                          style={{ background: "var(--muted)", color: "var(--foreground)" }}
                        >
                          🔄 Changer
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>
                          Pourquoi changer ?
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {SWAP_REASONS.map((reason) => (
                            <button
                              key={reason}
                              onClick={() => swap(key, reason)}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                              style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setActiveSwap(null)}
                          className="text-xs w-full text-center py-1"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton enregistrer */}
      <div className="px-4 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <button
          onClick={saveValidated}
          disabled={saving || validatedCount === 0}
          className="w-full py-3 rounded-xl font-medium text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "var(--terracotta)" }}
        >
          {saving ? "Enregistrement..." : `Enregistrer ${validatedCount} repas ✓`}
        </button>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-lg text-xs" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
      {children}
    </span>
  );
}
