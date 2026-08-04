"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Html, Edges, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useBauSchlauStore } from "@/lib/store";
import { computeBereichStatus, bereichFortschritt, type BereichVisualStatus } from "@/lib/bereich-status";
import type { Bereich } from "@/lib/types";
import { BEREICH_LABEL } from "@/lib/types";

const FINISHED_COLOR: Record<Bereich, string> = {
  keller: "#52525b",
  eg: "#e4d3b8",
  og: "#cbb994",
  dach: "#b1503a",
  garage: "#71717a",
  garten: "#4d7c3a",
  fassade: "#7dd3fc",
};

const OFFEN_COLOR = "#38bdf8";
const IN_ARBEIT_COLOR = "#f59e0b";

interface SegmentProps {
  bereich: Bereich;
  status: BereichVisualStatus;
  geometry: React.ReactNode;
  position: [number, number, number];
  rotation?: [number, number, number];
  active: boolean;
  hovered: boolean;
  onClick: () => void;
  onHover: (v: boolean) => void;
}

function StatusMaterial({ status, bereich }: { status: BereichVisualStatus; bereich: Bereich }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (status === "in_arbeit" && matRef.current) {
      const pulse = (Math.sin(clock.getElapsedTime() * 2.2) + 1) / 2;
      matRef.current.emissiveIntensity = 0.35 + pulse * 0.9;
    }
  });

  if (status === "erledigt") {
    return (
      <>
        <meshStandardMaterial color={FINISHED_COLOR[bereich]} roughness={0.6} metalness={0.05} />
        <Edges color="#18181b" />
      </>
    );
  }
  if (status === "in_arbeit") {
    return (
      <>
        <meshStandardMaterial
          ref={matRef}
          color={IN_ARBEIT_COLOR}
          emissive={IN_ARBEIT_COLOR}
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
          roughness={0.4}
        />
        <Edges color="#fde68a" />
      </>
    );
  }
  return (
    <>
      <meshPhysicalMaterial color={OFFEN_COLOR} transparent opacity={0.16} roughness={0.15} transmission={0.35} thickness={0.4} />
      <Edges color="#7dd3fc" />
    </>
  );
}

function Segment({ bereich, status, geometry, position, rotation, active, hovered, onClick, onHover }: SegmentProps) {
  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(false);
        document.body.style.cursor = "auto";
      }}
    >
      <mesh scale={hovered || active ? 1.02 : 1}>
        {geometry}
        <StatusMaterial status={status} bereich={bereich} />
      </mesh>
      {(hovered || active) && (
        <Html center distanceFactor={10} position={[0, 0, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-950/95 px-2 py-1 text-[10px] font-medium text-zinc-100 shadow-lg">
            {BEREICH_LABEL[bereich]}
          </div>
        </Html>
      )}
    </group>
  );
}

// Reale Gebäudeumrisse aus FEB-17-SUB.dxf (Erweiterungsbau): HATCH-Raumflächen je
// Geschoss zu einer Silhouette vereinigt. Untergeschoss und Erdgeschoss sind nahezu
// deckungsgleich; das Obergeschoss deckt nur den Wohnflügel (nicht die Garage) ab;
// der Garagendachboden ist ein eigener, seitlich versetzter Baukörper. Koordinaten in
// Metern, je Geschoss auf dessen linke/vordere Gebäudeecke bezogen (Grundrisse lagen
// auf dem Blatt nebeneinander statt übereinander und wurden dafür ausgerichtet).
const UG_POLY: [number, number][] = [
  [0.35, 0.12], [0.05, 0.12], [0.05, 1.75], [0.0, 1.75], [0.0, 7.15], [0.3, 7.15],
  [0.3, 7.85], [0.0, 7.85], [0.0, 8.45], [0.3, 8.45], [0.3, 9.15], [0.0, 9.15],
  [0.0, 10.91], [0.3, 10.91], [0.3, 11.91], [0.0, 11.91], [0.0, 13.31], [4.88, 13.31],
  [4.88, 13.01], [5.88, 13.01], [5.88, 13.31], [8.65, 13.31], [8.65, 13.01], [9.35, 13.01],
  [9.35, 13.31], [9.8, 13.31], [9.8, 11.8], [12.35, 11.8], [12.35, 11.5], [13.35, 11.5],
  [13.35, 11.8], [13.95, 11.8], [13.95, 11.4], [15.42, 11.4], [15.42, 9.74], [21.66, 9.74],
  [21.66, 14.94], [21.91, 14.94], [21.91, 0.12],
];
const EG_POLY: [number, number][] = [
  [0.3, 7.25], [0.3, 8.75], [0.0, 8.75], [0.0, 10.85], [0.3, 10.85], [0.3, 12.35],
  [0.0, 12.35], [0.0, 13.3], [5.44, 13.3], [5.44, 13.0], [6.69, 13.0], [6.69, 13.3],
  [7.14, 13.3], [7.14, 13.0], [8.14, 13.0], [8.14, 13.3], [9.78, 13.3], [9.78, 14.96],
  [21.92, 14.96], [21.92, 1.75], [20.97, 1.75], [20.97, 2.0], [19.47, 2.0], [19.47, 1.75],
  [18.24, 1.75], [18.24, 2.0], [16.74, 2.0], [16.74, 1.75], [15.43, 1.75], [15.43, 7.99],
  [13.96, 7.99], [13.96, 7.88], [13.66, 7.88], [13.66, 6.58], [13.96, 6.58], [13.96, 0.0],
  [12.4, 0.0], [12.4, 2.05], [11.0, 2.05], [11.0, 0.0], [9.7, 0.0], [9.7, 2.05],
  [8.3, 2.05], [8.3, 0.0], [7.35, 0.0], [7.35, 2.05], [5.95, 2.05], [5.95, 0.0],
  [2.9, 0.0], [2.9, 2.05], [1.5, 2.05], [1.5, 0.0], [0.0, 0.0], [0.0, 7.25],
];
const OG_POLY: [number, number][] = [
  [15.56, 1.75], [1.6, 1.75], [1.6, 4.1], [0.0, 4.1], [0.0, 11.01], [1.6, 11.01],
  [1.6, 13.31], [11.18, 13.31], [11.18, 11.8], [15.56, 11.8], [15.56, 10.62], [15.27, 10.62],
  [15.27, 9.12], [15.56, 9.12],
];
const GARAGE_DACH_POLY: [number, number][] = [
  [20.9, 9.77], [23.52, 9.77], [23.52, 1.75], [17.07, 1.75], [17.07, 9.77], [19.95, 9.77],
  [19.95, 9.54], [20.9, 9.54],
];

