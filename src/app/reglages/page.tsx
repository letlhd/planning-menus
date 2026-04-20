"use client";

import { useEffect, useState } from "react";
import type { Settings, Budget, FoodMode } from "@/types";

const BUDGET_OPTIONS: { value: Budget; label: string }[] = [
  { value: "CHEAP", label: "€ Serré" },
  { value: "NORMAL", label: "€€ Normal" },
  { value: "SPLURGE", label: "€€€ Plaisir" },
];

const FOOD_MODE_OPTIONS: { value: FoodMode; label: string }[] = [
  { value: "MEAT", label: "🥩 Viande" },
  { value: "FISH", label: "🐟 Poisson" },
  { value: "VEGETARIAN", label: "🥗 Végétarien" },
  { value: "FESTIVE", label: "🎉 Festif" },
];

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 0, label: "Dim" },
];

export default function ReglagesPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: Settings) => { setSettings(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function toggleDay(arr: number[], day: number): number[] {
    return arr.includes(day) ? arr.filter((d) => d !== day) : [...arr, day];
  }

  if (loading || !settings) {
    return <div className="px-4 pt-6"><div className="skeleton h-64 w-full rounded-2xl" /></div>;
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-semibold mb-6">Réglages</h1>

      {/* Famille */}
      <Section title="👨‍👩‍👧 Ma famille">
        <SettingRow label="Adultes">
          <Stepper value={settings.adultsCount} min={1} max={10} onChange={(v) => setSettings({ ...settings, adultsCount: v })} />
        </SettingRow>
        <SettingRow label="Enfants">
          <Stepper value={settings.childrenCount} min={0} max={8} onChange={(v) => setSettings({ ...settings, childrenCount: v })} />
        </SettingRow>
      </Section>

      {/* Préférences par défaut */}
      <Section title="🍽️ Préférences par défaut">
        <SettingRow label="Budget">
          <div className="flex gap-1">
            {BUDGET_OPTIONS.map(({ value, label }) => (
              <button key={value} onClick={() => setSettings({ ...settings, defaultBudget: value })}
                className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                style={{ background: settings.defaultBudget === value ? "var(--terracotta)" : "var(--muted)", color: settings.defaultBudget === value ? "white" : "var(--foreground)" }}>
                {label}
              </button>
            ))}
          </div>
        </SettingRow>

        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
          <p className="text-sm mb-2">Mode alimentaire par défaut</p>
          <div className="grid grid-cols-4 gap-1">
            {FOOD_MODE_OPTIONS.map(({ value, label }) => (
              <button key={value} onClick={() => setSettings({ ...settings, defaultFoodMode: value })}
                className="py-2 rounded-lg text-xs font-medium transition-all text-center"
                style={{ background: settings.defaultFoodMode === value ? "var(--terracotta)" : "var(--muted)", color: settings.defaultFoodMode === value ? "white" : "var(--foreground)" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <SettingRow label="Budget hebdo (€)">
          <input type="number" value={settings.weeklyBudgetGoal ?? ""} onChange={(e) => setSettings({ ...settings, weeklyBudgetGoal: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="100" className="w-20 px-2 py-1 rounded-lg text-sm border text-right outline-none"
            style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </SettingRow>
      </Section>

      {/* Soirées festives */}
      <Section title="🎉 Soirées festives">
        <div className="px-4 py-3" style={{ background: "var(--card)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Ces jours utilisent automatiquement le mode &ldquo;Festif&rdquo;
          </p>
          <div className="flex gap-1.5">
            {DAYS.map(({ value, label }) => (
              <button key={value}
                onClick={() => setSettings({ ...settings, festiveDays: toggleDay(settings.festiveDays ?? [], value) })}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: (settings.festiveDays ?? []).includes(value) ? "var(--terracotta)" : "var(--muted)", color: (settings.festiveDays ?? []).includes(value) ? "white" : "var(--foreground)" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Jours sans déjeuner */}
      <Section title="🚫 Pas de déjeuner ces jours">
        <div className="px-4 py-3" style={{ background: "var(--card)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Aucun repas de midi proposé ces jours-là
          </p>
          <div className="flex gap-1.5">
            {DAYS.map(({ value, label }) => (
              <button key={value}
                onClick={() => setSettings({ ...settings, noLunchDays: toggleDay(settings.noLunchDays ?? [], value) })}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: (settings.noLunchDays ?? []).includes(value) ? "var(--terracotta)" : "var(--muted)", color: (settings.noLunchDays ?? []).includes(value) ? "white" : "var(--foreground)" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Avancé */}
      <Section title="⚙️ Avancé">
        <SettingRow label={`Ratio BDD / Claude (${Math.round(settings.dbRatio * 100)}%)`}>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>BDD</span>
            <input type="range" min={0} max={100} value={Math.round(settings.dbRatio * 100)}
              onChange={(e) => setSettings({ ...settings, dbRatio: parseInt(e.target.value) / 100 })}
              className="w-24" style={{ accentColor: "var(--terracotta)" }} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Claude</span>
          </div>
        </SettingRow>
      </Section>

      <button onClick={save} disabled={saving}
        className="w-full py-3 rounded-xl font-medium text-white transition-all active:scale-95 disabled:opacity-50 mt-2 mb-6"
        style={{ background: saved ? "var(--sage)" : "var(--terracotta)" }}>
        {saved ? "✓ Sauvegardé !" : saving ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{title}</h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 rounded-full flex items-center justify-center text-lg font-medium transition-all active:scale-90" style={{ background: "var(--muted)" }}>−</button>
      <span className="text-base font-semibold w-4 text-center">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="w-7 h-7 rounded-full flex items-center justify-center text-lg font-medium transition-all active:scale-90" style={{ background: "var(--muted)" }}>+</button>
    </div>
  );
}
