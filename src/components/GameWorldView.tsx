import { useContext, useState } from "react";
import { BrainContext } from "../BrainContext";
import { Canvas } from "@react-three/fiber";
import { HectronCloud } from "./HectronCloud";
import { Particles, Glow, TransitionEffect, Bubbles } from "./Effects";
import { WorldCollectibles3D } from "./WorldCollectibles3D";
import { RARITY_CONFIG } from "../lib/gameCatalog";
import {
  Gamepad2,
  Package,
  Save,
  Sparkles,
  Zap,
  Coins,
  Battery,
  Trophy,
  Activity,
  Flame,
  Volume2,
  Radio,
  CheckCircle2,
  HelpCircle,
  Eye,
} from "lucide-react";

export function GameWorldView() {
  const {
    gameState,
    emotion,
    setEmotion,
    isSpeaking,
    pickupWorldItem,
    spawnRandomWorldItem,
    collectItem,
    gainCoins,
    gainExperience,
    triggerAutoSave,
    setActiveTab,
    isAutoSaving,
    lastAutoSaveTime,
  } = useContext(BrainContext);

  const [questObjective, setQuestObjective] = useState<string>(
    "Recolecta 3 cristales de éter flotando en el escenario para desbloquear la Corona Streamer."
  );
  const [questCompleted, setQuestCompleted] = useState<boolean>(false);
  const [pickupAlert, setPickupAlert] = useState<string | null>(null);

  const handleSpawnAndAlert = () => {
    const item = spawnRandomWorldItem();
    setPickupAlert(`¡Apareció "${item.name}" en el espacio 3D!`);
    setTimeout(() => setPickupAlert(null), 3000);
  };

  const handleManualPickup = (spawnedId: string) => {
    pickupWorldItem(spawnedId);
    setPickupAlert("¡Objeto añadido a tu inventario!");
    setTimeout(() => setPickupAlert(null), 3000);
  };

  const handleCompleteQuest = () => {
    if (!questCompleted) {
      setQuestCompleted(true);
      gainCoins(300);
      gainExperience(100);
      collectItem("streamer_crown", 1);
      triggerAutoSave("Misión completada");
      setPickupAlert("🎉 ¡Misión completada! +300 CyberCoins, +100 XP y Corona Desbloqueada.");
      setTimeout(() => setPickupAlert(null), 4000);
    }
  };

  const activeSpawned = gameState.worldSpawnedItems.filter((i) => !i.collected);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-4 lg:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                  Modo Juego & Exploración 3D
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Nivel {gameState.player.level}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Interactúa con el escenario 3D en vivo de Miku, descubre reliquias flotantes y progresa en las misiones.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("inventory")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Ver Inventario ({gameState.inventory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("saves")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>Guardar / Cargar</span>
            </button>

            <button
              onClick={handleSpawnAndAlert}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20 transition cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generar Reliquia 3D</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {pickupAlert && (
        <div className="bg-gradient-to-r from-cyan-950/90 to-indigo-950/90 border border-cyan-400 text-cyan-200 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg shadow-cyan-500/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{pickupAlert}</span>
          </div>
          <button onClick={() => setPickupAlert(null)} className="text-cyan-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: 3D Interactive Stage Canvas (Left 8 cols) + Quests & Stats HUD (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 3D Stage Box (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl relative h-[520px] flex flex-col justify-between">
          {/* Canvas */}
          <div className="absolute inset-0 z-0">
            <Canvas
              gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
              camera={{ position: [0, 1.2, 3.8], fov: 48 }}
              style={{ width: "100%", height: "100%" }}
            >
              <color attach="background" args={["#080c18"]} />
              <ambientLight intensity={0.7} color="#00e1ff" />
              <Particles count={400} color="#00ffff" />
              <Glow color="#00ffff" intensity={1.2} position={[0, 2, 0]} />
              <Bubbles emotion={emotion} count={16} />

              {/* Interactive Collectible Items floating in the 3D Canvas */}
              <WorldCollectibles3D
                items={gameState.worldSpawnedItems}
                onPickup={handleManualPickup}
              />

              {/* 3D Miku Avatar */}
              <HectronCloud emotion={emotion} isSpeaking={isSpeaking} />
            </Canvas>
          </div>

          {/* Top HUD Overlay Inside 3D Box */}
          <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-cyan-300 shadow-md flex items-center gap-2 pointer-events-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Escenario 3D Interactivo</span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              {isAutoSaving && (
                <div className="bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full animate-pulse shadow-md flex items-center gap-1">
                  <Save className="w-3 h-3" />
                  <span>Auto-Guardando...</span>
                </div>
              )}

              <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/30 px-3 py-1 rounded-full text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-md">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{gameState.player.cyberCoins} ₢</span>
              </div>
            </div>
          </div>

          {/* Bottom HUD Click Hint Inside 3D Box */}
          <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 p-2.5 rounded-xl text-xs text-slate-300 max-w-sm pointer-events-auto shadow-lg">
              <div className="font-bold text-cyan-400 flex items-center gap-1 text-[11px] uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instrucción de Juego</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Haz clic en los cristales y gemas 3D que flotan alrededor de Miku para recogerlos al inventario.
              </p>
            </div>

            {/* Spawn count badge */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono text-cyan-300 pointer-events-auto">
              Objetos activos en escena: <span className="font-bold text-white">{activeSpawned.length}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Quests, Active Relics & Character Stats (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Quest Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Misión Principal
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  questCompleted
                    ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-950 text-amber-300 border-amber-500/40"
                }`}
              >
                {questCompleted ? "Completada" : "En Progreso"}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {questObjective}
            </p>

            <button
              onClick={handleCompleteQuest}
              disabled={questCompleted}
              className={`w-full py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                questCompleted
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{questCompleted ? "Recompensas Reclamadas" : "Reclamar Recompensa de Misión"}</span>
            </button>
          </div>

          {/* Player Stats & Aura Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Estadísticas de Explorador</span>
              </div>
              <span className="text-xs font-bold text-cyan-400">Nivel {gameState.player.level}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Aura Activa:</span>
                <span className="text-cyan-300 font-bold font-mono">{gameState.activeAura}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Objetos Recolectados:</span>
                <span className="text-emerald-300 font-bold">{gameState.streamStats.itemsCollectedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Energía de Miku:</span>
                <span className="text-slate-200 font-bold">{gameState.player.energy} / {gameState.player.maxEnergy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Regalos TikTok:</span>
                <span className="text-pink-300 font-bold">{gameState.streamStats.giftsReceivedCount}</span>
              </div>
            </div>

            {/* Quick Emotion Reaction Triggers */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[11px] uppercase font-bold text-slate-400 mb-2">Reacción Emocional de Miku</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["HAPPY", "FLIRT", "SURPRISE", "ANGRY", "SAD", "IDLE"] as const).map((em) => (
                  <button
                    key={em}
                    onClick={() => {
                      setEmotion(em);
                      triggerAutoSave(`Emoción cambiada a ${em}`);
                    }}
                    className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      emotion === em
                        ? "bg-cyan-500 text-slate-950 font-black"
                        : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
