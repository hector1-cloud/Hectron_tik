import { useState, useContext, useMemo } from "react";
import { BrainContext } from "../BrainContext";
import { LogLevel, LogScope } from "../types";
import {
  Terminal,
  Shield,
  RefreshCw,
  Trash2,
  Copy,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Info,
  Bug,
  AlertOctagon,
  Sparkles,
  Music2,
  Server,
  Layers,
  Search,
  X,
  Radio,
} from "lucide-react";

export type PriorityFilter = "ALL" | "INFO" | "WARN" | "ERROR" | "DEBUG";
export type SourceFilter = "ALL" | "TIKTOK" | "AI" | "SYSTEM";

export function LogsView() {
  const { logs, clearLogs, addLog } = useContext(BrainContext);
  const [selectedLevel, setSelectedLevel] = useState<PriorityFilter>("ALL");
  const [selectedSource, setSelectedSource] = useState<SourceFilter>("ALL");
  const [search, setSearch] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Helper to categorize log source into TIKTOK, AI, or SYSTEM
  const matchSource = (log: { scope: LogScope; message: string }, filter: SourceFilter): boolean => {
    if (filter === "ALL") return true;
    if (filter === "TIKTOK") {
      return log.scope === "TIKTOK" || log.message.toLowerCase().includes("tiktok");
    }
    if (filter === "AI") {
      return (
        log.scope === "AGENT" ||
        (log.scope as any) === "AI" ||
        log.message.toLowerCase().includes("ai") ||
        log.message.toLowerCase().includes("gemini") ||
        log.message.toLowerCase().includes("brain") ||
        log.message.toLowerCase().includes("tts") ||
        log.message.toLowerCase().includes("miku")
      );
    }
    if (filter === "SYSTEM") {
      return (
        log.scope === "SERVER" ||
        log.scope === "FRONTEND" ||
        log.scope === "WORKFLOW" ||
        log.scope === "3D" ||
        (log.scope as any) === "SYSTEM"
      );
    }
    return true;
  };

  // Compute counts for toggle badges
  const counts = useMemo(() => {
    return {
      all: logs.length,
      info: logs.filter((l) => l.level === "INFO").length,
      warn: logs.filter((l) => l.level === "WARN").length,
      error: logs.filter((l) => l.level === "ERROR").length,
      debug: logs.filter((l) => l.level === "DEBUG").length,
      tiktok: logs.filter((l) => matchSource(l, "TIKTOK")).length,
      ai: logs.filter((l) => matchSource(l, "AI")).length,
      system: logs.filter((l) => matchSource(l, "SYSTEM")).length,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedLevel !== "ALL" && log.level !== selectedLevel) return false;
      if (!matchSource(log, selectedSource)) return false;
      if (search) {
        const query = search.toLowerCase();
        const msgMatch = log.message.toLowerCase().includes(query);
        const scopeMatch = log.scope.toLowerCase().includes(query);
        const levelMatch = log.level.toLowerCase().includes(query);
        if (!msgMatch && !scopeMatch && !levelMatch) return false;
      }
      return true;
    });
  }, [logs, selectedLevel, selectedSource, search]);

  const handleCopy = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.scope}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertOctagon className="w-3 h-3" /> ERROR
          </span>
        );
      case "WARN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> WARN
          </span>
        );
      case "INFO":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Info className="w-3 h-3" /> INFO
          </span>
        );
      case "DEBUG":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Bug className="w-3 h-3" /> DEBUG
          </span>
        );
    }
  };

  const getScopeBadge = (scope: LogScope) => {
    const colors: Record<LogScope, string> = {
      SERVER: "bg-blue-950/80 text-blue-300 border-blue-800",
      FRONTEND: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
      AGENT: "bg-indigo-950/80 text-indigo-300 border-indigo-800",
      TIKTOK: "bg-pink-950/80 text-pink-300 border-pink-800",
      "3D": "bg-cyan-950/80 text-cyan-300 border-cyan-800",
      WORKFLOW: "bg-orange-950/80 text-orange-300 border-orange-800",
      ACHIEVEMENT: "bg-amber-950/80 text-amber-300 border-amber-800",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${colors[scope] || "bg-slate-800 text-slate-300"}`}>
        {scope}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Telemetría & Registro de Eventos
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                {filteredLogs.length} / {logs.length} eventos
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Observabilidad en vivo con filtrado reactivo por nivel de prioridad y origen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addLog("INFO", "FRONTEND", "Evento de prueba emitido desde consola de observabilidad")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Emitir Prueba
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "¡Copiados!" : "Copiar Logs"}
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 text-xs font-medium border border-rose-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar Buffer
          </button>
        </div>
      </div>

      {/* Modern Filter Utility Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Priority Level Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              Prioridad:
            </span>

            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setSelectedLevel("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLevel === "ALL"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>TODOS</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400">
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => setSelectedLevel("INFO")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLevel === "INFO"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-cyan-300"
                }`}
              >
                <Info className="w-3 h-3 text-cyan-400" />
                <span>INFO</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300">
                  {counts.info}
                </span>
              </button>

              <button
                onClick={() => setSelectedLevel("WARN")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLevel === "WARN"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-amber-300"
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>WARN</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300">
                  {counts.warn}
                </span>
              </button>

              <button
                onClick={() => setSelectedLevel("ERROR")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLevel === "ERROR"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                    : "text-slate-400 hover:text-rose-300"
                }`}
              >
                <AlertOctagon className="w-3 h-3 text-rose-400" />
                <span>ERROR</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300">
                  {counts.error}
                </span>
              </button>

              <button
                onClick={() => setSelectedLevel("DEBUG")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLevel === "DEBUG"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                    : "text-slate-400 hover:text-purple-300"
                }`}
              >
                <Bug className="w-3 h-3 text-purple-400" />
                <span>DEBUG</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-300">
                  {counts.debug}
                </span>
              </button>
            </div>
          </div>

          {/* Source Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Origen:
            </span>

            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setSelectedSource("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSource === "ALL"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>TODOS</span>
              </button>

              <button
                onClick={() => setSelectedSource("TIKTOK")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSource === "TIKTOK"
                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm"
                    : "text-slate-400 hover:text-pink-300"
                }`}
              >
                <Music2 className="w-3 h-3 text-pink-400" />
                <span>TIKTOK</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-950 text-pink-300">
                  {counts.tiktok}
                </span>
              </button>

              <button
                onClick={() => setSelectedSource("AI")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSource === "AI"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                    : "text-slate-400 hover:text-indigo-300"
                }`}
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>AI</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300">
                  {counts.ai}
                </span>
              </button>

              <button
                onClick={() => setSelectedSource("SYSTEM")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSource === "SYSTEM"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-slate-400 hover:text-emerald-300"
                }`}
              >
                <Server className="w-3 h-3 text-emerald-400" />
                <span>SYSTEM</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300">
                  {counts.system}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Search input and Active Filter summary */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en mensajes, códigos o detalles de telemetría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {(selectedLevel !== "ALL" || selectedSource !== "ALL" || search) && (
            <button
              onClick={() => {
                setSelectedLevel("ALL");
                setSelectedSource("ALL");
                setSearch("");
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 text-slate-400" />
              Restablecer Filtros
            </button>
          )}
        </div>
      </div>

      {/* Log Terminal Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs overflow-hidden shadow-2xl">
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>TRANSMISIÓN DE TELEMETRÍA DISPATCHER ACTIVA</span>
          </div>
          <span>Filtro activo: {selectedLevel} / {selectedSource} • Mostrando {filteredLogs.length} de {logs.length}</span>
        </div>

        <div className="p-4 space-y-2 max-h-[520px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic space-y-2">
              <p>No se encontraron eventos con los filtros seleccionados ({selectedLevel} / {selectedSource}).</p>
              <button
                onClick={() => {
                  setSelectedLevel("ALL");
                  setSelectedSource("ALL");
                  setSearch("");
                }}
                className="text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                Limpiar filtros para ver todos los registros
              </button>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="group flex flex-wrap items-start gap-2.5 py-1.5 px-2.5 rounded hover:bg-slate-900/80 transition-colors border-b border-slate-900/50"
              >
                <span className="text-slate-500 text-[11px] whitespace-nowrap pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {getLevelBadge(log.level)}
                {getScopeBadge(log.scope)}
                <span className="text-slate-200 flex-1 break-words font-medium">
                  {log.message}
                </span>
                {log.details && (
                  <pre className="w-full text-[10px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 mt-1 overflow-x-auto">
                    {typeof log.details === "object" ? JSON.stringify(log.details, null, 2) : String(log.details)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
