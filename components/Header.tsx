"use client";

import { HardHat, Camera, Sparkles, Ruler, Receipt } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import LogoutButton from "./LogoutButton";

const QUICK_ACCESS = [
  { id: "fotos" as const, label: "Bautagebuch", icon: Camera },
  { id: "wunschliste" as const, label: "Wunschliste", icon: Sparkles },
  { id: "hoehenrechner" as const, label: "Höhenrechner", icon: Ruler },
  { id: "budget" as const, label: "Rechnung hochladen", icon: Receipt },
];

export default function Header() {
  const setAktiverTab = useBauSchlauStore((s) => s.setAktiverTab);
  const aktiverTab = useBauSchlauStore((s) => s.aktiverTab);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-lg shadow-orange-500/20">
            <HardHat className="h-6 w-6 text-zinc-950" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-bold tracking-tight text-zinc-50 sm:text-xl">
              Bau-Schlau
            </h1>
            <p className="hidden text-xs text-zinc-400 sm:block">
              Dein intelligenter 3D-Bauleiter &amp; Sanierungs-Hub
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          {QUICK_ACCESS.map((qa) => {
            const Icon = qa.icon;
            const active = aktiverTab === qa.id;
            return (
              <button
                key={qa.id}
                onClick={() => setAktiverTab(qa.id)}
                title={qa.label}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition sm:px-3 ${
                  active
                    ? "bg-orange-500/15 text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{qa.label}</span>
              </button>
            );
          })}
          <div className="ml-1 h-5 w-px bg-zinc-800" />
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
