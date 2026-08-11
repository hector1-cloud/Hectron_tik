import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { Emotion } from "../types";

export function Particles({ count = 400, color = "#00ffff" }: { count?: number; color?: string }) {
  const particlesRef = useRef<THREE.Points>(null!);
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return pos;
  });

  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.x += 0.0004;
      particlesRef.current.rotation.y += 0.0006;
    }
  });

  return (
    <Points ref={particlesRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.035}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export function Glow({ color = "#00ffff", intensity = 1.2, position = [0, 1.5, 0] }: { color?: string; intensity?: number; position?: [number, number, number] }) {
  return (
    <pointLight
      position={position}
      color={color}
      intensity={intensity}
      distance={8}
      decay={2}
    />
  );
}

export function TransitionEffect({ active = false, color = "#00ffff" }: { active?: boolean; color?: string }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (active) {
      setOpacity(0.6);
      const timer = setTimeout(() => setOpacity(0), 800);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <mesh position={[0, 0, -1]}>
      <planeGeometry args={[25, 25]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function Bubbles({ emotion = "IDLE", count = 20 }: { emotion?: Emotion; count?: number }) {
  const getEmotionColor = (emo: Emotion) => {
    const colors: Record<Emotion, string> = {
      HAPPY: "#00ffff",
      SAD: "#4a90e2",
      ANGRY: "#ff4d4d",
      SURPRISE: "#ffcc00",
      FLIRT: "#ff66cc",
      IDLE: "#00e5ff",
    };
    return colors[emo] || "#00ffff";
  };

  const [bubbles, setBubbles] = useState(() => {
    return Array.from({ length: count }, () => ({
      pos: [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5 - 2, (Math.random() - 0.5) * 4] as [number, number, number],
      size: Math.random() * 0.18 + 0.08,
      speedY: Math.random() * 0.012 + 0.008,
      speedX: (Math.random() - 0.5) * 0.006,
    }));
  });

  useFrame(() => {
    setBubbles((prev) =>
      prev.map((b) => {
        let newY = b.pos[1] + b.speedY;
        let newX = b.pos[0] + b.speedX;
        if (newY > 4) newY = -3;
        return { ...b, pos: [newX, newY, b.pos[2]] };
      })
    );
  });

  const currentColor = getEmotionColor(emotion);

  return (
    <group>
      {bubbles.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <sphereGeometry args={[b.size, 16, 16]} />
          <meshStandardMaterial color={currentColor} transparent opacity={0.65} roughness={0.1} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
