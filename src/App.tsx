import { useContext, useState, useEffect } from "react";
import { BrainContext } from "./BrainContext";
import { LiveControl } from "./components/LiveControl";
import { SceneSelector } from "./components/SceneSelector";
import { Chat } from "./components/Chat";
import { Overlay } from "./components/Overlay";
import { LogsView } from "./components/LogsView";
import { PerformanceView } from "./components/PerformanceView";
import { jsPDF } from "jspdf";
import {
  Mic,
  Tv,
  Radio,
  Settings,
  Music2,
  Sparkles,
  ExternalLink,
  Bot,
  Volume2,
  HelpCircle,
  Terminal,
  Activity,
  Smartphone,
  Copy,
  Check,
  Image,
} from "lucide-react";

const downloadImageAsPDF = async (imageSrc: string, pdfFileName: string) => {
  let objectUrl = "";
  try {
    // Fetch the image as a Blob to bypass any sandbox/relative resolution quirks inside iframes
    const response = await fetch(imageSrc);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    objectUrl = URL.createObjectURL(blob);

    const img = new window.Image();
    img.src = objectUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = (err) => {
        console.error("Failed to load image from object URL:", err);
        reject(err);
      };
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");
    ctx.drawImage(img, 0, 0);
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const doc = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height]
    });

    doc.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
    doc.save(pdfFileName);
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
};

