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

interface Props {
  quellen: SankeyKnoten[];
  ziele: SankeyKnoten[];
  hubLabel: string;
}

const W = 820;
const NODE_W = 14;
const X_LEFT = 190;
const X_HUB = 395;
const X_RIGHT = 600;
const BAR_H = 300;
const MIN_H = 2;
const GAP = 8;
const SLOT_LEFT = 34;
const SLOT_RIGHT = 32;
const PAD_TOP = 48;
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

// Verteilt Knoten in einer Spalte untereinander; jeder bekommt mindestens Platz für sein Label.
function platziere(knoten: SankeyKnoten[], total: number, minSlot: number, top: number, innerH: number): Platziert[] {
  const hs = knoten.map((k) => Math.max((k.value / total) * BAR_H, MIN_H));
  const slots = hs.map((h) => Math.max(h, minSlot));
  const colH = slots.reduce((a, s) => a + s, 0) + GAP * Math.max(knoten.length - 1, 0);
  let cursor = top + (innerH - colH) / 2;
  return knoten.map((k, i) => {
    const y = cursor + (slots[i] - hs[i]) / 2;
    const out = { ...k, h: hs[i], y, mitte: cursor + slots[i] / 2 };
    cursor += slots[i] + GAP;
    return out;
  });
}

// Legt Segmente lückenlos untereinander (Ein-/Ausgänge des mittleren Knotens).
function stapeln(hoehen: number[], start: number) {
  let y = start;
  return hoehen.map((h) => {
    const seg = { a: y, b: y + h };
    y += h;
    return seg;
  });
}

export default function BudgetSankey({ quellen, ziele, hubLabel }: Props) {
  const total = quellen.reduce((a, q) => a + q.value, 0);
  if (total <= 0 || ziele.length === 0) return null;

  const rawL = quellen.map((q) => Math.max((q.value / total) * BAR_H, MIN_H));
  const rawR = ziele.map((z) => Math.max((z.value / total) * BAR_H, MIN_H));
  const hubH = Math.max(rawL.reduce((a, h) => a + h, 0), rawR.reduce((a, h) => a + h, 0));

  const colL = rawL.map((h) => Math.max(h, SLOT_LEFT)).reduce((a, s) => a + s, 0) + GAP * (quellen.length - 1);
  const colR = rawR.map((h) => Math.max(h, SLOT_RIGHT)).reduce((a, s) => a + s, 0) + GAP * (ziele.length - 1);
  const innerH = Math.max(colL, colR, hubH);
  const H = PAD_TOP + innerH + PAD_BOTTOM;

  const links = platziere(quellen, total, SLOT_LEFT, PAD_TOP, innerH);
  const rechts = platziere(ziele, total, SLOT_RIGHT, PAD_TOP, innerH);
  const hubTop = PAD_TOP + (innerH - hubH) / 2;

  const eingehend = stapeln(links.map((q) => q.h), hubTop);
  const ausgehend = stapeln(rechts.map((z) => z.h), hubTop);

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

        {links.map((q, i) => (
          <path key={q.key} d={band(X_LEFT + NODE_W, q.y, q.y + q.h, X_HUB, eingehend[i].a, eingehend[i].b)} fill={q.color} fillOpacity="0.3">
            <title>{`${q.label}: ${formatCurrency(q.value)}`}</title>
          </path>
        ))}
        {rechts.map((z, i) => (
          <path
            key={z.key}
            d={band(X_HUB + NODE_W, ausgehend[i].a, ausgehend[i].b, X_RIGHT, z.y, z.y + z.h)}
            fill={z.geplant ? `url(#hatch-${z.key})` : z.color}
            fillOpacity={z.geplant ? 1 : 0.32}
          >
            <title>{`${z.label}: ${formatCurrency(z.value)}${z.detail ? ` (${z.detail})` : ""}`}</title>
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
            </text>
          </g>
        ))}

        <rect x={X_HUB} y={hubTop} width={NODE_W} height={hubH} rx="2" className="fill-zinc-400" />
        <text x={X_HUB + NODE_W / 2} y={hubTop - 24} textAnchor="middle" fontSize="12.5" fontWeight="600" className="fill-zinc-200">
          {hubLabel}
        </text>
        <text x={X_HUB + NODE_W / 2} y={hubTop - 9} textAnchor="middle" fontSize="11.5" className="fill-zinc-400">
          {formatCurrency(total)}
        </text>

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
