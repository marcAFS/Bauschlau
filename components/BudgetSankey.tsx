"use client";

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const formatCurrency = (n: number) => euro.format(n);

export interface SankeyKnoten {
  key: string;
  label: string;
  value: number;
  color: string;
  detail?: string;
  geplant?: boolean; // schraffiert darstellen (noch nicht umgesetzt)
}

export interface SankeyFluss {
  von: string;
  nach: string;
  value: number;
}

interface Props {
  quellen: SankeyKnoten[];
  ziele: SankeyKnoten[];
  fluesse: SankeyFluss[];
}

const W = 820;
const NODE_W = 14;
const X_LEFT = 190;
const X_RIGHT = 570;
const BAR_H = 300;
const MIN_H = 2;
const GAP = 8;
const SLOT_LEFT = 34;
const SLOT_RIGHT = 32;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;

function kuerzen(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function band(x0: number, y0a: number, y0b: number, x1: number, y1a: number, y1b: number) {
  const xm = (x0 + x1) / 2;
  return `M${x0},${y0a} C${xm},${y0a} ${xm},${y1a} ${x1},${y1a} L${x1},${y1b} C${xm},${y1b} ${xm},${y0b} ${x0},${y0b} Z`;
}

interface Platziert extends SankeyKnoten {
  h: number;
  y: number; // Oberkante des Knotens
  mitte: number; // vertikale Mitte des Slots (für Label)
}

function hoehen(knoten: SankeyKnoten[], total: number, minSlot: number) {
  const hs = knoten.map((k) => Math.max((k.value / total) * BAR_H, MIN_H));
  const slots = hs.map((h) => Math.max(h, minSlot));
  const colH = slots.reduce((a, s) => a + s, 0) + GAP * Math.max(knoten.length - 1, 0);
  return { hs, slots, colH };
}

// Verteilt Knoten einer Spalte untereinander; jeder bekommt mindestens Platz für sein Label.
function platziere(knoten: SankeyKnoten[], total: number, minSlot: number, innerH: number): Platziert[] {
  const { hs, slots, colH } = hoehen(knoten, total, minSlot);
  let cursor = PAD_TOP + (innerH - colH) / 2;
  return knoten.map((k, i) => {
    const out = { ...k, h: hs[i], y: cursor + (slots[i] - hs[i]) / 2, mitte: cursor + slots[i] / 2 };
    cursor += slots[i] + GAP;
    return out;
  });
}

export default function BudgetSankey({ quellen, ziele, fluesse }: Props) {
  const total = ziele.reduce((a, z) => a + z.value, 0);
  if (total <= 0 || quellen.length === 0) return null;

  const innerH = Math.max(hoehen(quellen, total, SLOT_LEFT).colH, hoehen(ziele, total, SLOT_RIGHT).colH);
  const H = PAD_TOP + innerH + PAD_BOTTOM;

  const links = platziere(quellen, total, SLOT_LEFT, innerH);
  const rechts = platziere(ziele, total, SLOT_RIGHT, innerH);

  // Jede Quelle gibt ihre Flüsse in Zielreihenfolge ab, jedes Ziel nimmt sie in Quellenreihenfolge auf
  // -> keine überkreuzenden Bänder innerhalb eines Knotens.
  const outY = new Map(links.map((l) => [l.key, l.y]));
  const inY = new Map(rechts.map((r) => [r.key, r.y]));
  const baender: { key: string; d: string; farbe: string; titel: string }[] = [];
  for (const q of links) {
    for (const z of rechts) {
      const f = fluesse.find((x) => x.von === q.key && x.nach === z.key);
      if (!f || f.value <= 0) continue;
      const h = (f.value / total) * BAR_H;
      const y0 = outY.get(q.key) ?? 0;
      const y1 = inY.get(z.key) ?? 0;
      baender.push({
        key: `${q.key}-${z.key}`,
        d: band(X_LEFT + NODE_W, y0, y0 + h, X_RIGHT, y1, y1 + h),
        farbe: q.color,
        titel: `${q.label} → ${z.label}: ${formatCurrency(f.value)}`,
      });
      outY.set(q.key, y0 + h);
      inY.set(z.key, y1 + h);
    }
  }

  const geplanteZiele = ziele.filter((z) => z.geplant);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full min-w-[640px]"
        role="img"
        aria-label={`Finanzierung: ${formatCurrency(total)} verteilt auf ${ziele.length} Positionen`}
      >
        <defs>
          {geplanteZiele.map((z) => (
            <pattern key={z.key} id={`hatch-${z.key}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill={z.color} fillOpacity="0.14" />
              <rect width="2.5" height="6" fill={z.color} fillOpacity="0.55" />
            </pattern>
          ))}
        </defs>

        {baender.map((b) => (
          <path key={b.key} d={b.d} fill={b.farbe} fillOpacity="0.32">
            <title>{b.titel}</title>
          </path>
        ))}

        {links.map((q) => (
          <g key={q.key}>
            <rect x={X_LEFT} y={q.y} width={NODE_W} height={q.h} rx="2" fill={q.color} />
            <text x={X_LEFT - 10} y={q.mitte - 2} textAnchor="end" fontSize="12.5" fontWeight="600" className="fill-zinc-200">
              {kuerzen(q.label, 26)}
            </text>
            <text x={X_LEFT - 10} y={q.mitte + 12} textAnchor="end" fontSize="11.5" className="fill-zinc-400">
              {formatCurrency(q.value)}
              {q.detail ? ` · ${kuerzen(q.detail, 22)}` : ""}
            </text>
          </g>
        ))}

        {rechts.map((z) => (
          <g key={z.key}>
            <rect
              x={X_RIGHT}
              y={z.y}
              width={NODE_W}
              height={z.h}
              rx="2"
              fill={z.geplant ? `url(#hatch-${z.key})` : z.color}
              stroke={z.geplant ? z.color : "none"}
              strokeWidth="1"
            />
            <text x={X_RIGHT + NODE_W + 10} y={z.mitte - 2} fontSize="12.5" fontWeight="600" className="fill-zinc-200">
              {kuerzen(z.label, 26)}
            </text>
            <text x={X_RIGHT + NODE_W + 10} y={z.mitte + 12} fontSize="11.5" className="fill-zinc-400">
              {formatCurrency(z.value)}
              {z.detail ? ` · ${kuerzen(z.detail, 30)}` : ""}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
