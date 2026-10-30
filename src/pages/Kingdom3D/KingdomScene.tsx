import { Suspense, useMemo, useRef, useState } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Building, Kingdom } from "../../types";
import { useApp } from "../../features/store/StoreProvider";

/* Reusable geometries/materials — created once, shared by all instances. */
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(0.5, 0.6, 1, 8),
  cone: new THREE.ConeGeometry(0.7, 1, 8),
  sphere: new THREE.SphereGeometry(1, 12, 12),
};
const MAT = {
  stone: new THREE.MeshStandardMaterial({ color: "#8b8f96", roughness: 0.9 }),
  darkStone: new THREE.MeshStandardMaterial({
    color: "#565b63",
    roughness: 0.9,
  }),
  roof: new THREE.MeshStandardMaterial({ color: "#7c2d3a", roughness: 0.6 }),
  gold: new THREE.MeshStandardMaterial({
    color: "#d4af37",
    metalness: 0.6,
    roughness: 0.3,
  }),
  wood: new THREE.MeshStandardMaterial({ color: "#6b4a2f", roughness: 0.85 }),
  foliage: new THREE.MeshStandardMaterial({ color: "#2e7d32", roughness: 0.9 }),
  road: new THREE.MeshStandardMaterial({ color: "#3c4046", roughness: 1 }),
  lime: new THREE.MeshStandardMaterial({
    color: "#a3e635",
    emissive: "#a3e635",
    emissiveIntensity: 0.35,
  }),
  wall: new THREE.MeshStandardMaterial({ color: "#6f7378", roughness: 0.95 }),
  ground: new THREE.MeshStandardMaterial({ color: "#3a5f38", roughness: 1 }),
};

function Terrain({ size }: { size: number }) {
  const s = size;
  return (
    <group>
      <mesh
        geometry={GEO.box}
        material={MAT.ground}
        scale={[s * 2.2, 0.6, s * 2.2]}
        position={[0, -0.3, 0]}
        receiveShadow
      />
      {/* gentle hills */}
      {[
        [-s * 0.8, s * 0.9, 6],
        [s * 0.9, -s * 0.7, 5],
        [-s * 0.9, -s * 0.9, 4],
      ].map(([x, z, r], i) => (
        <mesh
          key={i}
          geometry={GEO.sphere}
          material={MAT.darkStone}
          position={[x, -0.6, z]}
          scale={[r, 2.2, r]}
        />
      ))}
    </group>
  );
}

function Roads({ size }: { size: number }) {
  const s = size;
  return (
    <group>
      <mesh
        geometry={GEO.box}
        material={MAT.road}
        position={[0, 0.02, 0]}
        scale={[s * 1.8, 0.06, 2.4]}
        receiveShadow
      />
      <mesh
        geometry={GEO.box}
        material={MAT.road}
        position={[0, 0.02, 0]}
        scale={[2.4, 0.06, s * 1.8]}
        receiveShadow
      />
      <mesh
        geometry={GEO.box}
        material={MAT.road}
        position={[0, 0.02, 0]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[2, 0.06, s * 1.7]}
        receiveShadow
      />
      <mesh
        geometry={GEO.box}
        material={MAT.road}
        position={[0, 0.02, 0]}
        rotation={[0, -Math.PI / 4, 0]}
        scale={[2, 0.06, s * 1.7]}
        receiveShadow
      />
    </group>
  );
}

function House({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh
        geometry={GEO.box}
        material={MAT.stone}
        position={[0, 0.75, 0]}
        castShadow
      />
      <mesh
        geometry={GEO.cone}
        material={MAT.roof}
        position={[0, 1.75, 0]}
        castShadow
      />
    </group>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh
        geometry={GEO.cylinder}
        material={MAT.wood}
        position={[0, 0.6, 0]}
        scale={[0.4, 1.2, 0.4]}
      />
      <mesh
        geometry={GEO.cone}
        material={MAT.foliage}
        position={[0, 1.9, 0]}
        scale={1.3}
        castShadow
      />
    </group>
  );
}

function Palace({ level, x, z }: { level: number; x: number; z: number }) {
  const h = 1.6 + level * 0.45;
  return (
    <group position={[x, 0, z]}>
      {/* main keep */}
      <mesh
        geometry={GEO.box}
        material={MAT.stone}
        position={[0, h / 2, 0]}
        scale={[6, h, 6]}
        castShadow
        receiveShadow
      />
      {/* towers */}
      {[
        [3.4, 3.4],
        [-3.4, 3.4],
        [3.4, -3.4],
        [-3.4, -3.4],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh
            geometry={GEO.cylinder}
            material={MAT.darkStone}
            position={[0, (h + 1.4) / 2, 0]}
            scale={[1.5, h + 1.4, 1.5]}
            castShadow
          />
          <mesh
            geometry={GEO.cone}
            material={MAT.roof}
            position={[0, h + 1.4 + 1.1, 0]}
            scale={1.7}
            castShadow
          />
          <mesh
            geometry={GEO.cone}
            material={MAT.gold}
            position={[0, h + 2.9, 0]}
            scale={0.4}
          />
        </group>
      ))}
      {/* central spire */}
      <mesh
        geometry={GEO.cylinder}
        material={MAT.gold}
        position={[0, h + 1.6, 0]}
        scale={[0.9, 3, 0.9]}
        castShadow
      />
      <mesh
        geometry={GEO.cone}
        material={MAT.gold}
        position={[0, h + 4, 0]}
        scale={1.2}
      />
    </group>
  );
}

