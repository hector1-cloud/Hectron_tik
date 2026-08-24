import { useState, useContext, useRef } from "react";
import { BrainContext } from "../BrainContext";
import { SaveSlotMetadata } from "../types";
import {
  Save,
  Download,
  Upload,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  Clock,
  Shield,
  Coins,
  CheckCircle2,
  AlertCircle,
  Database,
  Cloud,
  FileJson,
  Package,
  Activity,
  Layers,
  Smile,
} from "lucide-react";

export function SaveLoadManager() {
  const {
    gameState,
    saveSlots,
    saveGame,
    loadGame,
    deleteSave,
    exportSaveData,
    importSaveData,
    isAutoSaving,
    lastAutoSaveTime,
    triggerAutoSave,
    setActiveTab,
  } = useContext(BrainContext);

  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (text: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleManualSave = async (slotId: string, slotName?: string) => {
    const res = await saveGame(slotId, slotName);
    if (res.success) {
      showNotification(res.message, "success");
    } else {
      showNotification(res.message, "error");
    }
  };

  const handleLoad = async (slotId: string) => {
    const res = await loadGame(slotId);
    if (res.success) {
      showNotification(res.message, "success");
    } else {
      showNotification(res.message, "error");
    }
  };

  const handleDelete = async (slotId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este punto de guardado?")) {
      const res = await deleteSave(slotId);
      if (res.success) {
        showNotification(res.message, "info");
      } else {
        showNotification(res.message, "error");
      }
    }
  };

  const handleExportJSON = (slotId = "autosave") => {
    const dataStr = exportSaveData(slotId);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hectron_game_save_${slotId}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Archivo de guardado exportado correctamente.", "success");
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await importSaveData(content);
        if (res.success) {
          showNotification(res.message, "success");
          setIsImportModalOpen(false);
        } else {
          showNotification(res.message, "error");
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleTextImport = async () => {
    if (!importJsonText.trim()) return;
    const res = await importSaveData(importJsonText);
    if (res.success) {
      showNotification(res.message, "success");
      setImportJsonText("");
      setIsImportModalOpen(false);
    } else {
      showNotification(res.message, "error");
    }
  };

  const formatPlaytime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // Fixed slot definitions for organized UI
  const definedSlots = [
    { id: "autosave", name: "Guardado Automático (Auto-Save)", isAuto: true, desc: "Se actualiza tras recolectar objetos, regalos de TikTok y subidas de nivel." },
    { id: "slot_1", name: "Ranura de Guardado 1", isAuto: false, desc: "Punto de guardado manual principal." },
    { id: "slot_2", name: "Ranura de Guardado 2", isAuto: false, desc: "Punto de guardado secundario." },
    { id: "slot_3", name: "Ranura de Guardado 3", isAuto: false, desc: "Punto de guardado de respaldo." },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-4 lg:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <Save className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                  Sistema de Guardado y Carga
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  <span>Dual Layer: Local + Firestore</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Guarda tu estado de juego, inventario, niveles y configuración automáticamente o en ranuras manuales.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleManualSave("autosave", "Guardado Rápido")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Estado Actual</span>
            </button>

            <button
              onClick={() => handleExportJSON("autosave")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Exportar JSON</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Importar JSON</span>
            </button>
          </div>
        </div>

        {/* Auto-save Status Indicator Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isAutoSaving ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
            <span>
              {isAutoSaving ? "Guardando estado del juego..." : "Sistema de auto-guardado activo"}
            </span>
            {lastAutoSaveTime && (
              <span className="text-slate-500 font-mono">
                (Último guardado: {lastAutoSaveTime})
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono">
            <div>Tiempo de Juego: <span className="text-cyan-300 font-bold">{formatPlaytime(gameState.playtimeSeconds)}</span></div>
            <div>Nivel Actual: <span className="text-emerald-300 font-bold">{gameState.player.level}</span></div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in ${
            notification.type === "success"
              ? "bg-emerald-950/90 border border-emerald-400 text-emerald-200 shadow-emerald-500/20"
              : notification.type === "error"
              ? "bg-rose-950/90 border border-rose-400 text-rose-200 shadow-rose-500/20"
              : "bg-cyan-950/90 border border-cyan-400 text-cyan-200 shadow-cyan-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : notification.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-cyan-400" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Save Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {definedSlots.map((defSlot) => {
          const slotData = saveSlots.find((s) => s.slotId === defSlot.id);
          const hasData = Boolean(slotData);

          return (
            <div
              key={defSlot.id}
              className={`rounded-2xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
                defSlot.isAuto
                  ? "bg-gradient-to-b from-cyan-950/30 to-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Top Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        defSlot.isAuto
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {defSlot.isAuto ? <Sparkles className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{defSlot.name}</h3>
                      <div className="text-[11px] text-slate-400">{defSlot.desc}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      hasData
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-950 text-slate-500 border-slate-800"
                    }`}
                  >
                    {hasData ? "Guardado" : "Vacío"}
                  </span>
                </div>

                {/* Slot Details Body */}
                {hasData && slotData ? (
                  <div className="mt-3 bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Fecha / Hora:</span>
                      </span>
                      <span className="text-slate-200 font-mono font-medium">
                        {new Date(slotData.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Nivel</div>
                        <div className="text-cyan-300 font-bold">Nivel {slotData.playerLevel}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">CyberCoins</div>
                        <div className="text-amber-300 font-bold">{slotData.cyberCoins} ₢</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Objetos</div>
                        <div className="text-emerald-300 font-bold">{slotData.inventoryCount} items</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Escena: <span className="text-slate-200 font-mono">{slotData.activeScene}</span></span>
                      <span>Tiempo: <span className="text-slate-200 font-mono">{formatPlaytime(slotData.playtimeSeconds)}</span></span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 bg-slate-950/40 rounded-xl p-6 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No hay datos de guardado en esta ranura. Haz clic en "Guardar Aquí" para registrar el estado actual.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManualSave(defSlot.id, defSlot.name)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{hasData ? "Sobrescribir" : "Guardar Aquí"}</span>
                  </button>

                  {hasData && (
                    <button
                      onClick={() => handleLoad(defSlot.id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Cargar Partida</span>
                    </button>
                  )}
                </div>

                {hasData && !defSlot.isAuto && (
                  <button
                    onClick={() => handleDelete(defSlot.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                    title="Eliminar partida guardada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Importar Archivo de Partida</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Selecciona un archivo JSON exportado previamente desde HECTRON Studio o pega el código JSON directamente.
            </p>

            <div className="space-y-3">
              {/* File Input */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 rounded-xl p-5 text-center cursor-pointer transition"
              >
                <FileJson className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-200">
                  Haz clic para seleccionar archivo (.json)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </div>

              <div className="text-center text-xs text-slate-500 font-bold uppercase">O pega el contenido JSON</div>

              <textarea
                rows={4}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"version": 1, "player": { ... }}'
                className="w-full bg-slate-950 text-xs font-mono text-slate-200 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleTextImport}
                disabled={!importJsonText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition"
              >
                Cargar JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
