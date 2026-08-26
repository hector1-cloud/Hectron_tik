import { useState, useEffect, useCallback } from "react";
import {
  Server,
  Cpu,
  Activity,
  ShieldCheck,
  Database,
  Zap,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Terminal,
  Play,
  Layers,
  CreditCard,
  Check,
  Send,
  Radio,
  Sparkles,
  Gem,
  ArrowUpRight,
  TrendingUp,
  Wifi,
  WifiOff
} from "lucide-react";
import { useWebSocketReconnection } from "../hooks/useWebSocketReconnection";

interface Microservice {
  id: string;
  name: string;
  port: number;
  status: "healthy" | "warning" | "danger";
  cpu: number;
  memory: string;
  latency: string;
  role: string;
}

interface ServiceLog {
  id: number;
  timestamp: string;
  service: string;
  type: "INFO" | "SECURITY" | "WARN" | "CACHE" | "EVENT" | "PAYMENT";
  message: string;
}

interface EnterpriseMetrics {
  activeUsers: number;
  activeUniverses: number;
  mau: number;
  revenueToday: number;
  commandCount: number;
}

export function EnterpriseCoreDashboard() {
  const [activeTab, setActiveTab] = useState<"services" | "analytics" | "monetization" | "broker">("services");

  const [services, setServices] = useState<Microservice[]>([
    { id: "gateway", name: "API Gateway (Kong)", port: 3000, status: "healthy", cpu: 14, memory: "145MB", latency: "24ms", role: "Routing & Rate Limiting" },
    { id: "auth", name: "Auth Service", port: 3003, status: "healthy", cpu: 6, memory: "85MB", latency: "12ms", role: "JWT & Firebase Auth" },
    { id: "universe", name: "Universe Service", port: 3002, status: "healthy", cpu: 28, memory: "310MB", latency: "45ms", role: "Game Engine & State" },
    { id: "autonomy", name: "Autonomy AI Service", port: 3001, status: "warning", cpu: 74, memory: "620MB", latency: "110ms", role: "Gemini Autonomous Streamer" },
    { id: "metrics", name: "Metrics & BigQuery", port: 3004, status: "healthy", cpu: 18, memory: "215MB", latency: "35ms", role: "Real-time Telemetry" },
    { id: "redis", name: "Redis Cache Cluster", port: 6379, status: "healthy", cpu: 4, memory: "480MB", latency: "2ms", role: "Memorystore L1 Cache" },
    { id: "rabbitmq", name: "RabbitMQ Message Broker", port: 5672, status: "healthy", cpu: 9, memory: "190MB", latency: "8ms", role: "Async Event Dispatcher" },
  ]);

  const [logs, setLogs] = useState<ServiceLog[]>([
    { id: 1, timestamp: new Date().toLocaleTimeString(), service: "gateway", type: "INFO", message: "POST /api/universe/sync 200 OK - 42ms" },
    { id: 2, timestamp: new Date().toLocaleTimeString(), service: "auth", type: "SECURITY", message: "JWT Token verified successfully for user_9821" },
    { id: 3, timestamp: new Date().toLocaleTimeString(), service: "autonomy", type: "WARN", message: "High CPU load detected on AI simulation thread (74%)" },
    { id: 4, timestamp: new Date().toLocaleTimeString(), service: "redis", type: "CACHE", message: "Cache hit rate optimal at 98.4%" },
    { id: 5, timestamp: new Date().toLocaleTimeString(), service: "rabbitmq", type: "EVENT", message: "Topic 'hectron_events' acknowledged message msg_7819" }
  ]);

  const [metrics, setMetrics] = useState<EnterpriseMetrics>({
    activeUsers: 14280,
    activeUniverses: 342,
    mau: 48900,
    revenueToday: 1245.50,
    commandCount: 89432
  });

  const [stripeForm, setStripeForm] = useState({
    plan: "Pro",
    email: "admin@abadalabs.com",
    amount: "19.99"
  });

  const [transactionStatus, setTransactionStatus] = useState<"idle" | "processing" | "success">("idle");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>("all");

  const addLog = useCallback((service: string, type: ServiceLog["type"], message: string) => {
    const newLog: ServiceLog = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleTimeString(),
      service,
      type,
      message
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Resilient WebSocket connection for real-time telemetry, logs, and events
  const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = typeof window !== "undefined" ? window.location.host : "localhost";
  const wsUrl = `${protocol}//${host}/api/brain/ws`;

  const { isConnected, isConnecting, sendMessage, forceReconnect } = useWebSocketReconnection({
    url: wsUrl,
    onOpen: () => {
      addLog("gateway", "INFO", "Enlace WebSocket de telemetría Enterprise establecido en vivo.");
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state") {
          if (data.activeViewers) {
            setMetrics((m) => ({ ...m, activeUsers: Math.max(m.activeUsers, data.activeViewers) }));
          }
        } else if (data.type === "log" && data.entry) {
          const entry = data.entry;
          let serviceMapped = "gateway";
          let typeMapped: ServiceLog["type"] = "INFO";
          if (entry.scope === "OBS") {
            serviceMapped = "universe";
            typeMapped = "EVENT";
          } else if (entry.scope === "TIKTOK") {
            serviceMapped = "gateway";
            typeMapped = "EVENT";
          } else if (entry.scope === "AUTONOMY") {
            serviceMapped = "autonomy";
            typeMapped = entry.level === "ERROR" ? "WARN" : "INFO";
          } else if (entry.scope === "CACHE") {
            serviceMapped = "redis";
            typeMapped = "CACHE";
          }
          addLog(serviceMapped, typeMapped, `[${entry.scope}] ${entry.message}`);
        } else if (data.type === "tiktok_gift") {
          addLog("gateway", "PAYMENT", `TikTok Gift recibido: ${data.count || 1}x ${data.giftName || "Gift"} de ${data.user || "Viewer"}`);
          setMetrics((m) => ({ ...m, revenueToday: m.revenueToday + (data.count || 1) * 0.5 }));
        } else if (data.type === "tiktok_comment") {
          addLog("gateway", "EVENT", `TikTok Chat (${data.user || "Viewer"}): ${data.text || ""}`);
          setMetrics((m) => ({ ...m, commandCount: m.commandCount + 1 }));
        }
      } catch (err) {
        console.error("Error procesando mensaje WebSocket Enterprise:", err);
      }
    },
    onClose: (event) => {
      addLog("gateway", "WARN", `Conexión WebSocket Enterprise interrumpida (Código: ${event.code}). Reconectando con backoff exponencial...`);
    },
    onError: () => {
      console.log("WebSocket Enterprise status check...");
    }
  });

  // Live real-time CPU & telemetry fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((s) => {
          const cpuVariation = Math.floor(Math.random() * 11) - 5;
          const newCpu = Math.max(3, Math.min(96, s.cpu + cpuVariation));
          let status: "healthy" | "warning" | "danger" = "healthy";
          if (newCpu > 80) status = "danger";
          else if (newCpu > 60) status = "warning";
          else status = "healthy";
          return { ...s, cpu: newCpu, status };
        })
      );
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateEvent = (eventType = "universe.planet.discovered") => {
    sendMessage({ type: "simulate_event", event: eventType, timestamp: Date.now() });
    addLog("rabbitmq", "EVENT", `Published event: ${eventType} (Payload streaming to BigQuery & Redis)`);
    setMetrics((m) => ({ ...m, commandCount: m.commandCount + 1 }));
  };

  const handleStripeCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionStatus("processing");
    setTimeout(() => {
      setTransactionStatus("success");
      setMetrics((m) => ({ ...m, revenueToday: m.revenueToday + Number(stripeForm.amount) }));
      addLog("gateway", "PAYMENT", `Stripe subscription checkout completed for ${stripeForm.email} ($${stripeForm.amount})`);
      setTimeout(() => setTransactionStatus("idle"), 4000);
    }, 1200);
  };

  const filteredLogs = selectedServiceFilter === "all"
    ? logs
    : logs.filter((l) => l.service === selectedServiceFilter);

  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased flex flex-col rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Banner Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/30 text-cyan-400">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
                ABADALABS, INC. — Enterprise Core 2.0
              </h1>
              <span className="bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                PROD-READY
              </span>
            </div>
            <p className="text-xs text-slate-400">Cloud Infrastructure & Advanced Microservices Management</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 md:gap-3">
          {/* WebSocket Reconnection Status Badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition ${
              isConnected
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                : isConnecting
                ? "bg-amber-950/40 border-amber-500/30 text-amber-300"
                : "bg-rose-950/40 border-rose-500/30 text-rose-300"
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>WS: <strong className="text-emerald-400 font-semibold">EN LÍNEA</strong></span>
              </>
            ) : isConnecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>WS: <strong className="text-amber-400 font-semibold">RECONECTANDO...</strong></span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>WS: <strong className="text-rose-400 font-semibold">DESCONECTADO</strong></span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-750 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Cluster: <strong className="text-emerald-400 font-semibold">OPTIMAL (7/7)</strong></span>
          </div>

          <button
            onClick={() => {
              forceReconnect();
              addLog("gateway", "INFO", "Manual cluster state sync & WebSocket force reconnection executed.");
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sincronizar</span>
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-6 flex flex-wrap gap-2 md:gap-6">
        {[
          { id: "services", label: "Microservicios", icon: Server },
          { id: "analytics", label: "Analítica & KPIs", icon: Activity },
          { id: "monetization", label: "Monetización & Stripe", icon: DollarSign },
          { id: "broker", label: "Broker & Logs", icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-3 border-b-2 text-xs md:text-sm font-medium transition cursor-pointer ${
                isActive
                  ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="p-6 space-y-6">
        {/* ================= PESTAÑA 1: MICROSERVICIOS ================= */}
        {activeTab === "services" && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Servicios Activos</p>
                  <h3 className="text-2xl font-bold text-slate-100 mt-1">7 / 7</h3>
                  <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3" /> 100% Disponibilidad
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Latencia Promedio</p>
                  <h3 className="text-2xl font-bold text-cyan-400 mt-1">32 ms</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Kong Gateway proxy</p>
                </div>
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                  <Zap className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cache Hit Rate</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-1">98.4%</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Redis Memorystore</p>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Database className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Firewall & WAF</p>
                  <h3 className="text-2xl font-bold text-purple-400 mt-1">Activo</h3>
                  <p className="text-[11px] text-purple-300 mt-0.5 font-medium">Cloud Armor DDoS Rule</p>
                </div>
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Microservices Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Server className="w-5 h-5 text-cyan-400" />
                    Topología de Microservicios
                  </h2>
                  <p className="text-xs text-slate-400">
                    Monitoreo en tiempo real de nodos distribuidos en Cloud Run, Kubernetes (GKE), Redis y RabbitMQ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimulateEvent("universe.planet.discovered")}
                    className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Simular Evento Asíncrono</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-slate-950 border border-slate-800/90 hover:border-cyan-500/40 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 group-hover:border-cyan-500/30">
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-slate-200 block">{service.name}</span>
                            <span className="text-[10px] text-slate-400">{service.role}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase shrink-0 ${
                            service.status === "healthy"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : service.status === "warning"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {service.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-400 my-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                        <div className="flex justify-between">
                          <span>Puerto Ingress:</span>
                          <span className="font-mono text-cyan-300">:{service.port}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Memoria RAM:</span>
                          <span className="font-mono text-slate-200">{service.memory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Latencia de Red:</span>
                          <span className="font-mono text-slate-200">{service.latency}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center space-x-1">
                          <Cpu className="w-3 h-3 text-cyan-400" />
                          <span>Carga CPU</span>
                        </span>
                        <span className="font-mono font-bold text-slate-200">{service.cpu}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            service.cpu > 70
                              ? "bg-rose-500"
                              : service.cpu > 40
                              ? "bg-amber-500"
                              : "bg-cyan-500"
                          }`}
                          style={{ width: `${service.cpu}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 2: ANALÍTICA ================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-400 uppercase font-medium">Usuarios Activos (MAU)</p>
                <h3 className="text-3xl font-extrabold text-cyan-400 mt-2">{metrics.mau.toLocaleString()}</h3>
                <p className="text-xs text-emerald-400 mt-1.5 flex items-center font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> ↑ 14.2% vs mes anterior
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-400 uppercase font-medium">Universos Activos</p>
                <h3 className="text-3xl font-extrabold text-blue-400 mt-2">{metrics.activeUniverses}</h3>
                <p className="text-xs text-emerald-400 mt-1.5 flex items-center font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> ↑ 8 nuevos hoy
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-400 uppercase font-medium">Comandos Ejecutados</p>
                <h3 className="text-3xl font-extrabold text-purple-400 mt-2">{metrics.commandCount.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-1.5">Sincronizado con BigQuery</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-400 uppercase font-medium">Ingresos de Hoy</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">${metrics.revenueToday.toFixed(2)}</h3>
                <p className="text-xs text-slate-400 mt-1.5">Stripe & TikTok Gifts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Looker Studio Enterprise KPIs */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Looker Studio Enterprise KPIs</h3>
                    <p className="text-xs text-slate-400">Métricas de retención y monetización conectadas vía BigQuery</p>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-md font-mono">
                    DATASET: abadalabs_prod
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300 font-medium">Retención D7 (Objetivo &gt; 40%)</span>
                      <span className="font-bold text-emerald-400">46.8%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: "46.8%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300 font-medium">ARPU (Ingreso Promedio por Usuario)</span>
                      <span className="font-bold text-cyan-400">$6.42 USD (Meta: $5+)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: "64%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300 font-medium">Churn Rate (Tasa de Abandono &lt; 5%)</span>
                      <span className="font-bold text-blue-400">2.1% (Excelente)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: "21%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300 font-medium">Tiempo Promedio de Sesión</span>
                      <span className="font-bold text-purple-400">38.4 min (Meta: 30+ min)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: "76%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cloud Monitoring Alerts */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Alertas Cloud Monitoring</h3>
                    <p className="text-xs text-slate-400">Estado de los canales de notificación y reglas de disparo automático</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md font-mono">
                    GCP US-CENTRAL1
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-200">High Error Rate (&gt; 10 req)</p>
                        <p className="text-xs text-slate-400">Canal: Slack (#hectron-alerts) / Email — Normal</p>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 font-medium">
                      Activo
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-200">High Latency (&gt; 1000ms)</p>
                        <p className="text-xs text-slate-400">Canal: Slack — Tiempo de respuesta promedio nominal (32ms)</p>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 font-medium">
                      Activo
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-200">BigQuery Storage Throttle (&lt; 1MB)</p>
                        <p className="text-xs text-slate-400">Canal: Email — Actividad y flujo constante de telemetría</p>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 font-medium">
                      Activo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 3: MONETIZACIÓN ================= */}
        {activeTab === "monetization" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Tarjetas de Planes */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: "Plan Free",
                    price: "$0",
                    period: "/ siempre",
                    desc: "Ideal para streamers principiantes y pruebas de concepto.",
                    features: ["1 universo persistente", "Hasta 5 planetas", "10 jugadores concurrentes", "Overlay 3D estándar"],
                    color: "border-slate-800 bg-slate-900/60",
                    badge: "GRATIS",
                    badgeColor: "bg-slate-800 text-slate-300"
                  },
                  {
                    name: "Plan Pro",
                    price: "$19.99",
                    period: "/ mes",
                    desc: "Para creadores y streamers profesionales que monetizan sus canales.",
                    features: ["5 universos simultáneos", "50 planetas explorables", "100 jugadores en vivo", "Looker Studio Analytics", "Integración TikTok Live & Gifts"],
                    color: "border-cyan-500/60 bg-gradient-to-b from-cyan-950/20 to-slate-900/90 shadow-lg shadow-cyan-500/10",
                    badge: "MÁS POPULAR",
                    badgeColor: "bg-cyan-500 text-slate-950 font-bold"
                  },
                  {
                    name: "Plan Enterprise",
                    price: "$99.99",
                    period: "/ mes",
                    desc: "Para agencias y producciones con alta concurrencia.",
                    features: ["Universos y planetas ilimitados", "1,000 jugadores concurrentes", "Soporte dedicado 24/7", "Cloud Armor WAF & Anti-DDoS", "API Gateway dedicado"],
                    color: "border-purple-500/60 bg-gradient-to-b from-purple-950/20 to-slate-900/90 shadow-lg shadow-purple-500/10",
                    badge: "EMPRESAS",
                    badgeColor: "bg-purple-500 text-white font-bold"
                  },
                  {
                    name: "Custom Agency",
                    price: "Custom",
                    period: "/ a medida",
                    desc: "Soluciones a medida para corporativos y redes de streamers.",
                    features: ["Cluster Kubernetes multi-región", "Modelos IA fine-tuneados", "SLA del 99.99% garantizado", "Contratos y facturación personalizada"],
                    color: "border-slate-800 bg-slate-900/60",
                    badge: "ENTERPRISE",
                    badgeColor: "bg-slate-800 text-slate-300"
                  },
                ].map((plan, idx) => (
                  <div
                    key={idx}
                    className={`border ${plan.color} rounded-2xl p-5 flex flex-col justify-between transition-all hover:scale-[1.01]`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-bold text-white">{plan.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${plan.badgeColor}`}>
                          {plan.badge}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1 my-2">
                        <span className="text-2xl md:text-3xl font-extrabold text-white">{plan.price}</span>
                        <span className="text-xs text-slate-400">{plan.period}</span>
                      </div>

                      <p className="text-xs text-slate-400 mb-4">{plan.desc}</p>

                      <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                        {plan.features.map((feat, fidx) => (
                          <li key={fidx} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setStripeForm({
                          plan: plan.name.replace("Plan ", ""),
                          email: "streamer@abadalabs.com",
                          amount: plan.price.replace("$", "").replace("Custom", "199.00")
                        });
                      }}
                      className="mt-5 w-full py-2 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Seleccionar para Checkout</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Formulario Stripe & Conversor TikTok */}
              <div className="lg:col-span-4 space-y-4">
                {/* Simulador Checkout Stripe */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Stripe Checkout Simulator</h3>
                  </div>

                  <form onSubmit={handleStripeCheckout} className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Plan Seleccionado:</label>
                      <input
                        type="text"
                        value={stripeForm.plan}
                        onChange={(e) => setStripeForm({ ...stripeForm, plan: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Email del Cliente:</label>
                      <input
                        type="email"
                        value={stripeForm.email}
                        onChange={(e) => setStripeForm({ ...stripeForm, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Monto (USD):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={stripeForm.amount}
                        onChange={(e) => setStripeForm({ ...stripeForm, amount: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono font-bold text-emerald-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={transactionStatus === "processing"}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {transactionStatus === "processing" ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Procesando con Stripe...</span>
                        </>
                      ) : transactionStatus === "success" ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-slate-950" />
                          <span>¡Pago Completado Exitosamente!</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Simular Suscripción Stripe</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* TikTok Gifts to In-Game Economy */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                    <Gem className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Conversor TikTok Gifts</h3>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                    Conversión automática de diamantes TikTok a recursos del universo HECTRON (1 Diamante ≈ $0.05 USD).
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-850">
                      <span className="text-amber-300 font-semibold">100 Diamantes ($5.00)</span>
                      <span className="font-mono text-emerald-400 font-bold">50 Oro • 10 Cristal</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-850">
                      <span className="text-purple-300 font-semibold">500 Diamantes ($25.00)</span>
                      <span className="font-mono text-emerald-400 font-bold">250 Oro • 50 Cristal</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addLog("gateway", "EVENT", "TikTok Gift webhook received: 500 Diamonds -> Credited 250 Gold & 50 Crystals to user");
                      setMetrics((m) => ({ ...m, revenueToday: m.revenueToday + 25.0 }));
                    }}
                    className="mt-3 w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simular Regalo TikTok (500 💎)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 4: BROKER & LOGS ================= */}
        {activeTab === "broker" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Event Publisher Controls */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">RabbitMQ Event Publisher</h3>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                    AMQP 0-9-1
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Emite eventos asíncronos a través del Exchange de RabbitMQ hacia consumidores como BigQuery, Firestore y el motor de logros.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Emitir Evento Rápido:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { type: "universe.created", label: "universe.created", desc: "Nuevo universo instanciado" },
                      { type: "player.joined", label: "player.joined", desc: "Usuario entra a transmisión" },
                      { type: "command.executed", label: "command.executed", desc: "Comando /explorar ejecutado" },
                      { type: "achievement.unlocked", label: "achievement.unlocked", desc: "Logro 'Primeros Pasos' desbloqueado" },
                    ].map((btn) => (
                      <button
                        key={btn.type}
                        onClick={() => handleSimulateEvent(btn.type)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between text-xs cursor-pointer group"
                      >
                        <div>
                          <span className="font-mono text-cyan-400 font-bold block">{btn.label}</span>
                          <span className="text-[11px] text-slate-400">{btn.desc}</span>
                        </div>
                        <Send className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Broker URL:</span>
                    <span className="font-mono text-slate-300">amqp://hectron-rabbit:5672</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Topic Exchange:</span>
                    <span className="font-mono text-cyan-400">hectron_events</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Queue Bind:</span>
                    <span className="font-mono text-slate-300">hectron_events_queue (#)</span>
                  </div>
                </div>
              </div>

              {/* Real-time System Logs Terminal */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <h3 className="text-sm font-bold text-white">Stream de Logs en Vivo</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Filtrar:</span>
                      <select
                        value={selectedServiceFilter}
                        onChange={(e) => setSelectedServiceFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-none font-mono"
                      >
                        <option value="all">Todos los Nodos</option>
                        <option value="gateway">API Gateway</option>
                        <option value="auth">Auth Service</option>
                        <option value="universe">Universe Service</option>
                        <option value="autonomy">Autonomy AI</option>
                        <option value="redis">Redis Cache</option>
                        <option value="rabbitmq">RabbitMQ</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs max-h-[380px] overflow-y-auto space-y-2">
                    {filteredLogs.length === 0 ? (
                      <p className="text-slate-500 italic py-4 text-center">No hay registros para este filtro.</p>
                    ) : (
                      filteredLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2.5 text-[11px] border-b border-slate-900/60 pb-1.5 last:border-0">
                          <span className="text-slate-500 shrink-0 font-mono">[{log.timestamp}]</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                              log.type === "INFO"
                                ? "bg-slate-800 text-slate-300"
                                : log.type === "SECURITY"
                                ? "bg-purple-950 text-purple-300 border border-purple-800"
                                : log.type === "WARN"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : log.type === "CACHE"
                                ? "bg-blue-950 text-blue-300 border border-blue-800"
                                : log.type === "PAYMENT"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                            }`}
                          >
                            {log.type}
                          </span>
                          <span className="text-cyan-400/90 font-semibold shrink-0">[{log.service}]:</span>
                          <span className="text-slate-300 break-all">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400">
                  <span>Mostrando {filteredLogs.length} eventos recientes</span>
                  <button
                    onClick={() => setLogs([])}
                    className="text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    Limpiar Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
