"use client";

import { useBauSchlauStore } from "@/lib/store";
import { TABS } from "@/lib/nav-config";

export default function TabNav() {
  const aktiverTab = useBauSchlauStore((s) => s.aktiverTab);
  const setAktiverTab = useBauSchlauStore((s) => s.setAktiverTab);

  return (
    <div className="sticky top-[57px] z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = aktiverTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAktiverTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                active
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                  : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
