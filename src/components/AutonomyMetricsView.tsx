import { useState, useEffect } from "react";
import {
  Brain,
  Zap,
  Activity,
  Database,
  Clock,
  Sparkles,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Cpu,
  ShieldAlert,
  Flame,
  Bot,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

export function AutonomyMetricsView() {
  const [autonomyStatus, setAutonomyStatus] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"autonomy" | "bigquery" | "psyche">("autonomy");

  const fetchAutonomyAndMetrics = async () => {
    setIsLoading(true);
    try {
      const [autoRes, dashRes] = await Promise.all([
        fetch("/autonomy/status"),
        fetch("/api/metrics/dashboard"),
      ]);

      if (autoRes.ok) {
        const autoJson = await autoRes.json();
        setAutonomyStatus(autoJson);
      }
      if (dashRes.ok) {
        const dashJson = await dashRes.json();
        setDashboardData(dashJson);
      }
    } catch (err) {
      console.error("Failed to fetch autonomy metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAutonomyAndMetrics();
    const interval = setInterval(fetchAutonomyAndMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutonomy = async () => {
    if (!autonomyStatus) return;
    try {
      const nextState = !autonomyStatus.enabled;
      const res = await fetch("/autonomy/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });
      if (res.ok) {
        fetchAutonomyAndMetrics();
      }
    } catch (err) {
      console.error("Failed to toggle autonomy:", err);
    }
  };

  const handleTriggerDecision = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch("/autonomy/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerSource: "manual_dashboard_button" }),
      });
      if (res.ok) {
        await fetchAutonomyAndMetrics();
      }
    } catch (err) {
      console.error("Failed to trigger autonomous decision:", err);
    } finally {
      setIsTriggering(false);
    }
  };

  const psyche = autonomyStatus?.psycheState || dashboardData?.summary?.psycheMetrics || {
    machiavellianism: 3.5,
    stoicism: 7.2,
    creative_drive: 8.8,
    dominant_trait: "creative_drive",
  };

  const summary = dashboardData?.summary || {
    chatMetrics: { totalMessages: 0, totalTokensUsed: 0, mostCommonEmotion: "HAPPY", activeUsersCount: 0 },
    autonomyMetrics: { totalDecisions: 0, successfulDecisions: 0, autonomySuccessRate: 100, avgConfidence: 0.92 },
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
                Cerebro Autónomo v3.2 & BigQuery Analytics
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                GCP Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistema de decisiones de streaming sin intervención humana y analítica persistente en Google BigQuery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAutonomyAndMetrics}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-1.5"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refrescar</span>
          </button>

          <button
            onClick={handleTriggerDecision}
            disabled={isTriggering}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isTriggering ? "animate-bounce" : ""}`} />
            <span>{isTriggering ? "Ejecutando..." : "Ejecutar Decisión Autónoma"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveSubTab("autonomy")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === "autonomy"
              ? "border-cyan-400 text-cyan-300 bg-slate-900/40 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Modo Autónomo</span>
          {autonomyStatus?.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("bigquery")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === "bigquery"
              ? "border-cyan-400 text-cyan-300 bg-slate-900/40 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>BigQuery Analytics</span>
        </button>

        <button
          onClick={() => setActiveSubTab("psyche")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === "psyche"
              ? "border-cyan-400 text-cyan-300 bg-slate-900/40 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Estado Psíquico Miku (Ω)</span>
        </button>
      </div>

      {/* SUBTAB 1: MODO AUTÓNOMO CONTROL PANEL */}
      {activeSubTab === "autonomy" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Autonomy Status & Toggle Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Estado de Autonomía
              </h3>
              <button
                onClick={handleToggleAutonomy}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  autonomyStatus?.enabled
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                }`}
              >
                {autonomyStatus?.enabled ? "ACTIVO" : "PAUSADO"}
              </button>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Inactividad para Disparo:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {autonomyStatus?.idleTimeoutMs ? autonomyStatus.idleTimeoutMs / 1000 : 120}s (2 min)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Tiempo Inactivo Transcurrido:</span>
                <span className="font-mono text-amber-300 font-bold">
                  {autonomyStatus?.secondsSinceLastInteraction || 0}s
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Siguiente Decisión Automática en:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {autonomyStatus?.secondsUntilNextAutonomousDecision || 0}s
                </span>
              </div>
            </div>

            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs text-cyan-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" />
                Lógica Autónomica con Gemini AI
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Cuando transcurren 2 minutos sin mensajes en el chat de TikTok LIVE, Miku toma decisiones de forma independiente: cambia de escena en OBS, gesticula sus emociones y conversa espontáneamente con la audiencia.
              </p>
            </div>
          </div>

          {/* Last Autonomous Decision Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Última Decisión Autónoma Registrada
            </h3>

            {autonomyStatus?.lastDecisionValue ? (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono font-bold uppercase">
                      {autonomyStatus.lastDecisionType || "speak"}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {autonomyStatus.lastAutonomousDecisionTime
                        ? new Date(autonomyStatus.lastAutonomousDecisionTime).toLocaleTimeString()
                        : "Hace un momento"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confianza Gemini: 94%
                  </span>
                </div>

                <p className="text-sm italic font-serif text-cyan-100 bg-slate-900/90 border border-cyan-500/20 p-3 rounded-lg">
                  "{autonomyStatus.lastDecisionValue}"
                </p>
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                Aún no se han ejecutado decisiones autónomas en este ciclo. El temporizador activará una respuesta al alcanzar los 2 minutos de inactividad.
              </div>
            )}

            {/* Autonomous Decision Feed */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Historial Reciente de Decisiones Autónomas</h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {dashboardData?.recentDecisions?.map((dec: any) => (
                  <div
                    key={dec.id}
                    className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-mono text-[11px] text-cyan-300 shrink-0">{dec.decision_type}</span>
                      <span className="text-slate-300 truncate">{dec.decision_value}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(dec.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: BIGQUERY ANALYTICS */}
      {activeSubTab === "bigquery" && (
        <div className="space-y-6">
          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Mensajes Totales</span>
                <MessageSquare className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-cyan-300 font-mono">
                {summary.chatMetrics.totalMessages}
              </p>
              <p className="text-[10px] text-slate-500">Registrados en BigQuery</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tasa de Autonomía</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400 font-mono">
                {summary.autonomyMetrics.autonomySuccessRate}%
              </p>
              <p className="text-[10px] text-slate-500">Decisiones exitosas</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Emoción Dominante</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-300 font-mono uppercase">
                {summary.chatMetrics.mostCommonEmotion}
              </p>
              <p className="text-[10px] text-slate-500">Frecuencia en Chat</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tokens consumidos</span>
                <BarChart3 className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-indigo-300 font-mono">
                {summary.chatMetrics.totalTokensUsed}
              </p>
              <p className="text-[10px] text-slate-500">Gemini AI API</p>
            </div>
          </div>

          {/* BigQuery Connection Status & Recent Chat Logs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                Google BigQuery Connection
              </h3>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Estado de Conexión:</span>
                  <span
                    className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                      dashboardData?.gcpConnected
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                        : "bg-cyan-950 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    {dashboardData?.gcpConnected ? "GCP BIGQUERY LIVE" : "ENGINE LOCAL PERSISTENTE"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Dataset GCP:</span>
                  <span className="font-mono text-slate-200">{dashboardData?.dataset || "hectron_autonomo"}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Tablas Partitioned:</span>
                  <span className="font-mono text-cyan-300 font-bold">4 Tablas</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <p className="font-semibold text-slate-300">Tablas registradas en BigQuery:</p>
                <ul className="list-disc list-inside space-y-0.5 font-mono text-[10px] text-cyan-300">
                  <li>hectron_autonomo.chat_logs</li>
                  <li>hectron_autonomo.psyche_state</li>
                  <li>hectron_autonomo.autonomous_decisions</li>
                  <li>hectron_autonomo.user_metrics</li>
                </ul>
              </div>
            </div>

            {/* Chat Logs Table */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3 md:col-span-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Registros de Chat & Sentimiento
              </h3>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {dashboardData?.recentChats?.map((chat: any) => (
                  <div
                    key={chat.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">{chat.user_id}</span>
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-800 text-slate-300 uppercase">
                          {chat.emotion}
                        </span>
                        <span className="text-[10px] text-slate-500">{chat.scene}</span>
                      </div>
                      <p className="text-slate-200">{chat.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(chat.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ESTADO PSÍQUICO MIKU (Ω) */}
      {activeSubTab === "psyche" && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                Parámetros de la Psique de Miku (Matriz Ω)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ajuste dinámico de personalidad impulsado por las interacciones del público y la autonomía de Gemini AI.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold uppercase">
              Rasgo Dominante: {psyche.dominant_trait}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Machiavellianism Progress */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Maquiavelismo (Estrategia)</span>
                <span className="font-mono text-cyan-300 font-bold">{psyche.machiavellianism}/10</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${(psyche.machiavellianism / 10) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Determina la astucia y cálculo en la solicitud de regalos de TikTok LIVE.
              </p>
            </div>

            {/* Stoicism Progress */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Estoicismo (Serenidad)</span>
                <span className="font-mono text-emerald-400 font-bold">{psyche.stoicism}/10</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${(psyche.stoicism / 10) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Nivel de templanza y calma ante comentarios provocadores o spam en el chat.
              </p>
            </div>

            {/* Creative Drive Progress */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Impulso Creativo</span>
                <span className="font-mono text-indigo-400 font-bold">{psyche.creative_drive}/10</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${(psyche.creative_drive / 10) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Inclinación a la improvisación musical, baile y generación de diálogos ingeniosos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
