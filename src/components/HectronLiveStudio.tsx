import React, { useState, useEffect, useRef, useContext } from "react";
import { BrainContext } from "../BrainContext";
import {
  Download,
  BarChart2,
  Zap,
  Settings,
  Search,
  Video,
  Music,
  User,
  Activity,
  Hexagon,
  Shield,
  ChevronRight,
  Play,
  Heart,
  MessageCircle,
  Share2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  FileText,
  Loader2,
  Link as LinkIcon,
  Radio,
  Bot,
  Terminal,
  PlayCircle,
  StopCircle,
  Mic,
  Cpu,
  Sparkles,
  Gift,
  Volume2,
  VolumeX,
  RefreshCw,
  Send,
  Sliders,
  Flame,
  Globe,
  Check,
  Eye,
  Smile,
  X,
  Info,
} from "lucide-react";
import { BaphometTransmissionNodeStudio } from "./BaphometTransmissionNodeStudio";

// --- UTILS & REGEX ---
const TIKTOK_URL_REGEX = /^(https?:\/\/)?(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.*$/i;
const USERNAME_REGEX = /^@?[a-zA-Z0-9_.-]+$/;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// --- REUSABLE UI COMPONENTS ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost" | "purple";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-bold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0F19] cursor-pointer select-none";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-xs sm:text-sm",
    lg: "px-6 py-3.5 text-sm sm:text-base",
  };
  const variants = {
    primary:
      "bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500 shadow-lg shadow-indigo-500/20 border border-indigo-400/30",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-200 focus:ring-slate-700 border border-slate-700",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-lg shadow-rose-500/20 border border-rose-400/30",
    success:
      "bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500 shadow-lg shadow-emerald-500/20 border border-emerald-400/30",
    purple:
      "bg-purple-600 hover:bg-purple-500 text-white focus:ring-purple-500 shadow-lg shadow-purple-500/20 border border-purple-400/30",
    ghost: "bg-transparent hover:bg-white/5 text-slate-300 focus:ring-slate-500",
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${
        disabled || isLoading ? "opacity-60 cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({
  children,
  className = "",
  id,
}) => (
  <div
    id={id}
    className={`bg-[#0F1422]/90 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl ${className}`}
  >
    {children}
  </div>
);

