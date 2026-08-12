import { useRef, useEffect, useState, useContext } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Emotion } from "../types";
import { BrainContext } from "../BrainContext";

// Highly compatible Timer implementation aligning with THREE.Timer API to guarantee seamless production building
class Timer {
  private _currentTime: number;
  private _previousTime: number;
  private _elapsedTime: number;
  private _deltaTime: number;

  constructor() {
    this._currentTime = performance.now() / 1000;
    this._previousTime = this._currentTime;
    this._elapsedTime = 0;
    this._deltaTime = 0;
  }

  getElapsed(): number {
    return this._elapsedTime;
  }

  getDelta(): number {
    return this._deltaTime;
  }

  update(): void {
    this._currentTime = performance.now() / 1000;
    this._deltaTime = this._currentTime - this._previousTime;
    this._previousTime = this._currentTime;
    this._elapsedTime += this._deltaTime;
  }
}

interface HectronCloudProps {
  emotion?: Emotion;
  isSpeaking?: boolean;
}

const EMOTION_COLORS: Record<Emotion, string> = {
  HAPPY: "#00ffff",   // Cyan Miku
  SAD: "#4a90e2",     // Deep Blue
  ANGRY: "#ff4d4d",   // Coral Red
  SURPRISE: "#ffcc00", // Bright Yellow
  FLIRT: "#ff66cc",   // Pink
  IDLE: "#00f0ff",    // Electric Cyan
};