const SCALE = 0.24; // Szeneneinheiten pro Meter
const CENTER_X_M = 11.76;
const CENTER_Z_M = 7.48;

// Keine Schnittzeichnung für den Erweiterungsbau vorhanden -> plausible Standardhöhen;
// Dachneigung DN 30° aus dem 1997er-Bestand übernommen.
const KELLER_H_M = 2.4;
const EG_H_M = 2.7;
const OG_KNIE_H_M = 1.0;
const GARAGE_KNIE_H_M = 0.8;
const ROOF_PITCH = (30 * Math.PI) / 180;

function polyBBox(poly: [number, number][]) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

// Extrudiert einen realen Grundriss-Umriss (Meter, XZ-Ebene) nach oben zu einem Volumen.
function footprintGeometry(poly: [number, number][], heightM: number) {
  const shape = new THREE.Shape();
  poly.forEach(([x, y], i) => {
    const sx = (x - CENTER_X_M) * SCALE;
    const sz = (y - CENTER_Z_M) * SCALE;
    if (i === 0) shape.moveTo(sx, sz);
    else shape.lineTo(sx, sz);
  });
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: heightM * SCALE, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function gableRoofShape(halfSpan: number, ridgeHeight: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-halfSpan, 0);
  shape.lineTo(0, ridgeHeight);
  shape.lineTo(halfSpan, 0);
  shape.lineTo(-halfSpan, 0);
  return shape;
}

// Baut ein Satteldach über der Bounding-Box eines Grundriss-Umrisses; First läuft
// entlang der längeren Seite, Neigung DN 30° über der kürzeren Seite.
function gableRoofGeometry(poly: [number, number][]) {
  const { minX, maxX, minY, maxY } = polyBBox(poly);
  const w = maxX - minX;
  const d = maxY - minY;
  const ridgeAlongX = w >= d;
  const span = Math.min(w, d);
  const length = Math.max(w, d);
  const ridgeHeight = (span / 2) * Math.tan(ROOF_PITCH);
  const geo = new THREE.ExtrudeGeometry(gableRoofShape((span / 2) * SCALE, ridgeHeight * SCALE), {
    depth: length * SCALE,
    bevelEnabled: false,
  });
  geo.translate(0, 0, -(length * SCALE) / 2);
  if (ridgeAlongX) geo.rotateY(Math.PI / 2);
  const cx = (minX + maxX) / 2;
  const cz = (minY + maxY) / 2;
  // footprintGeometry() kehrt die Z-Achse durch rotateX(-90°) um; hier spiegeln wir
  // die Verschiebung entsprechend, damit Dach und Grundriss-Extrusion übereinstimmen.
  geo.translate((cx - CENTER_X_M) * SCALE, 0, -(cz - CENTER_Z_M) * SCALE);
  return geo;
}

const FOOT_W_M = 23.52;
const FOOT_D_M = 14.96;
const GROUP_Y_OFFSET = -0.55;

