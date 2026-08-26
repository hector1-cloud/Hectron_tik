import React, { useState } from "react";
import {
  Tv,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Layers,
  Camera,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Sliders,
  Maximize2
} from "lucide-react";

interface ObsSceneTrigger {
  id: string;
  name: string;
  sceneName: string;
  description: string;
  icon: string;
  color: string;
  badge: string;
}

interface ObsSourceToggle {
  id: string;
  name: string;
  sourceName: string;
  sceneName: string;
  visible: boolean;
  type: "overlay" | "camera_filter" | "sfx" | "3d_layer";
}

const DEFAULT_SCENES: ObsSceneTrigger[] = [
  {
    id: "scene_default",
    name: "Cámara Principal + HUD",
    sceneName: "DEFAULT",
    description: "Escena estándar de transmisión con avatar, webcam y chat superpuesto.",
    icon: "Camera",
    color: "from-blue-600 to-indigo-600",
    badge: "MAIN"
  },
  {
    id: "scene_flirt",
    name: "Modo Regalo / Agradecimiento",
    sceneName: "FLIRT_SCENE",
    description: "Activada automáticamente al recibir Rosas o Regalos. Luces cálidas y animación.",
    icon: "Sparkles",
    color: "from-pink-600 to-rose-600",
    badge: "GIFT REACT"
  },
  {
    id: "scene_surprise",
    name: "Sorpresa / Regalo Épico",
    sceneName: "SURPRISE_SCENE",
    description: "Para Coronas, Galaxias o Donaciones grandes. Efecto visual intenso y confeti.",
    icon: "Zap",
    color: "from-amber-500 to-orange-600",
    badge: "EPIC REACT"
  },
  {
    id: "scene_gameplay",
    name: "Modo Gaming / Hectron 3D",
    sceneName: "GAMEPLAY_3D",
    description: "Pantalla completa de juego con cámara miniaturizada en esquina.",
    icon: "Layers",
    color: "from-purple-600 to-violet-600",
    badge: "GAME"
  },
  {
    id: "scene_brb",
    name: "Pausa / Ya Regreso (BRB)",
    sceneName: "GAMING_BRB",
    description: "Pantalla de espera interactiva con chat en vivo y cuenta regresiva.",
    icon: "Clock",
    color: "from-slate-700 to-slate-850",
    badge: "INTERMISSION"
  }
];

const DEFAULT_SOURCES: ObsSourceToggle[] = [
  {
    id: "src_follower_alert",
    name: "Alerta de Seguidor",
    sourceName: "FollowerAlertOverlay",
    sceneName: "DEFAULT",
    visible: true,
    type: "overlay"
  },
  {
    id: "src_gift_burst",
    name: "Partículas de Regalos",
    sourceName: "GiftParticleEmitter",
    sceneName: "DEFAULT",
    visible: true,
    type: "overlay"
  },
  {
    id: "src_sub_goal",
    name: "Barra de Meta (Sub Goal)",
    sourceName: "SubGoalBar",
    sceneName: "DEFAULT",
    visible: true,
    type: "overlay"
  },
  {
    id: "src_bloom_filter",
    name: "Filtro Cyber Glow / Bloom",
    sourceName: "MainWebcamFilter",
    sceneName: "DEFAULT",
    visible: false,
    type: "camera_filter"
  },
  {
    id: "src_avatar_3d",
    name: "Avatar Hectron 3D Layer",
    sourceName: "DuixAvatarSource",
    sceneName: "DEFAULT",
    visible: true,
    type: "3d_layer"
  }
];

interface ObsTriggerManagerProps {
  isConnected: boolean;
  onExecuteAction: (actionName: string, args?: Record<string, any>) => Promise<void> | void;
  onLog?: (type: "IN" | "OUT" | "INFO" | "ERROR", msg: string) => void;
}