export function HectronCloud({ emotion = "IDLE", isSpeaking = false }: HectronCloudProps) {
  const { lodLevel } = useContext(BrainContext);

  const groupRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);
  const leftTailRef = useRef<THREE.Group>(null!);
  const rightTailRef = useRef<THREE.Group>(null!);
  const mouthRef = useRef<THREE.Mesh>(null!);
  const leftEyeRef = useRef<THREE.Mesh>(null!);
  const rightEyeRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.DirectionalLight>(null!);

  const timerRef = useRef(new Timer());
  const [blink, setBlink] = useState(false);

  // Dynamic mesh segment count based on LOD
  const sphereSegs = lodLevel === "HIGH" ? 32 : lodLevel === "MEDIUM" ? 16 : 10;
  const cylinderSegs = lodLevel === "HIGH" ? 24 : lodLevel === "MEDIUM" ? 12 : 8;

  // Random eye blinking interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useFrame(() => {
    const timer = timerRef.current;
    // Update the timer on each frame
    timer.update();
    const time = timer.getElapsed();

    // Subtle breathing animation
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 2) * 0.05 - 0.2;
      groupRef.current.rotation.y = Math.sin(time * 0.8) * 0.08;
    }

    // Head micro tilt
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(time * 1.5) * 0.03;
      if (emotion === "HAPPY") {
        headRef.current.rotation.x = Math.sin(time * 4) * 0.05 - 0.05;
      } else if (emotion === "FLIRT") {
        headRef.current.rotation.z = Math.sin(time * 2) * 0.08 + 0.05;
      }
    }

    // Dynamic twin-tail physics movement
    if (leftTailRef.current && rightTailRef.current) {
      leftTailRef.current.rotation.z = Math.sin(time * 2.5) * 0.12 - 0.2;
      rightTailRef.current.rotation.z = -Math.sin(time * 2.5) * 0.12 + 0.2;

      leftTailRef.current.rotation.x = Math.cos(time * 2) * 0.08;
      rightTailRef.current.rotation.x = Math.cos(time * 2) * 0.08;
    }

    // Lip-sync talking animation
    if (mouthRef.current) {
      if (isSpeaking) {
        const mouthScaleY = 0.5 + Math.sin(time * 20) * 0.4;
        mouthRef.current.scale.set(1, mouthScaleY, 1);
      } else {
        mouthRef.current.scale.set(1, 0.2, 1);
      }
    }

    // Blinking scale
    if (leftEyeRef.current && rightEyeRef.current) {
      const eyeScaleY = blink ? 0.1 : 1;
      leftEyeRef.current.scale.y = eyeScaleY;
      rightEyeRef.current.scale.y = eyeScaleY;
    }

    // Update light color dynamically
    if (lightRef.current) {
      const targetColor = new THREE.Color(EMOTION_COLORS[emotion] || "#00ffff");
      lightRef.current.color.lerp(targetColor, 0.05);
    }
  });

  const mikuCyan = "#00f0ff";
  const mikuHairDark = "#0088aa";
  const outfitDark = "#121824";
  const outfitTie = "#00ffff";
  const skinTone = "#ffeee6";

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Dynamic Emotion Light */}
      <directionalLight
        ref={lightRef}
        position={[3, 4, 3]}
        intensity={2.0}
        color={EMOTION_COLORS[emotion]}
      />
      <ambientLight intensity={0.7} color="#00ffff" />
      <pointLight position={[-3, -2, -2]} intensity={0.8} color="#ff00cc" />

      {/* Main Avatar Character Anchor */}
      <group position={[0, 0, 0]}>
        {/* Head Base */}
        <group ref={headRef} position={[0, 1.2, 0]}>
          {/* Face Mesh */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.55, sphereSegs, sphereSegs]} />
            <meshStandardMaterial color={skinTone} roughness={0.4} metalness={0.1} />
          </mesh>

          {/* Bangs / Front Hair */}
          <mesh position={[0, 0.28, 0.22]} rotation={[0.2, 0, 0]}>
            <coneGeometry args={[0.62, 0.45, cylinderSegs]} />
            <meshStandardMaterial color={mikuCyan} roughness={0.3} metalness={0.2} />
          </mesh>

          {/* Anime Eyes */}
          {/* Left Eye */}
          <group position={[-0.2, 0.05, 0.48]}>
            <mesh ref={leftEyeRef}>
              <planeGeometry args={[0.16, 0.22]} />
              <meshBasicMaterial color="#00d8ff" />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <circleGeometry args={[0.04, 16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Right Eye */}
          <group position={[0.2, 0.05, 0.48]}>
            <mesh ref={rightEyeRef}>
              <planeGeometry args={[0.16, 0.22]} />
              <meshBasicMaterial color="#00d8ff" />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <circleGeometry args={[0.04, 16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Blush Dots */}
          <mesh position={[-0.25, -0.08, 0.49]}>
            <circleGeometry args={[0.06, 16]} />
            <meshBasicMaterial color="#ff77aa" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.25, -0.08, 0.49]}>
            <circleGeometry args={[0.06, 16]} />
            <meshBasicMaterial color="#ff77aa" transparent opacity={0.6} />
          </mesh>

          {/* Animated Mouth */}
          <mesh ref={mouthRef} position={[0, -0.2, 0.49]}>
            <ringGeometry args={[0.01, 0.06, 16]} />
            <meshBasicMaterial color="#ff3366" />
          </mesh>

          {/* Miku Cyber Headset */}
          <group position={[0, 0.1, 0]}>
            {/* Band */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.58, 0.03, 16, 32, Math.PI]} />
              <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Left Headset Ear */}
            <mesh position={[-0.58, 0, 0]}>
              <boxGeometry args={[0.1, 0.2, 0.2]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-0.62, 0, 0]}>
              <boxGeometry args={[0.02, 0.12, 0.12]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
            {/* Right Headset Ear */}
            <mesh position={[0.58, 0, 0]}>
              <boxGeometry args={[0.1, 0.2, 0.2]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0.62, 0, 0]}>
              <boxGeometry args={[0.02, 0.12, 0.12]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>

            {/* Futuristic Headset Mic Arm */}
            <group position={[-0.58, -0.1, 0.15]} rotation={[0.3, -0.4, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.35]} />
              <meshStandardMaterial color="#333" />
              <mesh position={[0, -0.18, 0]}>
                <sphereGeometry args={[0.035, 16, 16]} />
                <meshBasicMaterial color="#00ffff" />
              </mesh>
            </group>
          </group>

          {/* Miku Iconic Twin-Tails */}
          {/* Left Twin-Tail */}
          <group ref={leftTailRef} position={[-0.52, 0.2, -0.1]}>
            {/* Hair Ribbons */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.12, 0.12, 0.12]} />
              <meshBasicMaterial color="#ff0055" />
            </mesh>
            {/* Long Hair Ribbon Flow */}
            <mesh position={[-0.25, -0.8, 0]} rotation={[0, 0, 0.2]}>
              <cylinderGeometry args={[0.08, 0.22, 1.8, 16]} />
              <meshStandardMaterial color={mikuCyan} roughness={0.25} metalness={0.3} />
            </mesh>
            <mesh position={[-0.32, -1.8, 0]} rotation={[0, 0, 0.3]}>
              <coneGeometry args={[0.22, 0.8, 16]} />
              <meshStandardMaterial color={mikuHairDark} roughness={0.3} />
            </mesh>
          </group>

          {/* Right Twin-Tail */}
          <group ref={rightTailRef} position={[0.52, 0.2, -0.1]}>
            {/* Hair Ribbons */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.12, 0.12, 0.12]} />
              <meshBasicMaterial color="#ff0055" />
            </mesh>
            {/* Long Hair Ribbon Flow */}
            <mesh position={[0.25, -0.8, 0]} rotation={[0, 0, -0.2]}>
              <cylinderGeometry args={[0.08, 0.22, 1.8, 16]} />
              <meshStandardMaterial color={mikuCyan} roughness={0.25} metalness={0.3} />
            </mesh>
            <mesh position={[0.32, -1.8, 0]} rotation={[0, 0, -0.3]}>
              <coneGeometry args={[0.22, 0.8, 16]} />
              <meshStandardMaterial color={mikuHairDark} roughness={0.3} />
            </mesh>
          </group>
        </group>

        {/* Miku Idol Torso & Outfit */}
        <group position={[0, 0.2, 0]}>
          {/* Neck */}
          <mesh position={[0, 0.52, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.15]} />
            <meshStandardMaterial color={skinTone} />
          </mesh>

          {/* Collar & Tie */}
          <mesh position={[0, 0.44, 0.22]}>
            <boxGeometry args={[0.06, 0.35, 0.02]} />
            <meshBasicMaterial color={outfitTie} />
          </mesh>

          {/* Vest / Top */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.32, 0.38, 0.65, 16]} />
            <meshStandardMaterial color={outfitDark} roughness={0.3} metalness={0.6} />
          </mesh>

          {/* Sleeves / Arm Covers */}
          {/* Left Arm Cover */}
          <group position={[-0.42, 0.15, 0]} rotation={[0, 0, 0.2]}>
            <cylinderGeometry args={[0.08, 0.14, 0.7]} />
            <meshStandardMaterial color="#1a202c" metalness={0.8} />
            <mesh position={[0, -0.32, 0]}>
              <cylinderGeometry args={[0.142, 0.142, 0.06]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          </group>

          {/* Right Arm Cover */}
          <group position={[0.42, 0.15, 0]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.08, 0.14, 0.7]} />
            <meshStandardMaterial color="#1a202c" metalness={0.8} />
            <mesh position={[0, -0.32, 0]}>
              <cylinderGeometry args={[0.142, 0.142, 0.06]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          </group>

          {/* Pleated Skirt */}
          <mesh position={[0, -0.22, 0]}>
            <coneGeometry args={[0.55, 0.35, 24]} />
            <meshStandardMaterial color="#1a202c" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.38, 0]}>
            <torusGeometry args={[0.55, 0.02, 16, 32]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
        </group>

        {/* Holographic Glowing Stage Floor */}
        <mesh position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.8, 32]} />
          <meshBasicMaterial color={EMOTION_COLORS[emotion]} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.8, 32]} />
          <meshBasicMaterial color="#0b1021" />
        </mesh>
      </group>
    </group>
  );
}
