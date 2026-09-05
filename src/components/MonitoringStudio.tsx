import React, { useState, useEffect } from "react";
import { Activity, Bell, AlertTriangle, CheckCircle, ShieldAlert, Cpu, Server, Clock } from "lucide-react";

interface MonitoringStats {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuLoad: number[];
  totalErrors: number;
  criticalAlerts: number;
  lastAlertSent?: string;
  status: "healthy" | "degraded" | "critical";
}

export function MonitoringStudio() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/monitoring/stats");
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
        setRecentErrors(data.recentErrors);
        // Only set initial if we don't have focus, but for simplicity:
        if (!isUpdating) {
          setWebhookUrl(data.webhookUrl);
        }
      }
    } catch (err) {
      console.error("Failed to fetch monitoring stats:", err);
    }
  };

  const saveWebhook = async () => {
    setIsUpdating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/monitoring/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl })
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "Webhook configurado exitosamente." });
      } else {
        setMessage({ type: "error", text: data.error || "Error al configurar webhook." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Error de conexión al guardar webhook." });
    }
    setIsUpdating(false);
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Monitor de Alertas y Sistema</h2>
          <p className="text-sm text-slate-400">Supervisión en tiempo real e integración con Webhooks / Sentry.</p>
        </div>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Estado del Sistema
            </span>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stats.status === "healthy" ? "bg-emerald-400" : stats.status === "degraded" ? "bg-amber-400" : "bg-rose-500"} shadow-lg`} />
              <span className={`text-lg font-bold capitalize ${stats.status === "healthy" ? "text-emerald-400" : stats.status === "degraded" ? "text-amber-400" : "text-rose-500"}`}>
                {stats.status}
              </span>
            </div>
          </div>
          
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Tiempo en Línea (Uptime)
            </span>
            <span className="text-lg font-bold text-white font-mono">{formatUptime(stats.uptime)}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Errores Registrados
            </span>
            <span className="text-lg font-bold text-white font-mono">{stats.totalErrors}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-rose-400" /> Alertas Críticas
            </span>
            <span className="text-lg font-bold text-white font-mono">{stats.criticalAlerts}</span>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 animate-pulse font-mono text-sm">
          Cargando métricas de monitoreo...
        </div>
      )}

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Configuración de Alertas (Webhook / Sentry / Slack)
        </h3>
        <p className="text-xs text-slate-400">
          Define una URL de Webhook donde se enviarán automáticamente notificaciones JSON cada vez que el sistema detecte un error no controlado o reciba una alerta crítica.
        </p>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/... o URL de webhook personalizada"
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 outline-none transition"
          />
          <button
            onClick={saveWebhook}
            disabled={isUpdating}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
          >
            {isUpdating ? "Guardando..." : "Guardar Webhook"}
          </button>
        </div>
        {message && (
          <div className={`text-xs px-3 py-2 rounded border ${message.type === 'success' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' : 'bg-rose-950/50 border-rose-900 text-rose-400'}`}>
            {message.type === 'success' ? <CheckCircle className="inline w-3 h-3 mr-1" /> : <AlertTriangle className="inline w-3 h-3 mr-1" />}
            {message.text}
          </div>
        )}
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <h3 className="text-xs font-bold text-slate-300">Últimos Eventos Críticos y Errores</h3>
          <span className="text-[10px] font-mono text-slate-500">{recentErrors.length} recientes</span>
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {recentErrors.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 italic">No se han registrado errores recientemente.</div>
          ) : (
            recentErrors.map((err, i) => (
              <div key={i} className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800/60 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${err.level === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {err.level}
                    </span>
                    <span className="text-xs font-mono text-slate-300">{err.source}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(err.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono break-words">{err.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}