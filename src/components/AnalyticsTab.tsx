import React, { useState, useEffect, useMemo, useContext } from "react";
import { BrainContext } from "../BrainContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Activity,
  Users,
  MessageSquare,
  Gift,
  TrendingUp,
  Flame,
  Radio,
  Eye,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Sparkles,
  Zap,
  Clock,
  Heart,
  BarChart2,
  Layers,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface ViewerTimelinePoint {
  time: string;
  viewers: number;
  chatVelocity: number;
  giftValue: number;
  sentiment: number;
}

const INITIAL_TIMELINE: ViewerTimelinePoint[] = [
  { time: "01:30", viewers: 420, chatVelocity: 18, giftValue: 240, sentiment: 78 },
  { time: "01:35", viewers: 580, chatVelocity: 34, giftValue: 450, sentiment: 82 },
  { time: "01:40", viewers: 740, chatVelocity: 48, giftValue: 620, sentiment: 88 },
  { time: "01:45", viewers: 910, chatVelocity: 72, giftValue: 1100, sentiment: 94 },
  { time: "01:50", viewers: 1250, chatVelocity: 95, giftValue: 1800, sentiment: 96 },
  { time: "01:55", viewers: 1420, chatVelocity: 110, giftValue: 2400, sentiment: 98 },
  { time: "02:00", viewers: 1380, chatVelocity: 98, giftValue: 2100, sentiment: 92 },
];

const GIFT_DISTRIBUTION = [
  { name: "Rosa TikTok", value: 45, color: "#f43f5e" },
  { name: "Corona Cyber", value: 25, color: "#fbbf24" },
  { name: "Galaxia 3D", value: 18, color: "#8b5cf6" },
  { name: "León Imperial", value: 12, color: "#06b6d4" },
];

