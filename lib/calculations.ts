import type { RaumProfil } from "./types";

export interface HoehenrechnerErgebnis {
  okffMm: number;
  meterrissMm: number;
  tuerRohbauoeffnungMm: number;
  effektiveBruestungshoeheMm: number | null;
  lichteRaumhoeheMm: number | null;
  warnungen: string[];
}

const STANDARD_LICHTE_TUERHOEHE_MM = 1985; // DIN 18100 Standardmaß
const ZARGENZUGABE_MM = 26; // Blockzarge, Zugabe oben

export function berechneRaum(profil: RaumProfil): HoehenrechnerErgebnis {
  const okffMm = profil.daemmungMm + profil.fbhMm + profil.estrichMm + profil.belagMm;
  const meterrissMm = okffMm + 1000;
  const tuerRohbauoeffnungMm = STANDARD_LICHTE_TUERHOEHE_MM + ZARGENZUGABE_MM + okffMm;

  const warnungen: string[] = [];

  let effektiveBruestungshoeheMm: number | null = null;
  if (profil.fensterBrhRohMm && profil.fensterBrhRohMm > 0) {
    effektiveBruestungshoeheMm = profil.fensterBrhRohMm - okffMm;
    if (effektiveBruestungshoeheMm < 600) {
      warnungen.push(
        `Kritisch: Effektive Brüstungshöhe in "${profil.raumName}" beträgt nur ${(effektiveBruestungshoeheMm / 10).toFixed(1)} cm ab Fertigfußboden. Absturzsicherung zwingend erforderlich (DIN 18065)!`
      );
    } else if (effektiveBruestungshoeheMm < 900) {
      warnungen.push(
        `Achtung: Bei ${(okffMm / 10).toFixed(1)} cm Bodenaufbau sinkt die Brüstungshöhe in "${profil.raumName}" auf ${(effektiveBruestungshoeheMm / 10).toFixed(1)} cm – unter 90 cm. Absturzsicherung/Festverglasung nach DIN 18065 prüfen!`
      );
    }
  }

  let lichteRaumhoeheMm: number | null = null;
  if (profil.rohdeckeHoeheMm && profil.rohdeckeHoeheMm > 0) {
    lichteRaumhoeheMm = profil.rohdeckeHoeheMm - okffMm;
    if (lichteRaumhoeheMm < 2300) {
      warnungen.push(
        `Lichte Raumhöhe in "${profil.raumName}" sinkt auf ${(lichteRaumhoeheMm / 10).toFixed(1)} cm – Mindesthöhe für Aufenthaltsräume (i. d. R. 2,30 m nach Landesbauordnung) prüfen!`
      );
    }
  }

  if (okffMm > 150) {
    warnungen.push(
      `Bodenaufbau in "${profil.raumName}" ist mit ${(okffMm / 10).toFixed(1)} cm sehr hoch – Auswirkung auf Türanschlüsse, Treppenantritt und Heizkörperabstand prüfen.`
    );
  }

  if (profil.estrichMm > 0 && profil.estrichMm < 45 && profil.fbhMm > 0) {
    warnungen.push(
      `Estrichüberdeckung über Fußbodenheizung in "${profil.raumName}" wirkt knapp (${profil.estrichMm} mm) – Mindestüberdeckung laut Estrichleger-Vorgabe prüfen (i. d. R. ≥ 45 mm über Rohren).`
    );
  }

  return { okffMm, meterrissMm, tuerRohbauoeffnungMm, effektiveBruestungshoeheMm, lichteRaumhoeheMm, warnungen };
}

export function formatMm(mm: number): string {
  return `${(mm / 10).toFixed(1)} cm`;
}
