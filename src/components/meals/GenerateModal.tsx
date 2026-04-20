"use client";

import { useEffect, useState } from "react";
import type { Settings, Ambiance, Budget } from "@/types";
import SwipeReview from "./SwipeReview";

interface GenerateModalProps {
  onClose: () => void;
  onGenerated: () => void;
}

export default function GenerateModal({ onClose, onGenerated }: GenerateModalProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [ambiance, setAmbiance] = useState<Ambiance>("BALANCED");
  const [budget, setBudget] = useState<Budget>("NORMAL");
  const [vegetarian, setVegetarian] = useState(false);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [generatedMeals, setGeneratedMeals] = useState<object[] | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        setSettings(s);
        setAdults(s.adultsCount);
        setChildren(s.childrenCount);
        setAmbiance(s.defaultAmbiance);
        setBudget(s.defaultBudget);
        setVegetarian(s.vegetarianOverride);
      })
      .catch(() => {});
  }, []);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adults, children, ambiance, budget, vegetarian, days }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGeneratedMeals(data.meals);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  if (generatedMeals) {
    return (
      <SwipeReview
        meals={generatedMeals as never[]}
        onDone={() => { onGenerated(); onClose(); }}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div
        className="w-full max-w-[430px] mx-auto rounded-t-3xl p-6 pb-8"
        style={{ background: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />
        <h2 className="text-xl font-semibold mb-5">Générer ma semaine</h2>

        {/* Famille */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>Adultes</label>
            <Stepper value={adults} min={1} max={10} onChange={setAdults} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>Enfants</label>
            <Stepper value={children} min={0} max={8} onChange={setChildren} />
          </div>
        </div>

        {/* Ambiance */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>Ambiance</label>
          <div className="flex gap-2">
            {([["LIGHT", "🥗 Léger"], ["BALANCED", "⚖️ Équilibré"], ["FUN", "🍕 Fun"]] as [Ambiance, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setAmbiance(v)} className="flex-1 py-2 rounded-xl text-xs font-medium transition-all" style={{ background: ambiance === v ? "var(--terracotta)" : "var(--muted)", color: ambiance === v ? "white" : "var(--foreground)" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>Budget</label>
          <div className="flex gap-2">
            {([["CHEAP", "€ Serré"], ["NORMAL", "€€ Normal"], ["SPLURGE", "€€€ Plaisir"]] as [Budget, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setBudget(v)} className="flex-1 py-2 rounded-xl text-xs font-medium transition-all" style={{ background: budget === v ? "var(--terracotta)" : "var(--muted)", color: budget === v ? "white" : "var(--foreground)" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Jours */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>Nombre de jours ({days})</label>
          <input type="range" min={1} max={7} value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full" style={{ accentColor: "var(--terracotta)" }} />
        </div>

        {/* Végé override */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm">Végétarien uniquement</span>
          <button onClick={() => setVegetarian(!vegetarian)} className="w-12 h-6 rounded-full transition-all relative" style={{ background: vegetarian ? "var(--sage)" : "var(--border)" }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: vegetarian ? "calc(100% - 22px)" : "2px" }} />
          </button>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3 rounded-xl font-medium text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "var(--terracotta)" }}
        >
          {loading ? "Génération en cours..." : "Générer ✨"}
        </button>
      </div>
    </div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium transition-all active:scale-90" style={{ background: "var(--muted)" }}>−</button>
      <span className="text-base font-semibold w-4 text-center">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium transition-all active:scale-90" style={{ background: "var(--muted)" }}>+</button>
    </div>
  );
}