function Barracks({ x, z, level }: { x: number; z: number; level: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh
        geometry={GEO.box}
        material={MAT.wood}
        position={[0, 1, 0]}
        scale={[4.5, 2, 3]}
        castShadow
      />
      <mesh
        geometry={GEO.box}
        material={MAT.darkStone}
        position={[0, 2.3, 0]}
        scale={[4.7, 0.4, 3.2]}
        castShadow
      />
      {/* training dummies */}
      {[0, 1, 2].slice(0, Math.min(3, level)).map((i) => (
        <group key={i} position={[-3.5 + i * 1.4, 0, 3]}>
          <mesh
            geometry={GEO.cylinder}
            material={MAT.wood}
            position={[0, 0.7, 0]}
            scale={[0.25, 1.4, 0.25]}
          />
          <mesh
            geometry={GEO.sphere}
            material={MAT.roof}
            position={[0, 1.5, 0]}
            scale={0.4}
          />
        </group>
      ))}
    </group>
  );
}

function Tower({ x, z, level }: { x: number; z: number; level: number }) {
  const h = 3 + level;
  return (
    <group position={[x, 0, z]}>
      <mesh
        geometry={GEO.cylinder}
        material={MAT.wall}
        position={[0, h / 2, 0]}
        scale={[1.2, h, 1.2]}
        castShadow
      />
      <mesh
        geometry={GEO.cylinder}
        material={MAT.darkStone}
        position={[0, h + 0.3, 0]}
        scale={[1.5, 0.6, 1.5]}
        castShadow
      />
      <mesh
        geometry={GEO.cone}
        material={MAT.roof}
        position={[0, h + 1.3, 0]}
        scale={1.4}
        castShadow
      />
    </group>
  );
}

function Granary({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh
        geometry={GEO.cylinder}
        material={MAT.stone}
        position={[0, 1.4, 0]}
        scale={[2, 2.8, 2]}
        castShadow
      />
      <mesh
        geometry={GEO.cone}
        material={MAT.wood}
        position={[0, 3.4, 0]}
        scale={2.4}
        castShadow
      />
    </group>
  );
}

function Yard({ x, z, level }: { x: number; z: number; level: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh
        geometry={GEO.cylinder}
        material={MAT.road}
        position={[0, 0.04, 0]}
        scale={[4.5, 0.08, 4.5]}
        receiveShadow
      />
      {/* sparring rings */}
      {Array.from({ length: Math.min(5, level) }, (_, i) => (
        <mesh
          key={i}
          geometry={GEO.cylinder}
          material={MAT.lime}
          position={[-2.5 + i * 1.25, 0.09, 0]}
          scale={[0.35, 0.1, 0.35]}
        />
      ))}
    </group>
  );
}

function GreatRoads({ x, z, level }: { x: number; z: number; level: number }) {
  return (
    <group position={[x, 0, z]}>
      {[0, 1, 2].slice(0, Math.min(3, level - 1)).map((i) => (
        <mesh
          key={i}
          geometry={GEO.box}
          material={MAT.road}
          position={[0, 0.03, i * 2.2 - 2.2]}
          scale={[14, 0.06, 1.4]}
          rotation={[0, i * 0.5, 0]}
          receiveShadow
        />
      ))}
      {/* lanterns */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          geometry={GEO.sphere}
          material={MAT.gold}
          position={[s * 5, 1.4, 0]}
          scale={0.35}
        />
      ))}
    </group>
  );
}

