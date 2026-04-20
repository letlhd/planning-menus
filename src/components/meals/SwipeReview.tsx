"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import type { Meal } from "@/types";

interface SwipeReviewProps {
  meals: Meal[];
  onDone: () => void;
  onClose: () => void;
}

const REJECT_REASONS = ["Trop long", "Pas végé", "Plus fun", "Budget", "Autre chose"];

export default function SwipeReview({ meals, onDone, onClose }: SwipeReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validated, setValidated] = useState<Meal[]>([]);
  const [showRejectReasons, setShowRejectReasons] = useState(false);
  const [replacements, setReplacements] = useState<Record<number, Meal>>({});

  const current = replacements[currentIndex] ?? meals[currentIndex];
  const isLast = currentIndex >= meals.length;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  async function handleAccept() {
    setValidated((prev) => [...prev, current]);
    if (currentIndex + 1 >= meals.length) {
      await saveAll([...validated, current]);
    } else {
      setCurrentIndex((i) => i + 1);
      setShowRejectReasons(false);
    }
  }

  async function handleReject(reason?: string) {
    try {
      const res = await fetch("/api/generate/replacement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealName: current.name, reason, exclude: meals.map((m) => m.name) }),
      });
      if (res.ok) {
        const replacement = await res.json();
        setReplacements((prev) => ({ ...prev, [currentIndex]: replacement }));
      }
    } catch {
      // skip to next on error
    }
    setShowRejectReasons(false);
  }

  async function saveAll(mealsToSave: Meal[]) {
    await fetch("/api/planned-meals/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meals: mealsToSave }),
    });
    onDone();
  }

  async function validateAll() {
    await saveAll(meals.map((m, i) => replacements[i] ?? m));
    onDone();
  }

  if (isLast) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
        <div className="rounded-3xl p-8 text-center mx-4 w-full max-w-[380px]" style={{ background: "var(--card)" }}>
          <p className="text-5xl mb-3">🎉</p>
          <h2 className="text-xl font-semibold mb-2">Semaine planifiée !</h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            {validated.length} repas enregistrés
          </p>
          <button onClick={onDone} className="w-full py-3 rounded-xl font-medium text-white" style={{ background: "var(--terracotta)" }}>
            Voir ma semaine 📅
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.9)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={onClose} className="text-white text-sm">Annuler</button>
        <span className="text-white text-sm">{currentIndex + 1} / {meals.length}</span>
        <button onClick={validateAll} className="text-sm font-medium" style={{ color: "var(--gold)" }}>Tout valider</button>
      </div>

      {/* Progress */}
      <div className="px-4 mb-6">
        <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((currentIndex) / meals.length) * 100}%`, background: "var(--terracotta)" }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex + (replacements[currentIndex] ? "-r" : "")}
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) handleAccept();
              else if (info.offset.x < -100) setShowRejectReasons(true);
            }}
            className="swipe-card w-full rounded-3xl p-6 cursor-grab active:cursor-grabbing"
            style={{ background: "var(--card)", maxWidth: 380 } as never}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2 className="text-2xl font-semibold mb-2">{current.name}</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {current.isVegetarian && <Tag>🥗 Végé</Tag>}
              {current.isFish && <Tag>🐟 Poisson</Tag>}
              {current.canPrepAhead && <Tag>⏰ Prép. à l&apos;avance</Tag>}
              <Tag>⏱ {current.prepTime + current.cookTime} min</Tag>
              <Tag>
                {current.budget === "CHEAP" ? "€" : current.budget === "NORMAL" ? "€€" : "€€€"}
              </Tag>
            </div>

            {current.ingredients?.slice(0, 5).map((ing, i) => (
              <div key={i} className="text-sm py-1 border-b" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                {ing.quantity} {ing.unit} {ing.name}
              </div>
            ))}
            {(current.ingredients?.length ?? 0) > 5 && (
              <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                + {current.ingredients.length - 5} autres ingrédients
              </p>
            )}

            <p className="text-xs text-center mt-4" style={{ color: "var(--muted-foreground)" }}>
              Glisse → pour valider · ← pour refuser
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Boutons */}
      {!showRejectReasons ? (
        <div className="flex gap-4 px-8 pb-12">
          <button
            onClick={() => setShowRejectReasons(true)}
            className="flex-1 py-4 rounded-2xl text-3xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,100,100,0.2)", border: "2px solid rgba(255,100,100,0.5)" }}
          >
            ❌
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-4 rounded-2xl text-3xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(100,200,100,0.2)", border: "2px solid rgba(100,200,100,0.5)" }}
          >
            ✅
          </button>
        </div>
      ) : (
        <div className="px-4 pb-12">
          <p className="text-white text-sm text-center mb-3">Pourquoi ce refus ?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {REJECT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => handleReject(reason)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                {reason}
              </button>
            ))}
            <button
              onClick={() => setShowRejectReasons(false)}
              className="px-4 py-2 rounded-xl text-sm"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "var(--muted)", color: "var(--foreground)" }}>
      {children}
    </span>
  );
}