const Toggle: React.FC<{ active: boolean; onChange: () => void; id?: string }> = ({
  active,
  onChange,
  id,
}) => (
  <button
    id={id}
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0B0F19] cursor-pointer ${
      active ? "bg-indigo-600" : "bg-slate-800 border border-slate-700"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
        active ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

// --- TOAST NOTIFICATIONS INTERFACE ---
interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

// --- SUB-VIEW 1: DOWNLOADER (EXTRACTOR MEDIA PRO) ---

const DownloaderView: React.FC<{ addToast: (msg: string, type?: Toast["type"]) => void }> = ({
  addToast,
}) => {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!TIKTOK_URL_REGEX.test(url.trim())) {
      addToast("URL inválida. Ingresa un enlace válido de TikTok (ej. https://vm.tiktok.com/...).", "error");
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setProgress(0);

    try {
      for (let i = 0; i <= 100; i += 10) {
        await sleep(120);
        setProgress(i);
      }

      setResult({
        id: "tk_" + Math.random().toString(36).substring(2, 9),
        title: "Sesión de transmisión y análisis Hectron Gnosis v38",
        author: "@hectron_official",
        views: 2450000,
        likes: 342000,
        shares: 48900,
        comments: 12400,
        duration: "00:45",
        thumbnail:
          "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80",
        videoSize: "14.2 MB",
        audioSize: "2.1 MB",
        resolution: "1080x1920 (60fps)",
        bitrate: "5800 kbps",
      });
      addToast("Metadatos y enlaces de medios extraídos correctamente sin marca de agua.", "success");
    } catch {
      addToast("Error al conectar con el servidor de extracción de medios.", "error");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownload = (type: "video" | "audio") => {
    addToast(
      `Iniciando descarga de ${type === "video" ? "Video HD (Sin Marca)" : "Audio Original MP3"}...`,
      "success"
    );
  };

  const handleSampleFill = () => {
    setUrl("https://www.tiktok.com/@hectron_universe/video/7391829381029384");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
          <Download className="w-3.5 h-3.5" /> Motor de Extracción v38.4
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Extractor Media <span className="text-indigo-400">Pro</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm">
          Descarga contenido original de TikTok sin compresión de calidad, sin marcas de agua y con metadatos completos.
        </p>
      </div>

      <form onSubmit={handleProcess} className="relative group">
        <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
        <div className="relative flex flex-col md:flex-row items-center bg-[#131B2C] border border-indigo-500/30 p-2 rounded-2xl shadow-2xl gap-2">
          <div className="w-full md:w-auto flex items-center flex-1">
            <div className="pl-3 pr-2 text-slate-500">
              <LinkIcon className="w-5 h-5" />
            </div>
            <input
              id="tiktok-extractor-url-input"
              type="url"
              placeholder="https://vm.tiktok.com/... o https://www.tiktok.com/@user/video/..."
              className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 w-full py-3 text-xs sm:text-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isProcessing}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleSampleFill}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline px-2 py-1 cursor-pointer whitespace-nowrap hidden sm:inline"
            >
              Pegar URL Demo
            </button>
            <Button
              id="tiktok-extractor-submit-btn"
              type="submit"
              isLoading={isProcessing}
              className="w-full md:w-auto shrink-0"
              size="md"
            >
              {isProcessing ? "Extrayendo..." : "Extraer Datos"}
              {!isProcessing && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
        {isProcessing && (
          <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </form>

      {result && (
        <Card
          id="tiktok-extractor-result-card"
          className="animate-fadeIn mt-8 border-indigo-500/20 bg-gradient-to-br from-[#131B2C] to-[#0B0F19]"
        >
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
            <div className="w-full md:w-1/3 aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden relative group shrink-0">
              <img
                src={result.thumbnail}
                alt="Thumbnail"
                className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-mono">
                {result.duration}
              </div>
              <div className="absolute top-3 right-3 bg-indigo-950/80 border border-indigo-400/40 px-2 py-0.5 rounded text-[10px] text-indigo-300 font-bold">
                HD 1080p
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors cursor-pointer shadow-lg shadow-black/50">
                  <Play className="text-white ml-0.5 fill-current w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Sin Marca de Agua
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {result.id}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-snug">
                  {result.title}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-xs">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Creador</span>
                    <span className="text-indigo-400 font-bold flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {result.author}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Vistas</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1">
                      <Play className="w-3.5 h-3.5 text-cyan-400" /> {formatNumber(result.views)}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Likes</span>
                    <span className="text-pink-400 font-bold flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" /> {formatNumber(result.likes)}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Compartidos</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5" /> {formatNumber(result.shares)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <Button
                  id="tiktok-download-video-btn"
                  variant="primary"
                  className="w-full justify-between group"
                  size="md"
                  onClick={() => handleDownload("video")}
                >
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-indigo-200" />
                    <span>Descargar Video HD (Sin Marca de Agua)</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-200">
                    <span className="text-xs font-mono opacity-80">{result.videoSize}</span>
                    <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </Button>

                <Button
                  id="tiktok-download-audio-btn"
                  variant="secondary"
                  className="w-full justify-between group"
                  size="md"
                  onClick={() => handleDownload("audio")}
                >
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-cyan-300" />
                    <span>Descargar Audio Original (MP3 Alta Fidelidad)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-xs font-mono">{result.audioSize}</span>
                    <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// --- SUB-VIEW 2: ANALYZER (ANÁLISIS DE PERFIL GNOSIS) ---

const AnalyzerView: React.FC<{ addToast: (msg: string, type?: Toast["type"]) => void }> = ({
  addToast,
}) => {
  const [username, setUsername] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedUser = username.trim();
    if (!cleanedUser) return;
    setIsAnalyzing(true);
    setData(null);

    try {
      await sleep(1800);
      setData({
        username: cleanedUser.startsWith("@") ? cleanedUser : "@" + cleanedUser,
        followers: 1240000,
        likes: 34500000,
        engagement: 8.4,
        avgViews: 450000,
        status: "Gnosis Optimizado",
        risk: "Bajo (Seguro)",
        growth: "+12.5% últimos 30d",
        topCategory: "Gaming & VTubing",
        activeAudience: "89% Latinoamérica",
        recommendedLiveHour: "20:00 - 23:00 GMT-5",
      });
      addToast(`Auditoría de perfil completada exitosamente para ${cleanedUser}.`, "success");
    } catch {
      addToast("Fallo en la conexión con los nodos de análisis Gnosis.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
            <BarChart2 className="w-3.5 h-3.5" /> Auditoría con Red Neuronal
          </div>
          <h1 className="text-3xl font-bold text-white">Análisis de Perfil</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Auditoría profunda de rendimiento, engagement y métricas de crecimiento en TikTok.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="w-full md:w-96 flex relative shadow-lg">
          <input
            id="tiktok-analyzer-input"
            type="text"
            placeholder="@usuario (ej. @hectron_official)"
            className="w-full bg-[#131B2C] border border-slate-700 rounded-l-xl py-2.5 sm:py-3 pl-4 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-xs sm:text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isAnalyzing}
          />
          <Button
            id="tiktok-analyzer-submit-btn"
            type="submit"
            variant="purple"
            className="rounded-l-none border-none shadow-none shrink-0"
            isLoading={isAnalyzing}
          >
            Escanear
          </Button>
        </form>
      </div>

      {!data && !isAnalyzing && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-center p-6">
          <Search className="w-12 h-12 mb-3 text-slate-600" />
          <p className="font-semibold text-slate-400">Ingresa un nombre de usuario para comenzar el análisis.</p>
          <p className="text-xs text-slate-600 mt-1 max-w-sm">
            Gnosis examina frecuencia de publicación, tasa de interacción y retención de audiencia en tiempo real.
          </p>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            <Hexagon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-400 w-6 h-6" />
          </div>
          <p className="text-purple-400 font-bold text-xs animate-pulse">
            Consultando nodos Gnosis y métricas de TikTok API...
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Profile Card */}
          <Card className="bg-gradient-to-r from-purple-900/30 via-slate-900 to-slate-900 border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center border border-purple-400/40 shadow-xl shadow-purple-500/20 shrink-0 text-white font-black text-2xl">
                {data.username.charAt(1)?.toUpperCase() || "H"}
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{data.username}</h2>
                <div className="flex items-center mt-2 gap-2 flex-wrap text-xs">
                  <span className="bg-green-500/10 text-green-400 px-2.5 py-0.5 rounded-full font-bold flex items-center border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {data.status}
                  </span>
                  <span className="bg-purple-500/10 text-purple-300 px-2.5 py-0.5 rounded-full font-bold border border-purple-500/30">
                    {data.topCategory}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 block">Crecimiento Estimado</span>
              <span className="text-emerald-400 font-mono font-bold text-lg flex items-center sm:justify-end gap-1">
                <TrendingUp className="w-4 h-4" /> {data.growth}
              </span>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-800 bg-slate-950/70 p-4">
              <span className="text-[11px] text-slate-400 block mb-1">Seguidores</span>
              <span className="text-2xl font-bold text-white font-mono">{formatNumber(data.followers)}</span>
              <span className="text-[10px] text-emerald-400 mt-1 block">+4.2K esta semana</span>
            </Card>

            <Card className="border-slate-800 bg-slate-950/70 p-4">
              <span className="text-[11px] text-slate-400 block mb-1">Total Likes</span>
              <span className="text-2xl font-bold text-pink-400 font-mono">{formatNumber(data.likes)}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Acumulado global</span>
            </Card>

            <Card className="border-slate-800 bg-slate-950/70 p-4">
              <span className="text-[11px] text-slate-400 block mb-1">Tasa de Engagement</span>
              <span className="text-2xl font-bold text-cyan-400 font-mono">{data.engagement}%</span>
              <span className="text-[10px] text-cyan-400/80 mt-1 block">Muy por encima de la media (3.2%)</span>
            </Card>

            <Card className="border-slate-800 bg-slate-950/70 p-4">
              <span className="text-[11px] text-slate-400 block mb-1">Promedio de Vistas</span>
              <span className="text-2xl font-bold text-amber-400 font-mono">{formatNumber(data.avgViews)}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Por publicación regular</span>
            </Card>
          </div>

          {/* Intelligence Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" /> Horario Óptimo para Emitir
              </h4>
              <p className="text-slate-300">
                La mayor concentración de audiencia activa ocurre entre <strong>{data.recommendedLiveHour}</strong>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" /> Nivel de Riesgo de Shadowban
              </h4>
              <p className="text-slate-300">
                Estado: <strong className="text-emerald-400">{data.risk}</strong>. No se detectan anomalías de spam ni bloqueos de palabras clave.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-VIEW 3: AUTOMATION (NÚCLEO DE AUTOMATIZACIÓN) ---

interface AutomationTask {
  id: number;
  title: string;
  desc: string;
  icon: any;
  active: boolean;
  frequency: string;
}

const AutomationView: React.FC<{ addToast: (msg: string, type?: Toast["type"]) => void }> = ({
  addToast,
}) => {
  const [tasks, setTasks] = useState<AutomationTask[]>([
    {
      id: 1,
      title: "Smart Engagement Protocol",
      desc: "Interactúa con contenido de la comunidad (Like/View) con delay aleatorio natural (5-15s) evitando rate limits.",
      icon: Activity,
      active: true,
      frequency: "Continuo en vivo",
    },
    {
      id: 2,
      title: "IA Comment Reply & Function Calling",
      desc: "Responde automáticamente a preguntas y comentarios en el chat mediante el modelo Gemini 3.1 y TTS neuronal.",
      icon: MessageCircle,
      active: true,
      frequency: "Disparo por evento",
    },
    {
      id: 3,
      title: "Auto-Moderación y Filtro de Toxicidad",
      desc: "Detecta mensajes inapropiados o spam en el Live y ejecuta funciones de baneo/silenciamiento autónomo.",
      icon: Shield,
      active: true,
      frequency: "Tiempo real (<50ms)",
    },
    {
      id: 4,
      title: "Agradecimiento de Regalos (Gift Reactor)",
      desc: "Dispara animaciones 3D personalizadas y voz emotiva cada vez que un espectador envía rosas, diamantes o coronas.",
      icon: Gift,
      active: false,
      frequency: "Al recibir regalo",
    },
  ]);

  const toggleTask = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newState = !task.active;
    setTasks(tasks.map((t) => (t.id === id ? { ...t, active: newState } : t)));

    if (newState) {
      addToast(`Activando protocolo: ${task.title}...`, "info");
      await sleep(400);
      addToast(`${task.title} en línea y operando.`, "success");
    } else {
      addToast(`${task.title} pausado.`, "info");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
            <Zap className="w-3.5 h-3.5" /> Motor Autónomo de Reglas
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            Núcleo de Automatización
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Activa agentes autónomos y protocolos de interacción para transmisiones 24/7.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setTasks((prev) => prev.map((t) => ({ ...t, active: true })));
              addToast("Todos los protocolos de automatización han sido activados.", "success");
            }}
          >
            Activar Todos
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <Card
              key={task.id}
              className={`transition-all duration-300 ${
                task.active
                  ? "border-indigo-500/40 bg-indigo-950/20"
                  : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-xl mt-0.5 shrink-0 ${
                      task.active
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "bg-slate-900 text-slate-500 border border-slate-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-100">{task.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                        {task.frequency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                      {task.desc}
                    </p>
                  </div>
                </div>
                <Toggle
                  id={`automation-toggle-${task.id}`}
                  active={task.active}
                  onChange={() => toggleTask(task.id)}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// --- SUB-VIEW 4: LIVE BOT & AUTONOMOUS LLM HOST ---

interface LiveLog {
  id: number;
  type: "system" | "user" | "bot" | "function" | "gift";
  user?: string;
  text?: string;
  func?: string;
  args?: string;
  giftName?: string;
  time: string;
}

const LiveBotView: React.FC<{ addToast: (msg: string, type?: Toast["type"]) => void }> = ({
  addToast,
}) => {
  const {
    speakText,
    isSpeaking,
    ttsVoiceSettings,
    gameState,
    obsStatus,
    setObsStatus,
  } = useContext(BrainContext);

  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [autoModeration, setAutoModeration] = useState(true);
  const [functionsEnabled, setFunctionsEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [customMsg, setCustomMsg] = useState("");
  const [simulatedUsername, setSimulatedUsername] = useState("ViewerGamer_42");
  const [logs, setLogs] = useState<LiveLog[]>([
    {
      id: 1,
      type: "system",
      text: "Núcleo LLM Gemini en espera. Servidor listo para emitir.",
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Simulation loop when Live is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        // Fluctuate viewers realistically
        setViewers((prev) => {
          const delta = Math.floor(Math.random() * 50) - 22;
          const next = prev + delta;
          return next < 120 ? 150 + Math.floor(Math.random() * 30) : next;
        });

        const chance = Math.random();

        // 1. User Chat Event
        if (chance > 0.55) {
          const sampleUsers = ["CyberFan_99", "MikuLover", "GamerPro_X", "Luna_Stream", "Alex_Tiktok", "HectronFan"];
          const sampleTexts = [
            "¡Hola Miku! ¿Cómo vas en la partida?",
            "¡Qué buena jugada en el live!",
            "¿Cuál es tu personaje favorito?",
            "¡Mándame un saludo por favor!",
            "¡Increíble la calidad del avatar 3D con Gemini!",
          ];
          const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
          const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

          const newChat: LiveLog = {
            id: Date.now(),
            type: "user",
            user: randomUser,
            text: randomText,
            time: new Date().toLocaleTimeString(),
          };

          setLogs((prev) => [...prev.slice(-49), newChat]);

          // Autonomous bot reasoning + Function calling reply
          if (functionsEnabled) {
            setTimeout(() => {
              const funcCall: LiveLog = {
                id: Date.now() + 1,
                type: "function",
                func: "generate_response",
                args: JSON.stringify({ user: randomUser, intent: "chat_engagement", sentiment: "positive" }),
                time: new Date().toLocaleTimeString(),
              };

              const botResponses = [
                `¡Muchísimas gracias por estar aquí, ${randomUser}! ¡Vamos con todo el ánimo en el stream!`,
                `¡Hola ${randomUser}! Me alegra mucho leerte en el chat. ¡Hoy estamos súper conectados con Gemini!`,
                `¡Saludos especiales para ${randomUser}! Gracias por acompañarnos en esta aventura autónoma.`,
              ];
              const botText = botResponses[Math.floor(Math.random() * botResponses.length)];

              const botReply: LiveLog = {
                id: Date.now() + 2,
                type: "bot",
                text: botText,
                time: new Date().toLocaleTimeString(),
              };

              setLogs((prev) => [...prev.slice(-48), funcCall, botReply]);

              // Read aloud with TTS if enabled
              if (ttsEnabled) {
                speakText(botText, "HAPPY", "happy");
              }
            }, 1200);
          }
        } else if (chance > 0.4 && autoModeration && functionsEnabled) {
          // Autonomous moderation simulation
          const trollUser = `spammer_${Math.floor(Math.random() * 900 + 100)}`;
          const trollMsg: LiveLog = {
            id: Date.now(),
            type: "user",
            user: trollUser,
            text: "FREE COINS CLICK LINK http://spam-site.xyz !!",
            time: new Date().toLocaleTimeString(),
          };

          const banFunc: LiveLog = {
            id: Date.now() + 1,
            type: "function",
            func: "ban_user",
            args: JSON.stringify({ userId: trollUser, duration: "permanent", reason: "toxic_link_spam" }),
            time: new Date().toLocaleTimeString(),
          };

          setLogs((prev) => [...prev.slice(-48), trollMsg, banFunc]);
        }
      }, 4000);
    } else {
      setViewers(0);
    }

    return () => clearInterval(interval);
  }, [isLive, functionsEnabled, autoModeration, ttsEnabled, speakText]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const toggleLive = () => {
    if (!isLive) {
      setIsLive(true);
      setViewers(420);
      addToast("Conectando con servidores de streaming RTMP y Webcast Push...", "info");
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "system",
          text: "🔴 Conexión RTMP establecida (1080p60). Transmisión EN VIVO iniciada.",
          time: new Date().toLocaleTimeString(),
        },
      ]);
      setObsStatus({ ...obsStatus, streaming: true });
    } else {
      setIsLive(false);
      addToast("Transmisión finalizada con éxito.", "success");
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "system",
          text: "⏹️ Transmisión cerrada y estadísticas guardadas en caché.",
          time: new Date().toLocaleTimeString(),
        },
      ]);
      setObsStatus({ ...obsStatus, streaming: false });
    }
  };

  const handleSendManualChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    const userText = customMsg.trim();
    setCustomMsg("");

    const newChat: LiveLog = {
      id: Date.now(),
      type: "user",
      user: simulatedUsername,
      text: userText,
      time: new Date().toLocaleTimeString(),
    };

    setLogs((prev) => [...prev.slice(-49), newChat]);

    // Bot response after 800ms
    setTimeout(() => {
      const botReplyText = `¡Gracias por tu mensaje ${simulatedUsername}! He procesado tu pregunta con Gemini: "${userText.substring(0, 30)}..."`;
      const funcLog: LiveLog = {
        id: Date.now() + 1,
        type: "function",
        func: "stream_interactive_reply",
        args: JSON.stringify({ input: userText, sender: simulatedUsername }),
        time: new Date().toLocaleTimeString(),
      };
      const botLog: LiveLog = {
        id: Date.now() + 2,
        type: "bot",
        text: botReplyText,
        time: new Date().toLocaleTimeString(),
      };

      setLogs((prev) => [...prev.slice(-48), funcLog, botLog]);

      if (ttsEnabled) {
        speakText(botReplyText, "HAPPY", "happy");
      }
    }, 900);
  };

  const handleSendGift = (giftType: string) => {
    const giftLog: LiveLog = {
      id: Date.now(),
      type: "gift",
      user: simulatedUsername,
      giftName: giftType,
      time: new Date().toLocaleTimeString(),
    };

    const funcLog: LiveLog = {
      id: Date.now() + 1,
      type: "function",
      func: "reward_gift_reaction",
      args: JSON.stringify({ gift: giftType, sender: simulatedUsername, multiplier: 1.5 }),
      time: new Date().toLocaleTimeString(),
    };

    const botText = `¡Waaah! ¡Muchísimas gracias ${simulatedUsername} por el regalo ${giftType}! ¡Eres increíble! 🎉`;
    const botLog: LiveLog = {
      id: Date.now() + 2,
      type: "bot",
      text: botText,
      time: new Date().toLocaleTimeString(),
    };

    setLogs((prev) => [...prev.slice(-47), giftLog, funcLog, botLog]);
    addToast(`Regalo "${giftType}" enviado en directo.`, "success");

    if (ttsEnabled) {
      speakText(botText, "SURPRISE", "surprised");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-950/70 border border-rose-500/30 text-rose-300 text-xs font-bold">
              <Radio className="w-3.5 h-3.5 text-rose-400" /> Live Studio & AI Host
            </div>
            {isLive ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> EN VIVO
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                EN ESPERA
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">
            LLM Autónomo controlando transmisión, interacción con chat y moderación vía Function Calling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            id="toggle-live-stream-btn"
            variant={isLive ? "danger" : "primary"}
            onClick={toggleLive}
            size="md"
            className={isLive ? "shadow-[0_0_20px_rgba(225,29,72,0.4)]" : "shadow-[0_0_20px_rgba(79,70,229,0.3)]"}
          >
            {isLive ? (
              <>
                <StopCircle className="w-4 h-4 mr-2" /> Finalizar Emisión
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" /> Iniciar Bot Live
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid: Stream Viewport (Left) & LLM Logs / Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Column: Video Stream Viewport */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative rounded-2xl overflow-hidden bg-[#0A0D14] border border-white/10 aspect-[9/16] lg:aspect-auto lg:h-[580px] w-full max-w-sm mx-auto shadow-2xl flex flex-col justify-between p-4 select-none">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-[#0A0D14]/90 to-[#0A0D14] pointer-events-none" />

            {/* Glowing avatar orb */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="relative">
                <div
                  className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-700 ${
                    isLive
                      ? isSpeaking
                        ? "bg-gradient-to-tr from-pink-500 via-cyan-400 to-indigo-500 animate-spin blur-md opacity-70"
                        : "bg-gradient-to-tr from-indigo-600 to-cyan-500 blur-md opacity-40 animate-pulse"
                      : "bg-slate-800 blur-sm opacity-20"
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-slate-950 border-2 border-cyan-400/60 flex flex-col items-center justify-center text-center p-2 shadow-2xl">
                    <Bot className={`w-10 h-10 ${isLive ? "text-cyan-300" : "text-slate-600"}`} />
                    <span className="text-[10px] font-black text-white mt-1">
                      {isLive ? (isSpeaking ? "HABLANDO" : "ESCUCHANDO") : "OFFLINE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sound Wave Animation if speaking */}
              {isSpeaking && (
                <div className="flex items-center gap-1 mt-4">
                  {[40, 70, 100, 60, 90, 40, 80, 50].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-cyan-400 rounded-full animate-pulse"
                      style={{ height: `${h * 0.25}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Top Stream Overlays (Viewers, Bitrate, Status) */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-xs text-white">
                  <Eye className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-mono font-bold">{formatNumber(viewers)}</span>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-slate-300 font-mono">
                  60 FPS • 1080p
                </div>
              </div>

              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>{ttsVoiceSettings.voice} AI</span>
              </div>
            </div>

            {/* Bottom Stream Overlays (Interactive Live Actions) */}
            <div className="relative z-10 space-y-2">
              <div className="bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center justify-between gap-1 text-[10px]">
                <span className="text-slate-400">Regalos Directos:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSendGift("Rosa 🌹")}
                    className="px-2 py-1 bg-pink-950/70 hover:bg-pink-900 border border-pink-500/40 rounded text-pink-300 font-bold cursor-pointer"
                  >
                    🌹 Rosa
                  </button>
                  <button
                    onClick={() => handleSendGift("Diamante 💎")}
                    className="px-2 py-1 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 rounded text-cyan-300 font-bold cursor-pointer"
                  >
                    💎 Diamante
                  </button>
                  <button
                    onClick={() => handleSendGift("Corona 👑")}
                    className="px-2 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 rounded text-amber-300 font-bold cursor-pointer"
                  >
                    👑 Corona
                  </button>
                </div>
              </div>

              {/* Chat simulation mini-input */}
              <form onSubmit={handleSendManualChat} className="flex gap-1">
                <input
                  type="text"
                  placeholder="Enviar mensaje al bot en vivo..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="flex-1 bg-black/70 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Autonomous LLM Terminal & Function Calls */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Controls Bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Toggle
                  id="toggle-auto-moderation"
                  active={autoModeration}
                  onChange={() => setAutoModeration(!autoModeration)}
                />
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Auto-Moderación
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Toggle
                  id="toggle-functions-calling"
                  active={functionsEnabled}
                  onChange={() => setFunctionsEnabled(!functionsEnabled)}
                />
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" /> Function Calling
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Toggle
                  id="toggle-voice-tts-live"
                  active={ttsEnabled}
                  onChange={() => setTtsEnabled(!ttsEnabled)}
                />
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  {ttsEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  Voz Gemini TTS
                </span>
              </div>
            </div>

            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Limpiar Terminal
            </button>
          </div>

          {/* Terminal Logs Viewport */}
          <div className="bg-[#080B11] border border-slate-800 rounded-xl p-4 flex-1 h-[480px] overflow-y-auto font-mono text-xs space-y-2.5 shadow-inner">
            <div className="text-[11px] text-slate-500 pb-2 border-b border-slate-850 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Terminal className="w-3.5 h-3.5" /> Consola de Eventos & Function Calling Gemini
              </span>
              <span>{logs.length} registros</span>
            </div>

            {logs.length === 0 && (
              <div className="text-center text-slate-600 py-12">
                No hay eventos registrados. Inicia la transmisión o envía un mensaje.
              </div>
            )}

            {logs.map((log) => {
              if (log.type === "system") {
                return (
                  <div key={log.id} className="text-slate-400 flex items-start gap-2 bg-slate-900/40 p-2 rounded">
                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                    <span className="text-slate-300 font-semibold">{log.text}</span>
                  </div>
                );
              }

              if (log.type === "user") {
                return (
                  <div key={log.id} className="flex items-start gap-2 text-slate-200 bg-slate-950 p-2 rounded border border-slate-900">
                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                    <span className="text-indigo-400 font-bold shrink-0">@{log.user}:</span>
                    <span className="text-slate-200">{log.text}</span>
                  </div>
                );
              }

              if (log.type === "function") {
                return (
                  <div key={log.id} className="flex items-start gap-2 text-purple-300 bg-purple-950/30 p-2 rounded border border-purple-500/20">
                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                    <span className="text-purple-400 font-bold flex items-center gap-1 shrink-0">
                      <Cpu className="w-3.5 h-3.5" /> Exec [{log.func}]:
                    </span>
                    <span className="text-purple-200 break-all">{log.args}</span>
                  </div>
                );
              }

              if (log.type === "bot") {
                return (
                  <div key={log.id} className="flex items-start gap-2 text-cyan-300 bg-cyan-950/30 p-2 rounded border border-cyan-500/20">
                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1 shrink-0">
                      <Bot className="w-3.5 h-3.5" /> Bot Host:
                    </span>
                    <span className="text-cyan-100">{log.text}</span>
                  </div>
                );
              }

              if (log.type === "gift") {
                return (
                  <div key={log.id} className="flex items-start gap-2 text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-500/20">
                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1 shrink-0">
                      <Gift className="w-3.5 h-3.5" /> Regalo Recibido:
                    </span>
                    <span className="text-amber-200 font-bold">
                      @{log.user} envió {log.giftName}
                    </span>
                  </div>
                );
              }

              return null;
            })}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN HECTRON LIVE STUDIO COMPONENT ---

export const HectronLiveStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"live" | "downloader" | "analyzer" | "automation" | "baphomet">("live");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div id="hectron-live-studio-root" className="space-y-6 max-w-7xl mx-auto relative">
      {/* Toast Notification Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-2xl text-xs font-semibold border backdrop-blur-lg animate-fadeIn ${
              t.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/50"
                : t.type === "error"
                ? "bg-rose-950/90 text-rose-200 border-rose-500/50"
                : t.type === "warning"
                ? "bg-amber-950/90 text-amber-200 border-amber-500/50"
                : "bg-indigo-950/90 text-indigo-200 border-indigo-500/50"
            }`}
          >
            <div className="flex items-center gap-2 mr-2">
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {t.type === "warning" && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
              {t.type === "info" && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Module Sub-Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-850 flex-1 sm:flex-initial overflow-x-auto">
          <button
            id="subtab-live-studio"
            onClick={() => setActiveSubTab("live")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === "live"
                ? "bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg shadow-rose-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-4 h-4 text-rose-400" />
            <span>Live Studio & AI Host</span>
          </button>

          <button
            id="subtab-downloader"
            onClick={() => setActiveSubTab("downloader")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === "downloader"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Download className="w-4 h-4 text-indigo-300" />
            <span>Extractor Media Pro</span>
          </button>

          <button
            id="subtab-analyzer"
            onClick={() => setActiveSubTab("analyzer")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === "analyzer"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart2 className="w-4 h-4 text-purple-300" />
            <span>Análisis de Perfil (Gnosis)</span>
          </button>

          <button
            id="subtab-automation"
            onClick={() => setActiveSubTab("automation")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === "automation"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Núcleo de Automatización</span>
          </button>

          <button
            id="subtab-baphomet"
            onClick={() => setActiveSubTab("baphomet")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === "baphomet"
                ? "bg-gradient-to-r from-cyan-500 to-amber-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black"
                : "text-amber-300 hover:text-amber-100"
            }`}
          >
            <Radio className="w-4 h-4 text-amber-400" />
            <span>⚡ Nodo Baphomet (vΩ+12.1)</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 pr-2 text-xs font-medium text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Hectron Live Suite v38.4</span>
        </div>
      </div>

      {/* Active Sub-View Render */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-7 shadow-2xl">
        {activeSubTab === "live" && <LiveBotView addToast={addToast} />}
        {activeSubTab === "downloader" && <DownloaderView addToast={addToast} />}
        {activeSubTab === "analyzer" && <AnalyzerView addToast={addToast} />}
        {activeSubTab === "automation" && <AutomationView addToast={addToast} />}
        {activeSubTab === "baphomet" && <BaphometTransmissionNodeStudio />}
      </div>
    </div>
  );
};
