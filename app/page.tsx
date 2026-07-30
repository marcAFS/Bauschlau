"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import Header from "@/components/Header";
import TabNav from "@/components/TabNav";
import { useBauSchlauStore } from "@/lib/store";
import ImportLegacyDataBanner, { hasHandledLegacyImport } from "@/components/ImportLegacyDataBanner";
import DashboardModule from "@/components/modules/DashboardModule";
import WunschlisteModule from "@/components/modules/WunschlisteModule";
import HoehenrechnerModule from "@/components/modules/HoehenrechnerModule";
import ProtokollModule from "@/components/modules/ProtokollModule";
import SynergieModule from "@/components/modules/SynergieModule";
import TimelineModule from "@/components/modules/TimelineModule";
import BudgetModule from "@/components/modules/BudgetModule";
import MaengelModule from "@/components/modules/MaengelModule";
import AusschreibungModule from "@/components/modules/AusschreibungModule";
import FotosModule from "@/components/modules/FotosModule";

function hasAnyLocalData(): boolean {
  const s = useBauSchlauStore.getState();
  return (
    s.tasks.length > 0 ||
    s.wuensche.length > 0 ||
    s.raumProfile.length > 0 ||
    s.protokolle.length > 0 ||
    s.fotos.length > 0 ||
    s.rechnungen.length > 0 ||
    s.angebote.length > 0 ||
    s.bautagebuch.length > 0 ||
    s.mangelChat.length > 0
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showImportBanner, setShowImportBanner] = useState(false);
  const aktiverTab = useBauSchlauStore((s) => s.aktiverTab);
  const hydrateFromServer = useBauSchlauStore((s) => s.hydrateFromServer);
  const syncError = useBauSchlauStore((s) => s.syncError);
  const clearSyncError = useBauSchlauStore((s) => s.clearSyncError);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (hasAnyLocalData() && !hasHandledLegacyImport()) {
      setShowImportBanner(true);
    } else {
      hydrateFromServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <TabNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {showImportBanner && (
          <ImportLegacyDataBanner
            onSkip={() => setShowImportBanner(false)}
            onImported={() => {
              setShowImportBanner(false);
              hydrateFromServer();
            }}
          />
        )}
        {syncError && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {syncError}
            </span>
            <button onClick={clearSyncError} className="shrink-0 rounded-lg p-1 hover:bg-red-500/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {aktiverTab === "dashboard" && <DashboardModule />}
        {aktiverTab === "wunschliste" && <WunschlisteModule />}
        {aktiverTab === "hoehenrechner" && <HoehenrechnerModule />}
        {aktiverTab === "protokoll" && <ProtokollModule />}
        {aktiverTab === "synergie" && <SynergieModule />}
        {aktiverTab === "timeline" && <TimelineModule />}
        {aktiverTab === "budget" && <BudgetModule />}
        {aktiverTab === "maengel" && <MaengelModule />}
        {aktiverTab === "ausschreibung" && <AusschreibungModule />}
        {aktiverTab === "fotos" && <FotosModule />}
      </main>
      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-600">
        Bau-Schlau · Deine Daten werden dauerhaft in der Datenbank gespeichert
      </footer>
    </>
  );
}