export function ObsTriggerManager({
  isConnected,
  onExecuteAction,
  onLog
}: ObsTriggerManagerProps) {
  const [activeScene, setActiveScene] = useState<string>("DEFAULT");
  const [sources, setSources] = useState<ObsSourceToggle[]>(DEFAULT_SOURCES);
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [desktopMuted, setDesktopMuted] = useState<boolean>(false);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [customSceneInput, setCustomSceneInput] = useState<string>("");

  const handleSwitchScene = async (sceneName: string) => {
    setIsTriggering(true);
    setLastExecuted(`Cambio de escena a "${sceneName}"`);
    setActiveScene(sceneName);

    if (onLog) {
      onLog("OUT", `[OBS Trigger] Cambiando a escena: ${sceneName}`);
    }

    try {
      await onExecuteAction("Hectron_OBS_SetScene", {
        sceneName,
        platform: "obs_websocket_v5",
        timestamp: Date.now()
      });
    } catch (err: any) {
      if (onLog) onLog("ERROR", `Error cambiando escena OBS: ${err.message}`);
    } finally {
      setTimeout(() => setIsTriggering(false), 300);
    }
  };

  const handleToggleSource = async (sourceId: string) => {
    const targetSource = sources.find((s) => s.id === sourceId);
    if (!targetSource) return;

    const nextState = !targetSource.visible;
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, visible: nextState } : s))
    );

    if (onLog) {
      onLog(
        "OUT",
        `[OBS Source] ${targetSource.sourceName} visibilidad: ${nextState ? "VISIBLE" : "OCULTO"}`
      );
    }
    onExecuteAction("Hectron_OBS_ToggleSource", {
      sourceName: targetSource.sourceName,
      sceneName: targetSource.sceneName,
      visible: nextState
    });
  };

  const handleToggleAudio = async (type: "mic" | "desktop") => {
    if (type === "mic") {
      const next = !micMuted;
      setMicMuted(next);
      if (onLog) onLog("OUT", `[OBS Audio] Micrófono: ${next ? "MUTED" : "UNMUTED"}`);
      onExecuteAction("Hectron_OBS_ToggleAudio", {
        sourceName: "Mic/Aux",
        mute: next
      });
    } else {
      const next = !desktopMuted;
      setDesktopMuted(next);
      if (onLog) onLog("OUT", `[OBS Audio] Desktop Audio: ${next ? "MUTED" : "UNMUTED"}`);
      onExecuteAction("Hectron_OBS_ToggleAudio", {
        sourceName: "Desktop Audio",
        mute: next
      });
    }
  };

  const handlePlaySfx = (sfxName: string) => {
    if (onLog) onLog("OUT", `[OBS SFX] Reproduciendo efecto: ${sfxName}`);
    onExecuteAction("Hectron_OBS_PlaySfx", { sfx: sfxName });
    setLastExecuted(`SFX disparado: ${sfxName}`);
  };

  const handleInstantReplay = () => {
    if (onLog) onLog("OUT", `[OBS Replay] Guardando buffer de repetición instantánea...`);
    onExecuteAction("Hectron_OBS_SaveReplayBuffer", {});
    setLastExecuted("OBS Replay Buffer Guardado");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Matriz de Triggers OBS Studio (v5)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                Streamer.bot Bridge
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Controla y dispara cambios de escenas, fuentes, filtros y audio en vivo desde Hectron.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {lastExecuted && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lastExecuted}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Scene Matrix & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scenes Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Selector Rápido de Escenas</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Escena activa: <strong className="text-purple-300">{activeScene}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {DEFAULT_SCENES.map((scene) => {
                const isActive = activeScene === scene.sceneName;
                return (
                  <button
                    key={scene.id}
                    onClick={() => handleSwitchScene(scene.sceneName)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden group ${
                      isActive
                        ? "bg-slate-850 border-purple-500 shadow-md shadow-purple-500/20 ring-1 ring-purple-500/50"
                        : "bg-slate-950/80 hover:bg-slate-850/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          isActive
                            ? "bg-purple-950 text-purple-300 border-purple-500/40"
                            : "bg-slate-900 text-slate-400 border-slate-700"
                        }`}
                      >
                        {scene.badge}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>

                    <div className="font-bold text-white text-xs group-hover:text-purple-300 transition">
                      {scene.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      OBS: {scene.sceneName}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1.5 leading-snug">
                      {scene.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Scene Input */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={customSceneInput}
                onChange={(e) => setCustomSceneInput(e.target.value)}
                placeholder="Nombre de escena personalizada en OBS..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customSceneInput.trim()) {
                    handleSwitchScene(customSceneInput.trim());
                    setCustomSceneInput("");
                  }
                }}
                disabled={!customSceneInput.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          </div>

          {/* Quick SFX & Replay Controls */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Efectos Sonoros y Replay Rápido</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Trigger inmediato</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handlePlaySfx("tada.wav")}
                className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-pink-500/40 rounded-lg text-left transition cursor-pointer group"
              >
                <div className="text-xs font-bold text-pink-300 group-hover:text-pink-200">🎉 Ta-Dá!</div>
                <div className="text-[10px] text-slate-500 font-mono">Regalo / Éxito</div>
              </button>

              <button
                type="button"
                onClick={() => handlePlaySfx("chimes.wav")}
                className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-lg text-left transition cursor-pointer group"
              >
                <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200">🔔 Chimes</div>
                <div className="text-[10px] text-slate-500 font-mono">Sub / Follow</div>
              </button>

              <button
                type="button"
                onClick={() => handlePlaySfx("horn.wav")}
                className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/40 rounded-lg text-left transition cursor-pointer group"
              >
                <div className="text-xs font-bold text-rose-300 group-hover:text-rose-200">📯 Epic Horn</div>
                <div className="text-[10px] text-slate-500 font-mono">Mega Donación</div>
              </button>

              <button
                type="button"
                onClick={handleInstantReplay}
                className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-left transition cursor-pointer group"
              >
                <div className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200 flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Replay Clip
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Guardar 30s</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sources & Audio Toggles */}
        <div className="space-y-6">
          {/* Sources & Overlays Visibility */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Fuentes y Capas OBS</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {sources.filter((s) => s.visible).length}/{sources.length} ON
              </span>
            </div>

            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      {source.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {source.sourceName}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSource(source.id)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                      source.visible
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-850 border-slate-700 text-slate-400"
                    }`}
                  >
                    {source.visible ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ON</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span>OFF</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Audio Mute Matrix */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Control de Audio OBS</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleAudio("mic")}
                className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  micMuted
                    ? "bg-rose-950/60 border-rose-500/40 text-rose-300"
                    : "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-200"
                }`}
              >
                {micMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
                <span className="text-xs font-bold">{micMuted ? "Mic Silenciado" : "Mic Activo"}</span>
                <span className="text-[9px] font-mono text-slate-500">Mic/Aux</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleAudio("desktop")}
                className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  desktopMuted
                    ? "bg-rose-950/60 border-rose-500/40 text-rose-300"
                    : "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-200"
                }`}
              >
                {desktopMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
                <span className="text-xs font-bold">{desktopMuted ? "Audio Silenciado" : "Audio Activo"}</span>
                <span className="text-[9px] font-mono text-slate-500">Desktop Audio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
