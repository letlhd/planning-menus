"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek } from "date-fns";
import type { ShoppingList, ShoppingItem, Aisle } from "@/types";

const AISLE_CONFIG: Record<Aisle, { emoji: string; label: string }> = {
  PRODUCE: { emoji: "🥬", label: "Fruits & Légumes" },
  MEAT_FISH: { emoji: "🥩", label: "Viandes & Poissons" },
  DAIRY: { emoji: "🧀", label: "Frais" },
  GROCERY: { emoji: "🫙", label: "Épicerie" },
  FROZEN: { emoji: "❄️", label: "Surgelés" },
  OTHER: { emoji: "🧴", label: "Autres" },
};

const AISLE_ORDER: Aisle[] = ["PRODUCE", "MEAT_FISH", "DAIRY", "GROCERY", "FROZEN", "OTHER"];

export default function CoursesPage() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newItem, setNewItem] = useState("");

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch(`/api/shopping?weekStart=${weekStart}`);
      if (res.ok) setList(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function generateList() {
    setGenerating(true);
    try {
      const res = await fetch("/api/shopping/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      if (res.ok) {
        setList(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  }

  async function toggleItem(itemId: string, isChecked: boolean) {
    if (!list) return;
    const updated = { ...list, items: list.items.map((i) => i.id === itemId ? { ...i, isChecked } : i) };
    setList(updated);
    await fetch(`/api/shopping/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isChecked }),
    });
  }

  async function addManualItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim() || !list) return;
    const res = await fetch("/api/shopping/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId: list.id, name: newItem.trim(), quantity: 1, unit: "", aisle: "OTHER", isManual: true }),
    });
    if (res.ok) {
      const item = await res.json();
      setList({ ...list, items: [...list.items, item] });
      setNewItem("");
    }
  }

  const checkedCount = list?.items.filter((i) => i.isChecked).length ?? 0;
  const totalCount = list?.items.length ?? 0;

  if (loading) {
    return <div className="px-4 pt-6"><div className="skeleton h-64 w-full rounded-2xl" /></div>;
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Courses</h1>
        {list && (
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {checkedCount}/{totalCount}
          </span>
        )}
      </div>

      {!list ? (
        <div className="rounded-2xl p-6 text-center" style={{ background: "var(--muted)" }}>
          <p className="text-4xl mb-2">🛒</p>
          <p className="font-medium mb-1">Aucune liste pour cette semaine</p>
          <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
            Génère une liste depuis les repas planifiés
          </p>
          <button
            onClick={generateList}
            disabled={generating}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity active:opacity-80 disabled:opacity-50"
            style={{ background: "var(--terracotta)" }}
          >
            {generating ? "Génération..." : "Générer la liste 🛒"}
          </button>
        </div>
      ) : (
        <>
          {/* Progression */}
          <div className="mb-4 rounded-xl p-3" style={{ background: "var(--muted)" }}>
            <div className="flex justify-between text-sm mb-1">
              <span>{checkedCount} articles cochés</span>
              {list.totalCost && <span className="font-medium">~{list.totalCost.toFixed(0)}€</span>}
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${totalCount ? (checkedCount / totalCount) * 100 : 0}%`, background: "var(--terracotta)" }}
              />
            </div>
          </div>

          {/* Rayons */}
          {AISLE_ORDER.map((aisle) => {
            const items = list.items.filter((i) => i.aisle === aisle);
            if (items.length === 0) return null;
            const { emoji, label } = AISLE_CONFIG[aisle];
            return (
              <section key={aisle} className="mb-4">
                <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                  {emoji} {label}
                </h2>
                <div className="space-y-1">
                  {items.map((item) => (
                    <ShoppingItemRow key={item.id} item={item} onToggle={toggleItem} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Ajout manuel */}
          <form onSubmit={addManualItem} className="flex gap-2 mt-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Ajouter un article..."
              className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "var(--terracotta)" }}
            >
              +
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function ShoppingItemRow({ item, onToggle }: { item: ShoppingItem; onToggle: (id: string, checked: boolean) => void }) {
  return (
    <button
      onClick={() => onToggle(item.id, !item.isChecked)}
      className="flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all active:opacity-70"
      style={{ background: "var(--card)", border: "1px solid var(--border)", opacity: item.isChecked ? 0.5 : 1 }}
    >
      <span
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: item.isChecked ? "var(--sage)" : "var(--border)", background: item.isChecked ? "var(--sage)" : "transparent" }}
      >
        {item.isChecked && <span className="text-white text-xs">✓</span>}
      </span>
      <span className={`flex-1 text-sm ${item.isChecked ? "line-through" : ""}`}>
        {item.name}
      </span>
      {item.quantity > 0 && (
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {item.quantity} {item.unit}
        </span>
      )}
    </button>
  );
}
