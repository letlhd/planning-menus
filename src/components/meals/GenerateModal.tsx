"use client";

import { useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { Settings, FoodMode, SeasonPref, MealType, PlannedMeal } from "@/types";

interface SlotConfig {
  date: string;
  mealType: MealType;
  dayLabel: string;
  foodMode: FoodMode;
  seasonPref: SeasonPref;
  budget: string;
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

const FOOD_MODE_OPTIONS: { value: FoodMode; label: string }[] = [
  { value: "MEAT", label: "🥩 Viande" },
  { value: "FISH", label: "🐟 Poisson" },
  { value: "VEGETARIAN", label: "🥗 Végé" },
  { value: "FESTIVE", label: "🎉 Festif" },
  { value: "RECEPTION", label: "🥂 Récep." },
];

const SEASON_OPTIONS: { value: SeasonPref; label: string }[] = [
  { value: "SUMMER", label: "☀️ Été" },
  { value: "WINTER", label: "❄️ Hiver" },
  { value: "ALL_YEAR", label: "🌍 Toute saison" },
];

const BUDGET_OPTIONS = [
  { value: "CHEAP", label: "€" },
  { value: "NORMAL", label: "€€" },
  { value: "SPLURGE", label: "€€€" },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function GenerateModal({ onClose, onGenerated }: GenerateModalProps) {
  const [slots, setSlots] = useState<SlotConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);

  const today = new Date();
  const nowHour = today.getHours();

  useEffect(() => {
    async function init() {
      // Fetch planned meals for today + next 8 days (spans at most 2 weeks)
      const todayStr = format(today, "yyyy-MM-dd");
      const endDate = addDays(today, 8);
      const endStr = format(endDate, "yyyy-MM-dd");

      const [sRes, pRes1, pRes2] = await Promise.all([
        fetch("/api/settings"),
        fetch(`/api/planned-meals?weekStart=${todayStr}`),
        fetch(`/api/planned-meals?weekStart=${format(addDays(today, 7), "yyyy-MM-dd")}`),
      ]);
      const s: Settings = await sRes.json();
      const planned1: PlannedMeal[] = await pRes1.json();
      const planned2: PlannedMeal[] = await pRes2.json();
      const planned = [...planned1, ...planned2];

      const plannedKeys = new Set(
        planned.map((pm) => `${String(pm.date).substring(0, 10)}_${pm.mealType}`)
      );

      void endStr; // used implicitly via loop

      const lunchModes: FoodMode[] = (s.defaultFoodModes as FoodMode[]) ?? ["MEAT"];
      const dinnerModes: FoodMode[] = (s.defaultDinnerFoodModes as FoodMode[]) ?? ["VEGETARIAN"];

      const newSlots: SlotConfig[] = [];

      for (let i = 0; i < 9; i++) {
        const day = addDays(today, i);
        const dayOfWeek = day.getDay();
        const dateStr = format(day, "yyyy-MM-dd");
        const isFestiveDay = (s.festiveDays ?? [5, 6, 0]).includes(dayOfWeek);
        const isNoLunchDay = (s.noLunchDays ?? [1, 2, 4, 5]).includes(dayOfWeek);

        // Skip today's lunch if past 12h, skip today's dinner if past 19h
        const isToday = i === 0;
        const skipLunch = isToday && nowHour >= 12;
        const skipDinner = isToday && nowHour >= 19;

        // Dîner
        if (!skipDinner) {
          newSlots.push({
            date: dateStr,
            mealType: "DINNER",
            dayLabel: `${DAY_FR[dayOfWeek]} ${format(day, "d MMM", { locale: fr })}`,
            foodMode: isFestiveDay ? "FESTIVE" : pickRandom(dinnerModes),
            seasonPref: "ALL_YEAR",
            budget: s.defaultBudget ?? "NORMAL",
            adults: s.adultsCount ?? 2,
            children: s.childrenCount ?? 2,
            enabled: true,
            alreadyPlanned: plannedKeys.has(`${dateStr}_DINNER`),
          });
        }

        // Déjeuner
        if (!isNoLunchDay && !skipLunch) {
          newSlots.push({
            date: dateStr,
            mealType: "LUNCH",
            dayLabel: `${DAY_FR[dayOfWeek]} ${format(day, "d MMM", { locale: fr })}`,
            foodMode: pickRandom(lunchModes),
            seasonPref: "ALL_YEAR",
            budget: s.defaultBudget ?? "NORMAL",
            adults: s.adultsCount ?? 2,
            children: s.childrenCount ?? 2,
            enabled: true,
            alreadyPlanned: plannedKeys.has(`${dateStr}_LUNCH`),
          });
        }
      }

      newSlots.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.mealType === "DINNER" ? 1 : -1;
      });

      setSlots(newSlots);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function slotKey(s: SlotConfig) { return `${s.date}_${s.mealType}`; }

  function updateSlot(key: string, patch: Partial<SlotConfig>) {
    setSlots((prev) => prev.map((s) => (slotKey(s) === key ? { ...s, ...patch } : s)));
  }

  async function generate() {
    setLoading(true);
    const toGenerate = slots.filter((s) => s.enabled && !s.alreadyPlanned);
    try {
      const results: GeneratedResult[] = [];
      const excludeNames: string[] = [];

      // Sequential generation to avoid duplicates
      for (const slot of toGenerate) {
        const res = await fetch("/api/generate/slot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adults: slot.adults,
            children: slot.children,
            foodMode: slot.foodMode,
            seasonPref: slot.seasonPref,
            budget: slot.budget,
            mealType: slot.mealType,
            exclude: excludeNames,
          }),
        });
        if (res.ok) {
          const meal = await res.json();
          results.push({ date: slot.date, mealType: slot.mealType, meal });
          if (meal?.name) excludeNames.push(meal.name as string);
        }
      }
      onGenerated(results);
    } finally {
      setLoading(false);
    }
  }

  const slotsToGenerate = slots.filter((s) => s.enabled && !s.alreadyPlanned).length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end"
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
              <p className="text-sm">Chargement des paramètres...</p>
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
  const modeLabel = FOOD_MODE_OPTIONS.find((o) => o.value === slot.foodMode)?.label ?? "";
  const seasonLabel = SEASON_OPTIONS.find((o) => o.value === slot.seasonPref)?.label ?? "";

  if (slot.alreadyPlanned) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl opacity-50" style={{ background: "var(--muted)" }}>
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
            <span className="text-xs">{modeLabel}</span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>·</span>
            <span className="text-xs">{seasonLabel}</span>
          </div>
        </div>

        <button
          onClick={onToggleExpand}
          className="text-lg transition-transform shrink-0"
          style={{ transform: isExpanded ? "rotate(90deg)" : "none", color: "var(--muted-foreground)" }}
        >
          ›
        </button>
      </div>

      {/* Panneau expandable */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Mode alimentaire */}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Mode alimentaire</p>
            <div className="grid grid-cols-5 gap-1">
              {FOOD_MODE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onUpdate({ foodMode: value })}
                  className="py-1.5 rounded-lg text-xs font-medium transition-all text-center"
                  style={{
                    background: slot.foodMode === value ? "var(--terracotta)" : "var(--muted)",
                    color: slot.foodMode === value ? "white" : "var(--foreground)",
                  }}
                >
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
                <button
                  key={value}
                  onClick={() => onUpdate({ seasonPref: value })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: slot.seasonPref === value ? "var(--terracotta)" : "var(--muted)",
                    color: slot.seasonPref === value ? "white" : "var(--foreground)",
                  }}
                >
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
                <button
                  key={value}
                  onClick={() => onUpdate({ budget: value })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: slot.budget === value ? "var(--terracotta)" : "var(--muted)",
                    color: slot.budget === value ? "white" : "var(--foreground)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Personnes */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>👨 Adultes</span>
              <Stepper value={slot.adults} min={1} max={10} onChange={(v) => onUpdate({ adults: v })} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>👧 Enfants</span>
              <Stepper value={slot.children} min={0} max={8} onChange={(v) => onUpdate({ children: v })} />
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
      <span className="text-sm font-semibold w-4 text-center">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ background: "var(--muted)" }}>+</button>
    </div>
  );
}
