import { useState, useContext } from "react";
import {
  QrCode,
  Wifi,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Send,
  Zap,
  Globe,
  ExternalLink,
  Copy,
  Check,
  BellRing,
  X
} from "lucide-react";
import { BrainContext } from "../BrainContext";
import { useTiktokQrAuthListener } from "../hooks/useTiktokQrAuthListener";

interface TiktokQrAuthCardProps {
  onStreamerConnected?: (username: string) => void;
}

export function TiktokQrAuthCard({ onStreamerConnected }: TiktokQrAuthCardProps) {
  const { addLog, setTiktokConnected } = useContext(BrainContext);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [testUsername, setTestUsername] = useState<string>("hectorruiz9992");

  const {
    status,
    sessionId,
    timeRemainingSec,
    authorizedUser,
    lastNotification,
    isPolling,
    setIsPolling,
    isAuthorizing,
    isRegenerating,
    authSuccessToast,
    dismissToast,
    regenerateQr,
    simulateScan,
    simulateAuthorize,
    testWebhookAuth,
    refreshStatus,
  } = useTiktokQrAuthListener({
    pollingIntervalMs: 2000,
    autoPoll: true,
    onAuthorized: (user, method) => {
      addLog(
        "INFO",
        "TIKTOK",
        `🎉 ¡Autenticación QR Exitosa! Estado 'AUTHORIZED' detectado mediante ${method}. Usuario: @${user.username}`
      );
      if (setTiktokConnected) {
        setTiktokConnected(true);
      }
      if (onStreamerConnected) {
        onStreamerConnected(user.username);
      }
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const formatCountdown = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-5 md:p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP NOTIFICATION BANNER IF JUST AUTHORIZED */}
      {authSuccessToast && authorizedUser && (
        <div className="animate-fadeIn relative bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/80 rounded-xl p-4 shadow-xl shadow-emerald-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl font-bold shadow-lg shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white uppercase tracking-wider">
                  ¡Autenticación TikTok LIVE Exitosa!
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AUTHORIZED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Código QR verificado. Streamer <strong className="text-emerald-300">@{authorizedUser.username}</strong> sincronizado en tiempo real con Hectron Live Studio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => onStreamerConnected && onStreamerConnected(authorizedUser.username)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Iniciar Live Chat</span>
            </button>
            <button
              onClick={dismissToast}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-pink-500/20 to-cyan-500/20 border border-pink-500/30 rounded-xl text-pink-400">
            <QrCode className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">Conexión por Código QR de TikTok LIVE</h3>
              <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 font-mono text-[10px] rounded border border-cyan-500/30 flex items-center gap-1">
                <BellRing className="w-3 h-3 text-cyan-400" />
                Webhook & Polling Listener Activo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Escanea el código QR desde la app móvil de TikTok o usa el listener para detectar el cambio a estado <code className="text-cyan-300 font-mono">AUTHORIZED</code>.
            </p>
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2">
          {status === "AUTHORIZED" ? (
            <span className="px-3.5 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>AUTORIZADO (AUTHORIZED)</span>
            </span>
          ) : status === "SCANNED" ? (
            <span className="px-3.5 py-1.5 bg-blue-950 text-blue-300 border border-blue-500/50 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-950/40 animate-pulse">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span>ESCANEADO EN MÓVIL</span>
            </span>
          ) : status === "EXPIRED" ? (
            <span className="px-3.5 py-1.5 bg-red-950 text-red-400 border border-red-500/50 rounded-full font-bold text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>QR EXPIRADO</span>
            </span>
          ) : (
            <span className="px-3.5 py-1.5 bg-amber-950 text-amber-300 border border-amber-500/50 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>ESPERANDO ESCANEO ({formatCountdown(timeRemainingSec)})</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Interactive Scanning Card Layout (Matching Mobile/PC UX) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Mobile Scanner Canvas & QR Display */}
        <div className="lg:col-span-5 flex flex-col items-center bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-inner">
          {/* Top Countdown Timer & Instruction */}
          <div className="text-center space-y-1 mb-4 w-full">
            <div className="inline-block px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-center">
              <span className={`font-mono text-2xl font-black tracking-widest ${
                timeRemainingSec <= 10 && status === "WAITING_SCAN" ? "text-red-400 animate-pulse" : "text-white"
              }`}>
                {formatCountdown(timeRemainingSec)}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white pt-2">Prepárate para conectar</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              Abre TikTok en tu teléfono y pulsa <strong>((•))</strong> o escanea el QR antes de que termine la cuenta regresiva.
            </p>
          </div>

          {/* QR Code Container with Animated Scan Line */}
          <div className="relative p-4 bg-white rounded-2xl shadow-2xl border-4 border-slate-800 group">
            {/* Real SVG QR Visual Matrix */}
            <svg
              className="w-48 h-48 sm:w-56 sm:h-56"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background */}
              <rect width="200" height="200" fill="#ffffff" />

              {/* Corner 1: Top-Left Finder */}
              <rect x="15" y="15" width="45" height="45" fill="#0f172a" rx="4" />
              <rect x="22" y="22" width="31" height="31" fill="#ffffff" rx="2" />
              <rect x="29" y="29" width="17" height="17" fill="#0f172a" rx="2" />

              {/* Corner 2: Top-Right Finder */}
              <rect x="140" y="15" width="45" height="45" fill="#0f172a" rx="4" />
              <rect x="147" y="22" width="31" height="31" fill="#ffffff" rx="2" />
              <rect x="154" y="29" width="17" height="17" fill="#0f172a" rx="2" />

              {/* Corner 3: Bottom-Left Finder */}
              <rect x="15" y="140" width="45" height="45" fill="#0f172a" rx="4" />
              <rect x="22" y="147" width="31" height="31" fill="#ffffff" rx="2" />
              <rect x="29" y="154" width="17" height="17" fill="#0f172a" rx="2" />

              {/* Data Matrix Dots */}
              <g fill="#0f172a">
                <rect x="70" y="20" width="8" height="8" />
                <rect x="85" y="20" width="8" height="8" />
                <rect x="105" y="20" width="8" height="8" />
                <rect x="120" y="20" width="8" height="8" />

                <rect x="70" y="35" width="8" height="8" />
                <rect x="95" y="35" width="8" height="8" />
                <rect x="110" y="35" width="8" height="8" />

                <rect x="70" y="50" width="8" height="8" />
                <rect x="85" y="50" width="8" height="8" />
                <rect x="100" y="50" width="8" height="8" />
                <rect x="120" y="50" width="8" height="8" />

                {/* Middle sections */}
                <rect x="20" y="70" width="8" height="8" />
                <rect x="35" y="70" width="8" height="8" />
                <rect x="50" y="70" width="8" height="8" />
                <rect x="75" y="70" width="8" height="8" />
                <rect x="90" y="70" width="8" height="8" />
                <rect x="115" y="70" width="8" height="8" />
                <rect x="135" y="70" width="8" height="8" />
                <rect x="155" y="70" width="8" height="8" />
                <rect x="170" y="70" width="8" height="8" />

                <rect x="20" y="85" width="8" height="8" />
                <rect x="40" y="85" width="8" height="8" />
                <rect x="60" y="85" width="8" height="8" />
                <rect x="80" y="85" width="8" height="8" />
                <rect x="125" y="85" width="8" height="8" />
                <rect x="145" y="85" width="8" height="8" />
                <rect x="165" y="85" width="8" height="8" />

                <rect x="20" y="105" width="8" height="8" />
                <rect x="45" y="105" width="8" height="8" />
                <rect x="65" y="105" width="8" height="8" />
                <rect x="90" y="105" width="8" height="8" />
                <rect x="110" y="105" width="8" height="8" />
                <rect x="130" y="105" width="8" height="8" />
                <rect x="150" y="105" width="8" height="8" />
                <rect x="170" y="105" width="8" height="8" />

                <rect x="20" y="120" width="8" height="8" />
                <rect x="40" y="120" width="8" height="8" />
                <rect x="70" y="120" width="8" height="8" />
                <rect x="85" y="120" width="8" height="8" />
                <rect x="105" y="120" width="8" height="8" />
                <rect x="140" y="120" width="8" height="8" />
                <rect x="160" y="120" width="8" height="8" />

                {/* Bottom section */}
                <rect x="70" y="140" width="8" height="8" />
                <rect x="90" y="140" width="8" height="8" />
                <rect x="110" y="140" width="8" height="8" />
                <rect x="130" y="140" width="8" height="8" />
                <rect x="150" y="140" width="8" height="8" />
                <rect x="170" y="140" width="8" height="8" />

                <rect x="70" y="155" width="8" height="8" />
                <rect x="95" y="155" width="8" height="8" />
                <rect x="115" y="155" width="8" height="8" />
                <rect x="140" y="155" width="8" height="8" />
                <rect x="165" y="155" width="8" height="8" />

                <rect x="70" y="170" width="8" height="8" />
                <rect x="85" y="170" width="8" height="8" />
                <rect x="105" y="170" width="8" height="8" />
                <rect x="125" y="170" width="8" height="8" />
                <rect x="155" y="170" width="8" height="8" />
                <rect x="170" y="170" width="8" height="8" />
              </g>

              {/* TikTok Center Logo Badge */}
              <circle cx="100" cy="100" r="18" fill="#000000" />
              <path
                d="M104 90.5c.8 1.2 2 2 3.5 2.2v2.8c-1.3 0-2.6-.5-3.5-1.3v5.8c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.4 0 .7 0 1 .1v3c-.3-.1-.7-.1-1-.1-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3V88h3v2.5z"
                fill="#ffffff"
              />
            </svg>

            {/* Laser scanning beam animation */}
            {status === "WAITING_SCAN" && (
              <div className="absolute inset-x-4 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400 animate-pulse pointer-events-none"
                   style={{
                     animation: "bounce 2.5s infinite",
                     top: "30%"
                   }}
              />
            )}

            {/* Overlay if AUTHORIZED */}
            {status === "AUTHORIZED" && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 mb-2 shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="text-white font-black text-sm">¡AUTORIZADO!</span>
                <span className="text-emerald-400 font-mono text-xs mt-0.5">
                  @{authorizedUser?.username || "hectorruiz9992"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Sesión LIVE lista</span>
              </div>
            )}

            {/* Overlay if EXPIRED */}
            {status === "EXPIRED" && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
                <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
                <span className="text-white font-bold text-xs">Tiempo Expirado</span>
                <button
                  onClick={regenerateQr}
                  disabled={isRegenerating}
                  className="mt-2 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                  <span>Regenerar QR</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Regenerate & WiFi Note */}
          <div className="mt-4 flex items-center justify-between w-full text-[11px] text-slate-400 px-2">
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span>Misma red Wi-Fi</span>
            </span>
            <button
              onClick={regenerateQr}
              disabled={isRegenerating}
              className="text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
              <span>Nuevo QR</span>
            </button>
          </div>
        </div>

        {/* Right Side: Step-by-Step Instructions & Realtime Listener Monitor */}
        <div className="lg:col-span-7 space-y-4">
          {/* Step Instructions */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-pink-400" />
              <span>Instrucciones de Escaneo en la App TikTok:</span>
            </h4>
            <ol className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>En la aplicación TikTok de tu teléfono, pulsa en <strong>Perfil</strong> (esquina inferior derecha).</span>
              </li>
              <li className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>Pulsa el menú <strong>☰</strong> en la parte superior y selecciona <strong>Mi código QR</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Pulsa el icono de <strong>Escanear</strong> en la esquina superior y apunta la cámara a este código.</span>
              </li>
            </ol>
          </div>

          {/* Active Listener Status & Channel Info */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-cyan-500/30 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Estado del Listener de Autenticación</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPolling}
                  onChange={(e) => setIsPolling(e.target.checked)}
                  className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
                />
                <span className="text-[11px] text-slate-400">Polling Activo</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 space-y-0.5">
                <span className="text-slate-400 block">Canal WebSocket de Push:</span>
                <span className="font-mono text-cyan-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>wss://.../api/brain/ws</span>
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 space-y-0.5">
                <span className="text-slate-400 block">Webhook Receptor Activo:</span>
                <span className="font-mono text-pink-300 flex items-center gap-1 truncate">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  <span>/api/tiktok/webhook</span>
                </span>
              </div>
            </div>

            {/* Session ID & User Details if Authorized */}
            {authorizedUser ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Usuario Vinculado con Éxito</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {authorizedUser.authorizedAt ? new Date(authorizedUser.authorizedAt).toLocaleTimeString() : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-emerald-900/60 font-mono text-[11px]">
                  <span className="text-white font-bold">@{authorizedUser.username}</span>
                  <button
                    onClick={() => handleCopy(authorizedUser.accessToken)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar Token</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center justify-between">
                <span>Sesión QR ID: <strong className="font-mono text-cyan-300">{sessionId || "Iniciando..."}</strong></span>
                <button
                  onClick={refreshStatus}
                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Consultar</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Simulation / Testing Trigger Bar */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Consola de Prueba de Listener & Webhook</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Modo Desarrollador</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={testUsername}
                onChange={(e) => setTestUsername(e.target.value.trim())}
                placeholder="Usuario TikTok de prueba"
                className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none focus:border-cyan-400"
              />

              <button
                onClick={simulateScan}
                disabled={isAuthorizing || status === "AUTHORIZED"}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                title="Simula la detección del escaneo antes de autorizar"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span>1. Simular Escaneo</span>
              </button>

              <button
                onClick={() => simulateAuthorize(testUsername)}
                disabled={isAuthorizing}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-950/50 transition disabled:opacity-50"
                title="Cambia el estado a AUTHORIZED para probar el listener y la notificación"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2. Simular AUTHORIZED</span>
              </button>

              <button
                onClick={() => testWebhookAuth(testUsername)}
                disabled={isAuthorizing}
                className="px-3 py-1.5 bg-pink-900/60 hover:bg-pink-800 text-pink-200 border border-pink-500/30 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                title="Envía una notificación real a /api/tiktok/webhook para verificar el pipeline completo"
              >
                <Send className="w-3.5 h-3.5 text-pink-400" />
                <span>3. Disparar Webhook</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