export default function App() {
  const [previewType, setPreviewType] = useState<"interactive" | "sketchfab">("interactive");
  const [tiktokSubTab, setTiktokSubTab] = useState<"web" | "android" | "mockups">("web");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isDownloading1, setIsDownloading1] = useState(false);
  const [isDownloading2, setIsDownloading2] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownloadPDF1 = async () => {
    setIsDownloading1(true);
    try {
      await downloadImageAsPDF("/tiktok_login_mockup.jpg", "HECTRON_TikTok_Login_Mockup.pdf");
    } catch (err) {
      console.error("Error generating PDF 1", err);
    } finally {
      setIsDownloading1(false);
    }
  };

  const handleDownloadPDF2 = async () => {
    setIsDownloading2(true);
    try {
      await downloadImageAsPDF("/tiktok_live_dashboard.jpg", "HECTRON_TikTok_Live_Mockup.pdf");
    } catch (err) {
      console.error("Error generating PDF 2", err);
    } finally {
      setIsDownloading2(false);
    }
  };

  const {
    activeTab,
    setActiveTab,
    agentStatus,
    obsStatus,
    tiktokConnected,
    agentUrl,
    setAgentUrl,
    emotion,
    latestSpeechText,
    isSpeaking,
  } = useContext(BrainContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tiktok_logout") === "true") {
      localStorage.removeItem("hectron_tiktok_code");
      // Clean up URL parameters cleanly
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (activeTab === "overlay") {
    return (
      <div className="relative w-full h-screen">
        <button
          onClick={() => setActiveTab("dashboard")}
          className="absolute top-4 right-4 z-50 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md shadow-xl transition cursor-pointer"
        >
          ← Volver al Dashboard
        </button>
        <Overlay />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-cyan-500/20 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 animate-pulse">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400">
                HECTRON STUDIO
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Streamer Virtual Autónomo • Miku 3D + Gemini AI TTS
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("overlay")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                (activeTab as string) === "overlay"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>3D Overlay</span>
            </button>

            <button
              onClick={() => setActiveTab("performance")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "performance"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>3D Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "logs"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Logs</span>
            </button>

            <button
              onClick={() => setActiveTab("agent")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "agent"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Agente Local</span>
            </button>

            <button
              onClick={() => setActiveTab("tiktok")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "tiktok"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Music2 className="w-4 h-4" />
              <span>TikTok LIVE</span>
            </button>
          </nav>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                obsStatus.streaming
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{obsStatus.streaming ? "LIVE" : "OFFLINE"}</span>
            </div>

            {tiktokConnected && (
              <div className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Music2 className="w-3.5 h-3.5" />
                <span>TikTok</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Top Grid: Avatar Preview + Stream Controls + Scene Switcher */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: 3D Avatar Stage Card */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">Miku 3D Avatar</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                      {emotion}
                    </span>
                  </div>
                </div>

                {/* Subtitle tabs to toggle between Canvas render & Sketchfab Embed */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setPreviewType("interactive")}
                    className={`flex-1 py-1 rounded-md font-bold transition cursor-pointer text-center ${
                      previewType === "interactive"
                        ? "bg-slate-850 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Render Interactivo
                  </button>
                  <button
                    onClick={() => setPreviewType("sketchfab")}
                    className={`flex-1 py-1 rounded-md font-bold transition cursor-pointer text-center ${
                      previewType === "sketchfab"
                        ? "bg-slate-850 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Modelo Sketchfab 3D
                  </button>
                </div>

                {/* Embedded Display Window */}
                <div className="relative w-full h-64 sm:h-72 bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                  {previewType === "interactive" ? (
                    <Overlay />
                  ) : (
                    <div className="w-full h-full flex flex-col p-1">
                      <iframe
                        title="Miku"
                        allowFullScreen
                        allow="autoplay; fullscreen; xr-spatial-tracking"
                        src="https://sketchfab.com/models/c6e868c0a00442419df5c4ab354378b2/embed?autostart=1"
                        className="w-full h-full rounded-lg border-0"
                      />
                      <p className="text-center mt-1 text-[11px] text-slate-400 font-normal">
                        <a
                          href="https://sketchfab.com/3d-models/miku-c6e868c0a00442419df5c4ab354378b2"
                          target="_blank"
                          rel="nofollow"
                          className="font-bold text-cyan-400 hover:underline"
                        >
                          Miku
                        </a>{" "}
                        by{" "}
                        <a
                          href="https://sketchfab.com/oscar3dmodel"
                          target="_blank"
                          rel="nofollow"
                          className="font-bold text-cyan-400 hover:underline"
                        >
                          雨宮レン
                        </a>{" "}
                        on{" "}
                        <a
                          href="https://sketchfab.com"
                          target="_blank"
                          rel="nofollow"
                          className="font-bold text-cyan-400 hover:underline"
                        >
                          Sketchfab
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Speech Activity Monitor */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSpeaking ? "bg-pink-500/20 text-pink-400 animate-bounce" : "bg-slate-800 text-slate-500"}`}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Última síntesis de voz (Gemini TTS)</p>
                    <p className="text-xs text-slate-200 truncate font-medium">"{latestSpeechText}"</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Controls & Scenes */}
              <div className="lg:col-span-7 space-y-6">
                <LiveControl />
                <SceneSelector />
              </div>
            </div>

            {/* Bottom Full Width: Chat Engine */}
            <div>
              <Chat />
            </div>
          </div>
        )}

        {activeTab === "logs" && <LogsView />}

        {activeTab === "performance" && <PerformanceView />}

        {activeTab === "agent" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <Settings className="w-6 h-6 text-cyan-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Configuración del Agente Local OBS</h2>
                  <p className="text-xs text-slate-400">
                    Conecta el servidor Cloud con tu PC local donde tienes OBS Studio abierto.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300">URL del Agente Local en tu PC:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agentUrl}
                    onChange={(e) => setAgentUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8787"
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                  />
                  <button
                    onClick={() => window.open(agentUrl, "_blank")}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" /> Probar Agente
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs space-y-2">
                <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> ¿Cómo agregar el Overlay 3D en OBS Studio?
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Abre OBS Studio en tu computadora.</li>
                  <li>Crea una nueva fuente de tipo <strong>Navegador (Browser Source)</strong>.</li>
                  <li>Configura la URL en OBS como: <code className="text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded">{window.location.origin}/overlay</code></li>
                  <li>Establece el tamaño en OBS: Ancho: <strong>1920</strong>, Alto: <strong>1080</strong>, FPS: <strong>60</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tiktok" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
              {/* Main title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <Music2 className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Integración de TikTok</h2>
                    <p className="text-xs text-slate-400">
                      Gestiona tu autenticación web o configura el SDK nativo para dispositivos Android.
                    </p>
                  </div>
                </div>
              </div>

              {/* Subtabs for Web & Android SDK */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 text-xs gap-1">
                <button
                  onClick={() => setTiktokSubTab("web")}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition cursor-pointer text-center flex items-center justify-center gap-2 ${
                    tiktokSubTab === "web"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Conexión Web (Login Kit)</span>
                </button>
                <button
                  onClick={() => setTiktokSubTab("android")}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition cursor-pointer text-center flex items-center justify-center gap-2 ${
                    tiktokSubTab === "android"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android Companion SDK</span>
                </button>
                <button
                  onClick={() => setTiktokSubTab("mockups")}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition cursor-pointer text-center flex items-center justify-center gap-2 ${
                    tiktokSubTab === "mockups"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Maquetas de UX (Revisión)</span>
                </button>
              </div>

              {tiktokSubTab === "web" && (
                <div className="space-y-4 text-xs text-slate-300">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <p className="font-bold text-cyan-300">Pasos para conectar tu cuenta:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Registra una aplicación en el portal de desarrolladores de TikTok.</li>
                      <li>Configura tu Client Key y Client Secret en tus secretos de entorno o `.env`.</li>
                      <li>Genera un código de autorización temporal para conectar el stream.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm block">Estado de Conexión TikTok</span>
                      <span className="text-slate-400 text-xs">
                        {tiktokConnected ? "Conectado a TikTok LIVE Room" : "Chat simulado en modo de demostración activo"}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-xs ${
                        tiktokConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      {tiktokConnected ? "● CONECTADO" : "MODO DEMO"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                      href="/api/tiktok/login"
                      className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-800 text-white font-bold transition shadow-md cursor-pointer text-center text-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1V14c0 3.76-2.13 7.04-5.59 8.52-3.46 1.48-7.55.93-10.45-1.4C1.69 18.77.34 14.54 1.17 10.48c.84-4.07 4.19-7.24 8.28-7.91V6.6c-2.11.35-3.81 1.94-4.22 4.02-.49 2.46.78 4.97 3.06 5.86 2.27.89 4.96-.03 6.13-2.19.26-.49.38-1.04.38-1.6V.02z"/>
                      </svg>
                      <span>CONECTAR CON TIKTOK (LOGIN KIT)</span>
                    </a>

                    {tiktokConnected && (
                      <a
                        href="/api/tiktok/logout"
                        className="flex items-center justify-center py-3 px-5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/30 border border-red-500/20 font-bold transition text-xs cursor-pointer text-center"
                      >
                        DESCONECTAR CUENTA
                      </a>
                    )}
                  </div>
                </div>
              )}

              {tiktokSubTab === "android" && (
                <div className="space-y-5 text-xs text-slate-300 animate-fadeIn">
                  {/* Android Quickstart Header */}
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-cyan-300 text-sm">TikTok OpenSDK para Android</span>
                      <a
                        href="https://github.com/tiktok/tiktok-opensdk-android.git"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold self-start"
                      >
                        Ver Repositorio GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      El SDK nativo de TikTok te permite integrar funcionalidades de Login y compartir contenido en tu aplicación de Android (API 21 o posterior).
                    </p>
                  </div>

                  {/* Step 1: App Settings & Fingerprints */}
                  <div className="space-y-3">
                    <p className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-mono text-[11px]">1</span>
                      Configuración de Firma de la App
                    </p>
                    <p className="text-slate-400 pl-6 leading-relaxed">
                      Deberás registrar las huellas digitales MD5 y SHA-256 en el portal de desarrolladores de TikTok. En el campo de firma de TikTok, elimina los dos puntos (:) de tu cadena MD5 para obtener una cadena de 32 caracteres.
                    </p>

                    <div className="pl-6 space-y-3">
                      <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                        <div className="bg-slate-900/60 border-b border-slate-800 px-3.5 py-2 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400">Usando Keytool</span>
                          <button
                            onClick={() => handleCopy("keytool -list -v -alias <your-key-name> -keystore <path-to-production-keystore>", "keytool")}
                            className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {copiedText === "keytool" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedText === "keytool" ? "Copiado" : "Copiar"}</span>
                          </button>
                        </div>
                        <pre className="notranslate p-3 font-mono text-[11px] text-slate-300 overflow-x-auto bg-slate-950 whitespace-pre-wrap" translate="no">
                          {`keytool -list -v -alias <your-key-name> -keystore <path-to-production-keystore>`}
                        </pre>
                      </div>

                      <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                        <div className="bg-slate-900/60 border-b border-slate-800 px-3.5 py-2 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400">Usando Reporte de Gradle</span>
                          <button
                            onClick={() => handleCopy("./gradlew signingReport", "gradlew")}
                            className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {copiedText === "gradlew" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedText === "gradlew" ? "Copiado" : "Copiar"}</span>
                          </button>
                        </div>
                        <pre className="notranslate p-3 font-mono text-[11px] text-slate-300 overflow-x-auto bg-slate-950" translate="no">
                          {`./gradlew signingReport`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Repositories & Dependencies */}
                  <div className="space-y-3">
                    <p className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-mono text-[11px]">2</span>
                      Instalación del SDK (build.gradle)
                    </p>
                    
                    <div className="pl-6 space-y-3">
                      <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                        <div className="bg-slate-900/60 border-b border-slate-800 px-3.5 py-2 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400">build.gradle (Proyecto - repositories)</span>
                          <button
                            onClick={() => handleCopy('repositories {\n    maven { url "https://artifact.bytedance.com/repository/AwemeOpenSDK" }\n}', "repo")}
                            className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {copiedText === "repo" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedText === "repo" ? "Copiado" : "Copiar"}</span>
                          </button>
                        </div>
                        <pre className="notranslate p-3 font-mono text-[11px] text-slate-300 overflow-x-auto bg-slate-950" translate="no">
                          {`repositories {\n    maven { url "https://artifact.bytedance.com/repository/AwemeOpenSDK" }\n}`}
                        </pre>
                      </div>

                      <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                        <div className="bg-slate-900/60 border-b border-slate-800 px-3.5 py-2 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400">build.gradle (Módulo: app - dependencies)</span>
                          <button
                            onClick={() => handleCopy("dependencies {\n    implementation 'com.tiktok.open.sdk:tiktok-open-sdk-core:latest.release'\n    implementation 'com.tiktok.open.sdk:tiktok-open-sdk-auth:latest.release'\n    implementation 'com.tiktok.open.sdk:tiktok-open-sdk-share:latest.release'\n}", "dep")}
                            className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {copiedText === "dep" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedText === "dep" ? "Copiado" : "Copiar"}</span>
                          </button>
                        </div>
                        <pre className="notranslate p-3 font-mono text-[11px] text-slate-300 overflow-x-auto bg-slate-950" translate="no">
                          {`dependencies {\n    implementation 'com.tiktok.open.sdk:tiktok-open-sdk-core:latest.release'\n    implementation 'com.tiktok.open.sdk:tiktok-open-sdk-auth:latest.release'\n    implementation 'com.tiktok.open.sdk:tiktok-open-sdk-share:latest.release'\n}`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Manifest queries for Android 11+ */}
                  <div className="space-y-3">
                    <p className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-mono text-[11px]">3</span>
                      Visibilidad del Paquete (Android 11+)
                    </p>
                    <p className="text-slate-400 pl-6 leading-relaxed">
                      Debido a las políticas de visibilidad de paquetes en Android 11 y posteriores, debes añadir los siguientes paquetes en tu archivo <code className="notranslate text-cyan-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800 font-mono text-[11px]" translate="no">AndroidManifest.xml</code>:
                    </p>

                    <div className="pl-6">
                      <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                        <div className="bg-slate-900/60 border-b border-slate-800 px-3.5 py-2 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400">AndroidManifest.xml</span>
                          <button
                            onClick={() => handleCopy('<queries>\n    <package android:name="com.zhiliaoapp.musically" />\n    <package android:name="com.ss.android.ugc.trill" />\n</queries>', "manifest")}
                            className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {copiedText === "manifest" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedText === "manifest" ? "Copiado" : "Copiar"}</span>
                          </button>
                        </div>
                        <pre className="notranslate p-3 font-mono text-[11px] text-slate-300 overflow-x-auto bg-slate-950" translate="no">
                          {`<queries>\n    <package android:name="com.zhiliaoapp.musically" />\n    <package android:name="com.ss.android.ugc.trill" />\n</queries>`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tiktokSubTab === "mockups" && (
                <div className="space-y-5 text-xs text-slate-300 animate-fadeIn">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                    <span className="font-bold text-cyan-300 text-sm block">Maquetas de UX para Revisión de TikTok</span>
                    <p className="text-slate-400 leading-relaxed">
                      TikTok requiere maquetas de alta fidelidad que muestren cómo tu aplicación integra su SDK y flujos de inicio de sesión/transmisión. Puedes descargar estas maquetas personalizadas para subirlas en el campo <strong className="text-slate-200 font-bold">"Sube maquetas de UX de alta fidelidad"</strong> en tu consola de desarrollador de TikTok.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mockup 1 */}
                    <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-white flex justify-between items-center">
                          <span>1. Flujo de Login de TikTok</span>
                          <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono font-normal">LOGIN KIT</span>
                        </div>
                        <div className="p-3 bg-slate-950 border-b border-slate-900 flex justify-center items-center">
                          <img
                            src="/tiktok_login_mockup.jpg"
                            alt="Mockup Login TikTok"
                            className="rounded border border-slate-800 w-full object-cover max-h-[180px] hover:opacity-95 transition"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="p-3 text-slate-400 leading-relaxed text-[11px]">
                          Muestra el panel de control de HECTRON Streamer Studio, el onboarding guiado paso a paso y el botón oficial de inicio de sesión de TikTok (Login Kit).
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900/40 border-t border-slate-900 flex gap-2">
                        <button
                          onClick={handleDownloadPDF1}
                          disabled={isDownloading1}
                          className="flex-1 py-2 text-center bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-700 text-slate-950 font-bold rounded transition text-xs shadow-md shadow-cyan-500/10 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isDownloading1 ? "Generando PDF..." : "Descargar PDF (Maqueta 1)"}
                        </button>
                      </div>
                    </div>

                    {/* Mockup 2 */}
                    <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-white flex justify-between items-center">
                          <span>2. Dashboard de Transmisión LIVE</span>
                          <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono font-normal">REAL-TIME SYNC</span>
                        </div>
                        <div className="p-3 bg-slate-950 border-b border-slate-900 flex justify-center items-center">
                          <img
                            src="/tiktok_live_dashboard.jpg"
                            alt="Mockup TikTok LIVE"
                            className="rounded border border-slate-800 w-full object-cover max-h-[180px] hover:opacity-95 transition"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="p-3 text-slate-400 leading-relaxed text-[11px]">
                          Muestra la consola del streamer en tiempo real con el avatar de IA 3D, chat de TikTok sincronizado, regalos en tiempo real, logs de voz TTS y terminal de control.
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900/40 border-t border-slate-900 flex gap-2">
                        <button
                          onClick={handleDownloadPDF2}
                          disabled={isDownloading2}
                          className="flex-1 py-2 text-center bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-700 text-slate-950 font-bold rounded transition text-xs shadow-md shadow-cyan-500/10 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isDownloading2 ? "Generando PDF..." : "Descargar PDF (Maqueta 2)"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        <p>HECTRON Autonomous Streamer Studio v3.2 • Powered by Gemini AI & Three.js 3D Miku</p>
      </footer>
    </div>
  );
}

