import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SpawnedWorldItem } from "../types";

interface WorldCollectibles3DProps {
  items: SpawnedWorldItem[];
  onPickup: (spawnedId: string) => void;
}

function FloatingItemMesh({
  item,
  onPickup,
  index,
}: {
  item: SpawnedWorldItem;
  onPickup: (id: string) => void;
  index: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Color mapping based on rarity
  const colorMap: Record<string, string> = {
    COMMON: "#94a3b8",
    RARE: "#3b82f6",
    EPIC: "#a855f7",
    LEGENDARY: "#f59e0b",
  };

  const itemColor = colorMap[item.rarity] || "#06b6d4";

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() + index * 1.5;
    // Gentle floating bob
    meshRef.current.position.y = item.position[1] + Math.sin(t * 2) * 0.12;
    // Continuous rotation
    meshRef.current.rotation.y = t * 1.2;
    meshRef.current.rotation.x = Math.sin(t * 0.8) * 0.2;

    if (glowRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.15;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  if (item.collected) return null;

  return (
    <group
      ref={meshRef}
      position={[item.position[0], item.position[1], item.position[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onPickup(item.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      {/* Outer Glow Halo Sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial
          color={itemColor}
          transparent
          opacity={0.35}
          wireframe
        />
      </mesh>

      {/* Main Core Gem Mesh: Octahedron / Dodecahedron for Cyber Crystals */}
      <mesh>
        <octahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial
          color={itemColor}
          emissive={itemColor}
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Orbiting Quantum Rings */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[0.19, 0.015, 8, 24]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={itemColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Point Light for Atmospheric Radiance */}
      <pointLight color={itemColor} intensity={1.8} distance={1.5} />
    </group>
  );
}

export function WorldCollectibles3D({ items, onPickup }: WorldCollectibles3DProps) {
  const activeItems = items.filter((i) => !i.collected);

  return (
    <group>
      {activeItems.map((item, index) => (
        <FloatingItemMesh
          key={item.id}
          item={item}
          onPickup={onPickup}
          index={index}
        />
      ))}
    </group>
  );
}
