"use client";

import { useEffect, useState } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import type { Settings, Ambiance, Budget, MealType, PlannedMeal } from "@/types";

interface SlotConfig {
  date: string;
  mealType: MealType;
  dayLabel: string;
  ambiance: Ambiance;
  budget: Budget;
  vegetarian: boolean;
  adults: number;
  children: number;
  enabled: boolean;
  alreadyPlanned: boolean;
}

interface GenerateModalProps {
  onClose: () => void;
  onGenerated: (meals: GeneratedResult[]) => void;
}

export interface GeneratedResult {
  date: string;
  mealType: MealType;
  meal: Record<string, unknown>;
}

const DAY_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const AMBIANCE_ICONS: Record<Ambiance, string> = { LIGHT: "🥗", BALANCED: "⚖️", FUN: "🍕" };
const BUDGET_LABELS: Record<Budget, string> = { CHEAP: "€", NORMAL: "€€", SPLURGE: "€€€" };

export default function GenerateModal({ onClose, onGenerated }: GenerateModalProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [slots, setSlots] = useState<SlotConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  useEffect(() => {
    async function init() {
      const [sRes, pRes] = await Promise.all([
        fetch("/api/settings"),
        fetch(`/api/planned-meals?weekStart=${format(weekStart, "yyyy-MM-dd")}`),
      ]);
      const s: Settings = await sRes.json();
      const planned: PlannedMeal[] = await pRes.json();
      setSettings(s);

      const plannedKeys = new Set(
        planned.map((pm) => `${String(pm.date).substring(0, 10)}_${pm.mealType}`)
      );

      const newSlots: SlotConfig[] = [];
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dayOfWeek = day.getDay();
        const dateStr = format(day, "yyyy-MM-dd");
        const isFunDay = s.funDays?.includes(dayOfWeek);
        const isNoLunchDay = s.noLunchDays?.includes(dayOfWeek);

        // Dîner
        newSlots.push({
          date: dateStr,
          mealType: "DINNER",
          dayLabel: `${DAY_FR[dayOfWeek]} ${format(day, "d MMM", { locale: fr })}`,
          ambiance: isFunDay ? "FUN" : s.defaultAmbiance,
          budget: s.defaultBudget,
          vegetarian: s.vegetarianEvening ?? s.vegetarianOverride,
          adults: s.adultsCount,
          children: s.childrenCount,
          enabled: true,
          alreadyPlanned: plannedKeys.has(`${dateStr}_DINNER`),
        });

        // Déjeuner (seulement si pas dans noLunchDays)
        if (!isNoLunchDay) {
          newSlots.push({
            date: dateStr,
            mealType: "LUNCH",
            dayLabel: `${DAY_FR[dayOfWeek]} ${format(day, "d MMM", { locale: fr })}`,
            ambiance: s.defaultAmbiance,
            budget: s.defaultBudget,
            vegetarian: s.vegetarianOverride,
            adults: s.adultsCount,
            children: s.childrenCount,
            enabled: true,
            alreadyPlanned: plannedKeys.has(`${dateStr}_LUNCH`),
          });
        }
      }

      // Trier : dîner/déj par date
      newSlots.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.mealType === "DINNER" ? 1 : -1;
      });

      setSlots(newSlots);
    }
    init();
  }, []);

  function updateSlot(key: string, patch: Partial<SlotConfig>) {
    setSlots((prev) =>
      prev.map((s) => (slotKey(s) === key ? { ...s, ...patch } : s))
    );
  }

  function slotKey(s: SlotConfig) {
    return `${s.date}_${s.mealType}`;
  }

  async function generate() {
    setLoading(true);
    const toGenerate = slots.filter((s) => s.enabled && !s.alreadyPlanned);
    try {
      const results: GeneratedResult[] = [];
      // On génère slot par slot avec leurs paramètres
      await Promise.all(
        toGenerate.map(async (slot) => {
          const res = await fetch("/api/generate/slot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adults: slot.adults,
              children: slot.children,
              ambiance: slot.ambiance,
              budget: slot.budget,
              vegetarian: slot.vegetarian,
              mealType: slot.mealType,
            }),
          });
          if (res.ok) {
            const meal = await res.json();
            results.push({ date: slot.date, mealType: slot.mealType, meal });
          }
        })
      );
      onGenerated(results);
    } finally {
      setLoading(false);
    }
  }

  const slotsToGenerate = slots.filter((s) => s.enabled && !s.alreadyPlanned).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col"
        style={{ background: "var(--card)", maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fixe */}
        <div className="px-5 pt-4 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Générer ma semaine</h2>
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {slotsToGenerate} repas à générer
            </span>
          </div>
        </div>

        {/* Liste slots scrollable */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {slots.length === 0 ? (
            <div className="py-8 text-center" style={{ color: "var(--muted-foreground)" }}>
              <p className="text-2xl mb-2">⏳</p>
              <p className="text-sm">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => {
                const key = slotKey(slot);
                const isExpanded = expandedSlot === key;
                return (
                  <SlotRow
                    key={key}
                    slot={slot}
                    isExpanded={isExpanded}
                    onToggleExpand={() => setExpandedSlot(isExpanded ? null : key)}
                    onUpdate={(patch) => updateSlot(key, patch)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Bouton fixe */}
        <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={generate}
            disabled={loading || slotsToGenerate === 0}
            className="w-full py-3 rounded-xl font-medium text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "var(--terracotta)" }}
          >
            {loading ? "Génération en cours..." : `Générer ${slotsToGenerate} repas ✨`}
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotRow({
  slot,
  isExpanded,
  onToggleExpand,
  onUpdate,
}: {
  slot: SlotConfig;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<SlotConfig>) => void;
}) {
  if (slot.alreadyPlanned) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl opacity-50"
        style={{ background: "var(--muted)" }}
      >
        <span className="text-base">✅</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            {slot.dayLabel} · {slot.mealType === "DINNER" ? "Dîner" : "Déjeuner"}
          </p>
          <p className="text-sm">Déjà planifié</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${slot.enabled ? "var(--terracotta)" : "var(--border)"}`, background: "var(--card)" }}
    >
      {/* Ligne principale */}
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => onUpdate({ enabled: !slot.enabled })}
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
          style={{
            borderColor: slot.enabled ? "var(--terracotta)" : "var(--border)",
            background: slot.enabled ? "var(--terracotta)" : "transparent",
          }}
        >
          {slot.enabled && <span className="text-white text-xs">✓</span>}
        </button>

        <div className="flex-1 min-w-0" onClick={onToggleExpand}>
          <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            {slot.dayLabel} · {slot.mealType === "DINNER" ? "Dîner" : "Déjeuner"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm">{AMBIANCE_ICONS[slot.ambiance]}</span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {BUDGET_LABELS[slot.budget]}
            </span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {slot.adults}👨{slot.children > 0 ? `${slot.children}👧` : ""}
            </span>
            {slot.vegetarian && <span className="text-xs">🥗</span>}
          </div>
        </div>

        <button
          onClick={onToggleExpand}
          className="text-lg transition-transform"
          style={{ transform: isExpanded ? "rotate(180deg)" : "none", color: "var(--muted-foreground)" }}
        >
          ›
        </button>
      </div>

      {/* Panneau expandable */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Ambiance */}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Ambiance</p>
            <div className="flex gap-1.5">
              {(["LIGHT", "BALANCED", "FUN"] as Ambiance[]).map((a) => (
                <button
                  key={a}
                  onClick={() => onUpdate({ ambiance: a })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: slot.ambiance === a ? "var(--terracotta)" : "var(--muted)",
                    color: slot.ambiance === a ? "white" : "var(--foreground)",
                  }}
                >
                  {AMBIANCE_ICONS[a]} {a === "LIGHT" ? "Léger" : a === "BALANCED" ? "Équilibré" : "Fun"}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Budget</p>
            <div className="flex gap-1.5">
              {(["CHEAP", "NORMAL", "SPLURGE"] as Budget[]).map((b) => (
                <button
                  key={b}
                  onClick={() => onUpdate({ budget: b })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: slot.budget === b ? "var(--terracotta)" : "var(--muted)",
                    color: slot.budget === b ? "white" : "var(--foreground)",
                  }}
                >
                  {BUDGET_LABELS[b]}
                </button>
              ))}
            </div>
          </div>

          {/* Personnes + Végé */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>👨</span>
              <Stepper value={slot.adults} min={1} max={10} onChange={(v) => onUpdate({ adults: v })} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>👧</span>
              <Stepper value={slot.children} min={0} max={8} onChange={(v) => onUpdate({ children: v })} />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs">🥗</span>
              <Toggle value={slot.vegetarian} onChange={(v) => onUpdate({ vegetarian: v })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, value - 1))} className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ background: "var(--muted)" }}>−</button>
      <span className="text-sm font-semibold w-3 text-center">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ background: "var(--muted)" }}>+</button>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-10 h-5 rounded-full transition-all relative"
      style={{ background: value ? "var(--sage)" : "var(--border)" }}
    >
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: value ? "calc(100% - 18px)" : "2px" }} />
    </button>
  );
}
