"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/semaine", icon: "📅", label: "Semaine" },
  { href: "/courses", icon: "🛒", label: "Courses" },
  { href: "/recettes", icon: "📖", label: "Recettes" },
  { href: "/reglages", icon: "⚙️", label: "Réglages" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
      style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-around px-2 pb-safe pt-2">
        {navItems.map(({ href, icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 min-w-[48px] min-h-[48px] justify-center rounded-xl transition-all"
              style={{
                color: isActive ? "var(--terracotta)" : "var(--muted-foreground)",
                fontWeight: isActive ? "600" : "400",
              }}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-[10px] mt-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
