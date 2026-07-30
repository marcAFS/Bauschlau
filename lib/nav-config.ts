import {
  LayoutDashboard,
  Sparkles,
  Ruler,
  Mic,
  Network,
  CalendarClock,
  Wallet,
  Scale,
  FileText,
  Camera,
  type LucideIcon,
} from "lucide-react";
import type { AktiverTab } from "./types";

export interface TabConfig {
  id: AktiverTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const TABS: TabConfig[] = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
  { id: "wunschliste", label: "Wunschliste & Ideen-Fabrik", shortLabel: "Wunschliste", icon: Sparkles },
  { id: "hoehenrechner", label: "Höhenrechner (OKFF)", shortLabel: "Höhenrechner", icon: Ruler },
  { id: "protokoll", label: "Protokoll-Analysator", shortLabel: "Protokoll", icon: Mic },
  { id: "synergie", label: "Gewerke-Synergie-Finder", shortLabel: "Synergien", icon: Network },
  { id: "timeline", label: "Timeline & Vorlaufzeiten", shortLabel: "Timeline", icon: CalendarClock },
  { id: "budget", label: "Budget & Rechnungen", shortLabel: "Budget", icon: Wallet },
  { id: "maengel", label: "Bau-Anwalt & Norm-Check", shortLabel: "Bau-Anwalt", icon: Scale },
  { id: "ausschreibung", label: "Ausschreibung & Angebote", shortLabel: "Angebote", icon: FileText },
  { id: "fotos", label: "Fotos & Bautagebuch", shortLabel: "Bautagebuch", icon: Camera },
];
