import { useContext, useState } from "react";
import { BrainContext } from "../BrainContext";
import {
  Play,
  Square,
  RefreshCw,
  Radio,
  Server,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Package,
  Save,
  Coins,
  Sparkles,
} from "lucide-react";

export function LiveControl() {
  const {
    agentUrl,
    obsStatus,
    setObsStatus,
    agentStatus,
    scenes,
    addLog,
    gameState,
    spawnRandomWorldItem,
    triggerAutoSave,
    setActiveTab,
  } = useContext(BrainContext);
  const [loading, setLoading] = useState(false);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);

  const handleSpawnItem = () => {
    const spawned = spawnRandomWorldItem();
    setQuickNotice(`¡Reliquia "${spawned.name}" apareció en el escenario 3D!`);
    setTimeout(() => setQuickNotice(null), 3000);
  };

  const handleQuickSave = () => {
    triggerAutoSave("Guardado Rápido desde Panel Live");
    setQuickNotice("¡Partida guardada correctamente!");
    setTimeout(() => setQuickNotice(null), 3000);
  };

  const handleStartStream = async () => {
    setLoading(true);
    addLog("INFO", "FRONTEND", "Iniciando transmisión de stream...");
    try {
      if (agentStatus === "ONLINE" && agentUrl) {
        const res = await fetch(`${agentUrl}/live/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Agent-Token": "default_token",
          },
        });
        if (res.ok) {
          setObsStatus({ ...obsStatus, streaming: true });
          addLog("INFO", "FRONTEND", "Transmisión iniciada exitosamente en el Agente Local");
          return;
        }
      }

      // Fallback/Simulated Mode if agent is offline or fetch fails
      setObsStatus({ ...obsStatus, streaming: true });
      addLog("INFO", "FRONTEND", "El Agente Local está en modo simulación. Iniciando transmisión simulada (Modo Demo)");
    } catch (err: any) {
      console.warn("Error initiating stream on agent, falling back to simulation:", err);
      setObsStatus({ ...obsStatus, streaming: true });
      addLog("WARN", "FRONTEND", `Fallo de conexión con Agente Local (${err?.message || "Failed to fetch"}). Iniciando transmisión simulada (Modo Demo)`);
    } finally {
      setLoading(false);
    }
  };

  const handleStopStream = async () => {
    setLoading(true);
    addLog("INFO", "FRONTEND", "Deteniendo transmisión de stream...");
    try {
      if (agentStatus === "ONLINE" && agentUrl) {
        const res = await fetch(`${agentUrl}/live/stop`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Agent-Token": "default_token",
          },
        });
        if (res.ok) {
          setObsStatus({ ...obsStatus, streaming: false });
          addLog("INFO", "FRONTEND", "Transmisión detenida exitosamente en el Agente Local");
          return;
        }
      }

      // Fallback/Simulated Mode if agent is offline or fetch fails
      setObsStatus({ ...obsStatus, streaming: false });
      addLog("INFO", "FRONTEND", "Transmisión simulada detenida exitosamente (Modo Demo)");
    } catch (err: any) {
      console.warn("Error stopping stream on agent, falling back to simulation:", err);
      setObsStatus({ ...obsStatus, streaming: false });
      addLog("WARN", "FRONTEND", `Fallo de conexión con Agente Local (${err?.message || "Failed to fetch"}). Deteniendo transmisión simulada (Modo Demo)`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">🎬 Control de Transmisión</h2>
        </div>
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${
            obsStatus.streaming
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-slate-800 text-slate-400 border border-slate-700"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${obsStatus.streaming ? "bg-red-500 animate-ping" : "bg-slate-500"}`} />
          {obsStatus.streaming ? "TRANSMITIENDO A TIKTOK" : "FUERA DE AIRE"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleStartStream}
          disabled={loading || obsStatus.streaming}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold transition shadow-md shadow-cyan-500/20 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>INICIAR LIVE TO TIKTOK</span>
        </button>

        <button
          onClick={handleStopStream}
          disabled={loading || !obsStatus.streaming}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold transition shadow-md shadow-red-600/20 cursor-pointer"
        >
          <Square className="w-5 h-5 fill-current" />
          <span>DETENER TRANSMISIÓN</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
        <div className="space-y-1">
          <span className="text-slate-400 flex items-center gap-1">
            <Server className="w-3.5 h-3.5" /> Agente Local
          </span>
          <p className="font-bold text-slate-200">
            {agentStatus === "ONLINE" ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ONLINE
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> DEMO MODE
              </span>
            )}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-slate-400 flex items-center gap-1">
            <Monitor className="w-3.5 h-3.5" /> OBS WebSocket
          </span>
          <p className="font-bold text-slate-200">
            {obsStatus.connected ? (
              <span className="text-emerald-400">CONECTADO</span>
            ) : (
              <span className="text-slate-400">SIMULADO</span>
            )}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-slate-400">Escena Activa</span>
          <p className="font-bold text-cyan-300 truncate">{obsStatus.scene || "DEFAULT"}</p>
        </div>

        <div className="space-y-1">
          <span className="text-slate-400">Escenas Disponibles</span>
          <p className="font-bold text-slate-200">{scenes.length || 6} Escenas</p>
        </div>
      </div>

      {/* Quick notice toast */}
      {quickNotice && (
        <div className="bg-cyan-950 border border-cyan-400 text-cyan-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>{quickNotice}</span>
        </div>
      )}

      {/* Quick Game & Item Stream Actions */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300">{gameState?.player?.cyberCoins || 0} ₢</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            Nivel: <strong className="text-cyan-400">{gameState?.player?.level || 1}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            Items: <strong className="text-emerald-400">{gameState?.inventory?.length || 0}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSpawnItem}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition cursor-pointer flex items-center gap-1"
            title="Generar objeto en el espacio 3D"
          >
            <Sparkles className="w-3 h-3" />
            <span>Generar Reliquia</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition cursor-pointer flex items-center gap-1"
            title="Abrir Inventario"
          >
            <Package className="w-3 h-3" />
            <span>Inventario</span>
          </button>

          <button
            onClick={handleQuickSave}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1"
            title="Guardar Estado Actual"
          >
            <Save className="w-3 h-3 text-cyan-400" />
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