function HouseModel() {
  const tasks = useBauSchlauStore((s) => s.tasks);
  const aktiverBereichFilter = useBauSchlauStore((s) => s.aktiverBereichFilter);
  const setAktiverBereichFilter = useBauSchlauStore((s) => s.setAktiverBereichFilter);
  const [hovered, setHovered] = useState<Bereich | null>(null);

  const statuses = useMemo(() => {
    const b: Bereich[] = ["keller", "eg", "og", "dach", "garage", "garten", "fassade"];
    return Object.fromEntries(b.map((x) => [x, computeBereichStatus(tasks, x)])) as Record<Bereich, BereichVisualStatus>;
  }, [tasks]);

  const segProps = (bereich: Bereich) => ({
    bereich,
    status: statuses[bereich],
    active: aktiverBereichFilter === bereich,
    hovered: hovered === bereich,
    onClick: () => setAktiverBereichFilter(bereich),
    onHover: (v: boolean) => setHovered(v ? bereich : null),
  });

  const kellerGeometry = useMemo(() => footprintGeometry(UG_POLY, KELLER_H_M), []);
  const egGeometry = useMemo(() => footprintGeometry(EG_POLY, EG_H_M), []);
  const ogGeometry = useMemo(() => footprintGeometry(OG_POLY, OG_KNIE_H_M), []);
  const garageGeometry = useMemo(() => footprintGeometry(GARAGE_DACH_POLY, GARAGE_KNIE_H_M), []);
  const mainRoofGeometry = useMemo(() => gableRoofGeometry(OG_POLY), []);
  const garageRoofGeometry = useMemo(() => gableRoofGeometry(GARAGE_DACH_POLY), []);

  const ogTopY = (EG_H_M + OG_KNIE_H_M) * SCALE;
  const garageTopY = (EG_H_M + GARAGE_KNIE_H_M) * SCALE;
  // footprintGeometry() kehrt die Z-Achse durch rotateX(-90°) um, daher positives Vorzeichen.
  const frontZ = CENTER_Z_M * SCALE;

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      {/* Keller */}
      <Segment {...segProps("keller")} geometry={<primitive object={kellerGeometry} attach="geometry" />} position={[0, -KELLER_H_M * SCALE, 0]} />
      {/* EG */}
      <Segment {...segProps("eg")} geometry={<primitive object={egGeometry} attach="geometry" />} position={[0, 0, 0]} />
      {/* OG (Kniestock im Dachgeschoss, nur Wohnflügel) */}
      <Segment {...segProps("og")} geometry={<primitive object={ogGeometry} attach="geometry" />} position={[0, EG_H_M * SCALE, 0]} />
      {/* Dach (Satteldach über dem Wohnflügel) */}
      <Segment {...segProps("dach")} geometry={<primitive object={mainRoofGeometry} attach="geometry" />} position={[0, ogTopY, 0]} />
      {/* Garagendachboden inkl. eigenem, versetztem Satteldach */}
      <Segment {...segProps("garage")} geometry={<primitive object={garageGeometry} attach="geometry" />} position={[0, EG_H_M * SCALE, 0]} />
      <Segment {...segProps("garage")} geometry={<primitive object={garageRoofGeometry} attach="geometry" />} position={[0, garageTopY, 0]} />
      {/* Garten */}
      <Segment
        {...segProps("garten")}
        geometry={<boxGeometry args={[(FOOT_W_M + 2) * SCALE, 0.06, 3.5 * SCALE]} />}
        position={[0, -0.03, frontZ + (1.75 * SCALE) / 2 + 0.05]}
      />
      {/* Fassade / Fenster (Front) */}
      <Segment
        {...segProps("fassade")}
        geometry={<boxGeometry args={[FOOT_D_M * 0.5 * SCALE, EG_H_M * SCALE * 1.2, 0.06]} />}
        position={[-2.2, (EG_H_M * SCALE) / 2, frontZ + 0.04]}
      />
    </group>
  );
}

export default function House3D() {
  return (
    <div className="h-[380px] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 sm:h-[460px]">
      <Canvas frameloop="always" camera={{ position: [9, 6, 10], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[7, 10, 5]} intensity={1.2} />
        <directionalLight position={[-7, 4, -5]} intensity={0.4} color="#7dd3fc" />
        <Suspense fallback={null}>
          <HouseModel />
          <Grid
            position={[0, -1.75, 0]}
            args={[22, 22]}
            cellSize={0.5}
            cellColor="#27272a"
            sectionColor="#3f3f46"
            fadeDistance={24}
            fadeStrength={1.5}
            infiniteGrid
          />
          <ContactShadows position={[0, -1.74, 0]} opacity={0.45} scale={18} blur={2.2} far={2} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
