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

// Proportionen aus dem realen Baugesuch (Wohnhausneubau mit Garage, Schrozberg 1997):
// Hauptbaukörper ca. 13,90 x 9,95 m, First quer zur Breite; Dachneigung DN 30°.
// Doppelgarage ca. 8,00 x 7,52 m, eigener First quer zur Tiefe (First zeigt zur Straße).
const HOUSE_W = 3.6;
const HOUSE_D = 2.6; // 3.6 * (9.95 / 13.90)
const KELLER_H = 0.7;
const EG_H = 1.3;
const OG_H = 0.55; // Kniestock im ausgebauten Dachgeschoss
const ROOF_RIDGE_H = HOUSE_D * 0.5 * Math.tan((30 * Math.PI) / 180); // DN 30°

const GARAGE_W = 2.0;
const GARAGE_D = 1.9; // 8,00 x 7,52 m Verhältnis
const GARAGE_H = 1.0;
const GARAGE_ROOF_H = GARAGE_W * 0.5 * Math.tan((30 * Math.PI) / 180);
const GARAGE_X = HOUSE_W / 2 + 0.1 + GARAGE_W / 2;
const GARAGE_Z = 0.4;

function gableRoofShape(halfSpan: number, ridgeHeight: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-halfSpan, 0);
  shape.lineTo(0, ridgeHeight);
  shape.lineTo(halfSpan, 0);
  shape.lineTo(-halfSpan, 0);
  return shape;
}

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

  // First des Hauptdachs läuft entlang der Breite (X) -> Querschnitt liegt in Z/Y,
  // daher Extrusion entlang Z bauen und anschließend um Y drehen.
  const mainRoofGeometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(gableRoofShape(HOUSE_D / 2, ROOF_RIDGE_H), {
      depth: HOUSE_W,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -HOUSE_W / 2);
    return geo;
  }, []);

  // First der Garage läuft entlang der Tiefe (Z) -> Querschnitt liegt bereits in X/Y,
  // keine Rotation nötig.
  const garageRoofGeometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(gableRoofShape(GARAGE_W / 2, GARAGE_ROOF_H), {
      depth: GARAGE_D,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -GARAGE_D / 2);
    return geo;
  }, []);

  return (
    <group position={[0, 0.6, 0]}>
      {/* Keller */}
      <Segment {...segProps("keller")} geometry={<boxGeometry args={[HOUSE_W, KELLER_H, HOUSE_D]} />} position={[0, -0.75, 0]} />
      {/* EG */}
      <Segment {...segProps("eg")} geometry={<boxGeometry args={[HOUSE_W, EG_H, HOUSE_D]} />} position={[0, -0.05, 0]} />
      {/* OG (Kniestock im Dachgeschoss) */}
      <Segment {...segProps("og")} geometry={<boxGeometry args={[HOUSE_W, OG_H, HOUSE_D]} />} position={[0, 0.875, 0]} />
      {/* Dach (Satteldach, First entlang der Hausbreite) */}
      <Segment
        {...segProps("dach")}
        geometry={<primitive object={mainRoofGeometry} attach="geometry" />}
        position={[0, 1.15, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      {/* Garage inkl. eigenem Satteldach, First quer zur Garage (zeigt zur Straße) */}
      <Segment {...segProps("garage")} geometry={<boxGeometry args={[GARAGE_W, GARAGE_H, GARAGE_D]} />} position={[GARAGE_X, -0.5, GARAGE_Z]} />
      <Segment
        {...segProps("garage")}
        geometry={<primitive object={garageRoofGeometry} attach="geometry" />}
        position={[GARAGE_X, 0, GARAGE_Z]}
      />
      {/* Garten */}
      <Segment
        {...segProps("garten")}
        geometry={<boxGeometry args={[HOUSE_W + GARAGE_W + 0.6, 0.06, HOUSE_D]} />}
        position={[GARAGE_X * 0.35, -1.16, HOUSE_D / 2]}
      />
      {/* Fassade / Fenster (Front) */}
      <Segment
        {...segProps("fassade")}
        geometry={<boxGeometry args={[HOUSE_W * 0.72, 2.0, 0.06]} />}
        position={[0, 0.6, HOUSE_D / 2 + 0.04]}
      />
    </group>
  );
}

export default function House3D() {
  return (
    <div className="h-[380px] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 sm:h-[460px]">
      <Canvas frameloop="always" camera={{ position: [6.5, 4.5, 7], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 4]} intensity={1.2} />
        <directionalLight position={[-5, 3, -4]} intensity={0.4} color="#7dd3fc" />
        <Suspense fallback={null}>
          <HouseModel />
          <Grid
            position={[0, -1.2, 0]}
            args={[14, 14]}
            cellSize={0.5}
            cellColor="#27272a"
            sectionColor="#3f3f46"
            fadeDistance={16}
            fadeStrength={1.5}
            infiniteGrid
          />
          <ContactShadows position={[0, -1.19, 0]} opacity={0.45} scale={12} blur={2.2} far={2} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={14}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
