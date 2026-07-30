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

  return (
    <group position={[0, 0.6, 0]}>
      {/* Keller */}
      <Segment {...segProps("keller")} geometry={<boxGeometry args={[3.6, 0.7, 2.8]} />} position={[0, -0.75, 0]} />
      {/* EG */}
      <Segment {...segProps("eg")} geometry={<boxGeometry args={[3.6, 1.3, 2.8]} />} position={[0, -0.05, 0]} />
      {/* OG */}
      <Segment {...segProps("og")} geometry={<boxGeometry args={[3.6, 1.3, 2.8]} />} position={[0, 1.25, 0]} />
      {/* Dach */}
      <Segment
        {...segProps("dach")}
        geometry={<coneGeometry args={[2.7, 1.1, 4]} />}
        position={[0, 2.45, 0]}
        rotation={[0, Math.PI / 4, 0]}
      />
      {/* Garage */}
      <Segment {...segProps("garage")} geometry={<boxGeometry args={[1.6, 1, 1.7]} />} position={[2.7, -0.5, 0.4]} />
      {/* Garten */}
      <Segment
        {...segProps("garten")}
        geometry={<boxGeometry args={[3.4, 0.06, 2.2]} />}
        position={[0, -1.16, 2.6]}
      />
      {/* Fassade / Fenster (Front) */}
      <Segment
        {...segProps("fassade")}
        geometry={<boxGeometry args={[2.6, 2.0, 0.06]} />}
        position={[0, 0.6, 1.44]}
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
