import { useContext, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { BrainContext } from "../BrainContext";
import { HectronCloud } from "./HectronCloud";
import { Particles, Glow, TransitionEffect, Bubbles } from "./Effects";
import { WorldCollectibles3D } from "./WorldCollectibles3D";
import {
  Sparkles,
  Radio,
  Volume2,
  MessageSquare,
  Package,
  Save,
  Coins,
  Battery,
  Layers,
  Award,
} from "lucide-react";

export function Overlay() {
  const {
    emotion,
    obsStatus,
    messages,
    latestSpeechText,
    isSpeaking,
    gameState,
    pickupWorldItem,
    setActiveTab,
    isAutoSaving,
    lastAutoSaveTime,
  } = useContext(BrainContext);
  const [transitioning, setTransitioning] = useState(false);

  const lastAiMessage = messages.filter((m) => m.isAi).slice(-1)[0];

  useEffect(() => {
    setTransitioning(true);
    const timer = setTimeout(() => setTransitioning(false), 800);
    return () => clearTimeout(timer);
  }, [emotion]);

  const activeSpawnCount = gameState.worldSpawnedItems.filter((i) => !i.collected).length;

  return (
    <div className="relative w-full h-screen bg-slate-950/90 overflow-hidden select-none font-sans">
      {/* 3D Canvas Background & Character */}
      <div className="absolute inset-0 z-0">
        <Canvas
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 1.2, 3.8], fov: 48 }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#0a0e1a"]} />

          {/* Ambient Lighting */}
          <ambientLight intensity={0.6} color="#00e1ff" />

          {/* FX Layer */}
          <Particles count={450} color="#00ffff" />
          <Glow color="#00ffff" intensity={1.4} position={[0, 2, 0]} />
          <TransitionEffect active={transitioning} color="#00ffff" />
          <Bubbles emotion={emotion} count={18} />

          {/* 3D Interactive Collectible World Items */}
          <WorldCollectibles3D
            items={gameState.worldSpawnedItems}
            onPickup={pickupWorldItem}
          />

          {/* 3D Miku Avatar */}
          <HectronCloud emotion={emotion} isSpeaking={isSpeaking} />
        </Canvas>
      </div>

      {/* Top Floating Stream & Game Badge Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-full shadow-lg shadow-cyan-500/10 pointer-events-auto">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-bold tracking-wider text-sm">HECTRON STREAMER STUDIO</span>
          <span className="text-xs text-slate-400 border-l border-slate-700 pl-2">Nivel {gameState.player.level}</span>
        </div>

        {/* Game Stats & Quick Navigation in 3D Mode */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* CyberCoins Chip */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 rounded-full text-amber-300 text-xs font-bold shadow-lg">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{gameState.player.cyberCoins} ₢</span>
          </div>

          {/* Auto-Save Indicator */}
          {isAutoSaving && (
            <div className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              <Save className="w-3.5 h-3.5" />
              <span>Guardando...</span>
            </div>
          )}

          {/* Quick Inventory Access Button */}
          <button
            onClick={() => setActiveTab("inventory")}
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg shadow-cyan-500/20 transition cursor-pointer active:scale-95"
            title="Abrir Inventario"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventario ({gameState.inventory.length})</span>
            {activeSpawnCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-0.5" />
            )}
          </button>

          {/* Quick Save/Load Button */}
          <button
            onClick={() => setActiveTab("saves")}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-full shadow-lg transition cursor-pointer"
            title="Abrir Menú de Guardado y Carga"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span>Partidas</span>
          </button>

          {obsStatus.streaming ? (
            <div className="flex items-center gap-2 bg-red-600/90 text-white font-bold text-xs px-3 py-1.5 rounded-full animate-pulse shadow-lg shadow-red-500/30">
              <Radio className="w-4 h-4" />
              <span>● LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-800/80 text-slate-400 font-medium text-xs px-3 py-1.5 rounded-full border border-slate-700">
              <Radio className="w-4 h-4" />
              <span>OFFLINE</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-full text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{emotion}</span>
          </div>
        </div>
      </div>

      {/* World Items Floating Collector Tip (Top Left) */}
      {activeSpawnCount > 0 && (
        <div className="absolute top-20 left-4 z-10 bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 p-3 rounded-xl shadow-xl max-w-xs animate-fade-in pointer-events-auto">
          <div className="text-[11px] font-black text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>¡{activeSpawnCount} Objeto(s) Descubiertos!</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            Haz clic directamente sobre los cristales y gemas que flotan alrededor de Miku para recolectarlos a tu inventario.
          </p>
        </div>
      )}

      {/* Bottom Subtitle / Speech Bubble Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl z-10 pointer-events-none">
        {(latestSpeechText || lastAiMessage) && (
          <div className="bg-slate-900/90 border-2 border-cyan-400/60 backdrop-blur-xl p-5 rounded-2xl shadow-2xl shadow-cyan-500/20 text-center transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> HECTRON (Miku)
              </span>
              {isSpeaking && (
                <span className="flex items-center gap-1 text-xs text-pink-400 animate-pulse font-semibold">
                  <Volume2 className="w-3.5 h-3.5" /> Hablando...
                </span>
              )}
            </div>
            <p className="text-white text-lg font-medium leading-relaxed drop-shadow">
              "{latestSpeechText || lastAiMessage?.text}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
