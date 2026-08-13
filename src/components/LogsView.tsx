import { useState, useContext } from "react";
import { BrainContext } from "../BrainContext";
import { LogLevel, LogScope } from "../types";
import { Terminal, Shield, RefreshCw, Trash2, Copy, Filter, AlertTriangle, CheckCircle2, Info, Bug } from "lucide-react";

export function LogsView() {
  const { logs, clearLogs, addLog } = useContext(BrainContext);
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedScope, setSelectedScope] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const filteredLogs = logs.filter((log) => {
    if (selectedLevel !== "ALL" && log.level !== selectedLevel) return false;
    if (selectedScope !== "ALL" && log.scope !== selectedScope) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
            <AlertTriangle className="w-3 h-3" /> ERROR
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
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${colors[scope] || 'bg-slate-800 text-slate-300'}`}>
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
              System Telemetry & Event Log
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                {filteredLogs.length} entries
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Live observability stream with log rotation across Server, Local Agent, TikTok, and 3D Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addLog("INFO", "FRONTEND", "Manual test log emitted from developer console")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Test Event
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Logs"}
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 text-xs font-medium border border-rose-800 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Buffer
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          Filters:
        </div>

        {/* Level Selector */}
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>

        {/* Scope Selector */}
        <select
          value={selectedScope}
          onChange={(e) => setSelectedScope(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Scopes</option>
          <option value="SERVER">SERVER</option>
          <option value="FRONTEND">FRONTEND</option>
          <option value="AGENT">AGENT</option>
          <option value="TIKTOK">TIKTOK</option>
          <option value="3D">3D</option>
        </select>

        {/* Search input */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search log messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Log Terminal Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs overflow-hidden shadow-2xl">
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LOG STREAM DISPATCHER ACTIVE</span>
          </div>
          <span>Max Buffer: 500 entries (Pruning oldest)</span>
        </div>

        <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic">
              No log entries match the current filter criteria.
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
