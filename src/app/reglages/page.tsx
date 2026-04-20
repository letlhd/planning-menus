"use client";

import { useEffect, useState } from "react";
import type { Settings, Budget, Ambiance } from "@/types";

const BUDGET_OPTIONS: { value: Budget; label: string }[] = [
  { value: "CHEAP", label: "€ Serré" },
  { value: "NORMAL", label: "€€ Normal" },
  { value: "SPLURGE", label: "€€€ Plaisir" },
];

const AMBIANCE_OPTIONS: { value: Ambiance; label: string }[] = [
  { value: "LIGHT", label: "🥗 Léger" },
  { value: "BALANCED", label: "⚖️ Équilibré" },
  { value: "FUN", label: "🍕 Fun" },
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

      {/* Préférences */}
      <Section title="🍽️ Préférences">
        <SettingRow label="Budget par défaut">
          <div className="flex gap-1">
            {BUDGET_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSettings({ ...settings, defaultBudget: value })}
                className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: settings.defaultBudget === value ? "var(--terracotta)" : "var(--muted)",
                  color: settings.defaultBudget === value ? "white" : "var(--foreground)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="Ambiance">
          <div className="flex gap-1">
            {AMBIANCE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSettings({ ...settings, defaultAmbiance: value })}
                className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: settings.defaultAmbiance === value ? "var(--terracotta)" : "var(--muted)",
                  color: settings.defaultAmbiance === value ? "white" : "var(--foreground)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="Végétarien par défaut">
          <Toggle value={settings.vegetarianOverride} onChange={(v) => setSettings({ ...settings, vegetarianOverride: v })} />
        </SettingRow>
        <SettingRow label="Budget hebdo (€)">
          <input
            type="number"
            value={settings.weeklyBudgetGoal ?? ""}
            onChange={(e) => setSettings({ ...settings, weeklyBudgetGoal: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="100"
            className="w-20 px-2 py-1 rounded-lg text-sm border text-right outline-none"
            style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </SettingRow>
      </Section>

      {/* Avancé */}
      <Section title="⚙️ Avancé">
        <SettingRow label="Ratio BDD / Claude">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>BDD</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.dbRatio * 100)}
              onChange={(e) => setSettings({ ...settings, dbRatio: parseInt(e.target.value) / 100 })}
              className="w-24"
              style={{ accentColor: "var(--terracotta)" }}
            />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Claude</span>
          </div>
        </SettingRow>
        <SettingRow label="Ratio actuel">
          <span className="text-sm">{Math.round(settings.dbRatio * 100)}% BDD / {100 - Math.round(settings.dbRatio * 100)}% Claude</span>
        </SettingRow>
      </Section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl font-medium text-white transition-all active:scale-95 disabled:opacity-50 mt-2"
        style={{ background: saved ? "var(--sage)" : "var(--terracotta)" }}
      >
        {saved ? "✓ Sauvegardé !" : saving ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-foreground)" }}>{title}</h2>
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

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-12 h-6 rounded-full transition-all relative"
      style={{ background: value ? "var(--sage)" : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}