export function AnalyticsTab() {
  const { isAutonomous, tiktokConnected } = useContext(BrainContext);
  const [timelineData, setTimelineData] = useState<ViewerTimelinePoint[]>(INITIAL_TIMELINE);
  const [isLiveStreamingData, setIsLiveStreamingData] = useState<boolean>(true);
  const [isOverlayModeOpen, setIsOverlayModeOpen] = useState<boolean>(false);
  const [selectedMetricView, setSelectedMetricView] = useState<"all" | "viewers" | "engagement" | "gifts">("all");
  const [currentViewers, setCurrentViewers] = useState<number>(1420);
  const [currentChatRate, setCurrentChatRate] = useState<number>(104);
  const [totalLikes, setTotalLikes] = useState<number>(38450);

  // Live data tick simulation
  useEffect(() => {
    if (!isLiveStreamingData) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      const deltaViewers = Math.floor(Math.random() * 41) - 15;
      const nextViewers = Math.max(200, currentViewers + deltaViewers);
      const nextChat = Math.max(10, Math.floor(nextViewers * 0.08 + (Math.random() * 20 - 10)));
      const nextGift = Math.floor(Math.random() * 600) + 100;
      const nextSentiment = Math.floor(Math.random() * 15) + 85;

      setCurrentViewers(nextViewers);
      setCurrentChatRate(nextChat);
      setTotalLikes((prev) => prev + Math.floor(Math.random() * 80) + 20);

      setTimelineData((prev) => {
        const nextList = [
          ...prev.slice(prev.length > 18 ? 1 : 0),
          {
            time: timeStr,
            viewers: nextViewers,
            chatVelocity: nextChat,
            giftValue: nextGift,
            sentiment: nextSentiment,
          },
        ];
        return nextList;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveStreamingData, currentViewers]);

  // Derived calculations
  const peakViewers = useMemo(() => Math.max(...timelineData.map((d) => d.viewers)), [timelineData]);
  const avgViewers = useMemo(() => Math.round(timelineData.reduce((acc, d) => acc + d.viewers, 0) / (timelineData.length || 1)), [timelineData]);
  const totalGiftsAccumulated = useMemo(() => timelineData.reduce((acc, d) => acc + d.giftValue, 0), [timelineData]);

  const handleExportCSV = () => {
    const headers = "Timestamp,Viewers,ChatVelocity,GiftCoins,SentimentScore\n";
    const rows = timelineData.map((d) => `${d.time},${d.viewers},${d.chatVelocity},${d.giftValue},${d.sentiment}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hectron-stream-analytics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="analytics-tab-root" className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Overlay Mode Toggle */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0B1528] to-slate-900 border border-cyan-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Analítica en Tiempo Real & Recharts Overlay</span>
                  <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                    <Radio className="w-3 h-3 text-rose-400" /> EN VIVO
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Telemetría continua de espectadores, velocidad de chat, donaciones y análisis de sentimiento con motor Recharts.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsLiveStreamingData(!isLiveStreamingData)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isLiveStreamingData
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveStreamingData ? "animate-spin" : ""}`} />
              <span>{isLiveStreamingData ? "Sincronizando (2.5s)" : "Pausado"}</span>
            </button>

            <button
              onClick={() => setIsOverlayModeOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer active:scale-95"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Abrir Overlay Flotante OBS</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Live Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Espectadores en Vivo</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono flex items-center gap-2">
              <span>{currentViewers.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded">
                +14%
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">Pico: {peakViewers} • Prom: {avgViewers}</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Velocidad del Chat</span>
              <MessageSquare className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300 font-mono">
              {currentChatRate} <span className="text-xs font-sans text-slate-400">msgs/min</span>
            </div>
            <span className="text-[10px] text-emerald-400 block">94% Sentimiento Positivo</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Likes Acumulados</span>
              <Heart className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl font-black text-pink-300 font-mono">
              {totalLikes.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block">TikTok Live Room Connect</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">CyberCoins / Regalos</span>
              <Gift className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {totalGiftsAccumulated.toLocaleString()} ₢
            </div>
            <span className="text-[10px] text-amber-400/80 block">Superchat & Donaciones</span>
          </div>
        </div>
      </div>

      {/* Main Chart 1: Real-Time Viewers Curve (Recharts AreaChart) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Curva de Espectadores & Retención en Vivo</h2>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedMetricView("all")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedMetricView === "all" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Combinado
            </button>
            <button
              onClick={() => setSelectedMetricView("viewers")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedMetricView === "viewers" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Solo Viewers
            </button>
            <button
              onClick={() => setSelectedMetricView("engagement")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedMetricView === "engagement" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Velocidad Chat
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="viewersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="chatGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                }}
              />
              <Legend />
              {(selectedMetricView === "all" || selectedMetricView === "viewers") && (
                <Area
                  type="monotone"
                  dataKey="viewers"
                  name="Espectadores"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#viewersGradient)"
                />
              )}
              {(selectedMetricView === "all" || selectedMetricView === "engagement") && (
                <Area
                  type="monotone"
                  dataKey="chatVelocity"
                  name="Msgs / Minuto"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#chatGradient)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Row: Chat Engagement by Sentiment (BarChart) + Gift Distribution (PieChart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Sentiment & Gift Velocity (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Fluctuación de Donaciones & Sentimiento</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">Auto-Scoring</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "10px",
                    fontSize: "11px",
                  }}
                />
                <Legend />
                <Bar dataKey="giftValue" name="Coins Donados" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sentiment" name="Sentimiento %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gift Categories Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Distribución de Regalos TikTok</h3>
            </div>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={GIFT_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {GIFT_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "10px",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {GIFT_DISTRIBUTION.map((gift) => (
              <div key={gift.name} className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gift.color }} />
                <span className="text-slate-300 truncate">{gift.name}</span>
                <span className="text-white font-bold ml-auto">{gift.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLOATING OVERLAY HUD MODAL (Ready for OBS Browser Source Capture) */}
      {isOverlayModeOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950/95 border-2 border-cyan-400/80 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 animate-fadeIn relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>HECTRON LIVE STREAM OVERLAY</span>
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded-full">
                      OBS SOURCE READY
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400">Visualizador transparente para pantalla de streaming</span>
                </div>
              </div>

              <button
                onClick={() => setIsOverlayModeOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Cerrar Overlay
              </button>
            </div>

            {/* Floating HUD Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Viewers Live</span>
                  <div className="text-2xl font-black text-cyan-300 font-mono">{currentViewers}</div>
                </div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md border border-pink-500/40 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-300 font-bold">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Likes Totales</span>
                  <div className="text-2xl font-black text-pink-300 font-mono">{totalLikes.toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/40 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 font-bold">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">CyberCoins</span>
                  <div className="text-2xl font-black text-amber-300 font-mono">{totalGiftsAccumulated} ₢</div>
                </div>
              </div>
            </div>

            {/* Recharts Mini Stream Inside Overlay */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Flujo de Audiencia en Tiempo Real</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData.slice(-10)}>
                    <defs>
                      <linearGradient id="overlayArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                    <Area type="monotone" dataKey="viewers" stroke="#06b6d4" strokeWidth={2} fill="url(#overlayArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