function BuildingMesh({
  b,
  onSelect,
  selected,
}: {
  b: Building;
  onSelect: () => void;
  selected: boolean;
}) {
  const [x, z] = b.position;
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && selected) {
      ref.current.position.y = Math.sin(clock.getElapsedTime() * 2) * 0.06;
    } else if (ref.current) ref.current.position.y = 0;
  });
  const body =
    b.type === "Royal Palace" ? (
      <Palace x={x} z={z} level={b.level} />
    ) : b.type === "Warrior Barracks" ? (
      <Barracks x={x} z={z} level={b.level} />
    ) : b.type === "Defense Towers" ? (
      <Tower x={x} z={z} level={b.level} />
    ) : b.type === "Granary" ? (
      <Granary x={x} z={z} />
    ) : b.type === "Training Yard" ? (
      <Yard x={x} z={z} level={b.level} />
    ) : (
      <GreatRoads x={x} z={z} level={b.level} />
    );
  return (
    <group
      ref={ref}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {body}
      {selected && (
        <mesh
          geometry={GEO.cylinder}
          position={[x, 0.06, z]}
          scale={[
            b.type === "Royal Palace" ? 7 : 4.5,
            0.05,
            b.type === "Royal Palace" ? 7 : 4.5,
          ]}
        >
          <meshBasicMaterial color="#a3e635" transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}

function Walls({ size }: { size: number }) {
  const s = size * 0.95;
  const segments: {
    pos: [number, number, number];
    scale: [number, number, number];
  }[] = [
    { pos: [0, 1, s], scale: [s * 2, 2, 1.2] },
    { pos: [0, 1, -s], scale: [s * 2, 2, 1.2] },
    { pos: [s, 1, 0], scale: [1.2, 2, s * 2] },
    { pos: [-s, 1, 0], scale: [1.2, 2, s * 2] },
  ];
  return (
    <group>
      {segments.map((seg, i) => (
        <mesh
          key={i}
          geometry={GEO.box}
          material={MAT.wall}
          position={seg.pos}
          scale={seg.scale}
          castShadow
          receiveShadow
        />
      ))}
      {/* corner towers */}
      {[
        [s, s],
        [s, -s],
        [-s, s],
        [-s, -s],
      ].map(([tx, tz], i) => (
        <Tower key={i} x={tx} z={tz} level={2} />
      ))}
    </group>
  );
}

function Villages({ size, population }: { size: number; population: number }) {
  const houses = useMemo(() => {
    const n = Math.min(46, Math.max(14, Math.round(population / 40)));
    const arr: { pos: [number, number, number]; scale: number }[] = [];
    let seed = 42;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    let tries = 0;
    while (arr.length < n && tries < n * 8) {
      tries++;
      const x = (rnd() - 0.5) * size * 1.7;
      const z = (rnd() - 0.5) * size * 1.7;
      const d = Math.hypot(x, z);
      if (d < size * 0.5) continue; // keep palace ground clear
      if (Math.abs(x) < 3 || Math.abs(z) < 3) continue; // keep roads clear
      arr.push({ pos: [x, 0, z], scale: 0.7 + rnd() * 0.5 });
    }
    return arr;
  }, [size, population]);
  return (
    <group>
      {houses.map((h, i) => (
        <House key={i} position={h.pos} scale={h.scale} />
      ))}
    </group>
  );
}

function Forest({ size }: { size: number }) {
  const trees = useMemo(() => {
    let seed = 99;
    const rnd = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    return Array.from({ length: 34 }, () => {
      const a = rnd() * Math.PI * 2;
      const r = size * (0.9 + rnd() * 0.18);
      return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
    });
  }, [size]);
  return (
    <group>
      {trees.map(([x, z], i) => (
        <Tree key={i} position={[x, 0, z]} />
      ))}
    </group>
  );
}

function CameraRig({ reset }: { reset: number }) {
  const { camera } = useThree();
  const [target, setTarget] = useState<{
    pos: [number, number, number];
    t: [number, number, number];
  } | null>(null);
  const [needsReset, setNeedsReset] = useState(0);
  if (reset !== needsReset) {
    setNeedsReset(reset);
    setTarget({ pos: [26, 20, 30], t: [0, 0, 0] });
  }
  useFrame(() => {
    if (!target) return;
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.08);
    camera.lookAt(new THREE.Vector3(...target.t));
    if (camera.position.distanceTo(new THREE.Vector3(...target.pos)) < 0.2)
      setTarget(null);
  });
  return null;
}

export interface KingdomSceneProps {
  kingdom: Kingdom;
  selectedBuildingId: string | null;
  onSelectBuilding: (id: string) => void;
  resetSignal: number;
}

export default function KingdomScene({
  kingdom,
  selectedBuildingId,
  onSelectBuilding,
  resetSignal,
}: KingdomSceneProps) {
  const { state } = useApp();
  const isMember = state.profile?.kingdomId === kingdom.id;
  const size = useMemo(
    () => 14 + kingdom.territorySize * 0.18,
    [kingdom.territorySize],
  );

  return (
    <Canvas
      shadows
      camera={{ position: [26, 20, 30], fov: 45 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0b0f11");
      }}
      className="rounded-xl"
    >
      <color attach="background" args={["#0b0f11"]} />
      <fog attach="fog" args={["#0b0f11", 60, 130]} />
      <hemisphereLight intensity={0.55} groundColor="#1a221a" />
      <directionalLight
        position={[30, 40, 18]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[1024, 1024]}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-45, 45, 45, -45, 1, 140]}
        />
      </directionalLight>
      <Suspense fallback={null}>
        <Terrain size={size} />
        <Roads size={size} />
        <Walls size={size * 0.92} />
        <Villages size={size} population={kingdom.population} />
        <Forest size={size} />
        {kingdom.buildings.map((b) => (
          <BuildingMesh
            key={b.id}
            b={b}
            selected={selectedBuildingId === b.id}
            onSelect={() => onSelectBuilding(b.id)}
          />
        ))}
      </Suspense>
      <OrbitControls
        enablePan
        enableZoom
        maxPolarAngle={Math.PI / 2.15}
        minDistance={10}
        maxDistance={110}
        target={[0, 1, 0]}
      />
      <CameraRig reset={resetSignal} />
      {!isMember && <mesh position={[0, 0.05, 0]} visible={false} />}
    </Canvas>
  );
}
