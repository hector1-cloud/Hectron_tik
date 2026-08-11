import { useContext } from "react";
import { BrainContext } from "./BrainContext";
import { LiveControl } from "./components/LiveControl";
import { SceneSelector } from "./components/SceneSelector";
import { Chat } from "./components/Chat";
import { Overlay } from "./components/Overlay";
import { LogsView } from "./components/LogsView";
import { PerformanceView } from "./components/PerformanceView";
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
} from "lucide-react";

export default function App() {
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
                    <span className="text-sm font-bold text-white">3D Avatar Miku (Preview)</span>
                  </div>

                  <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full font-bold">
                    {emotion}
                  </span>
                </div>

                {/* Embedded Overlay Window */}
                <div className="relative w-full h-64 sm:h-72 bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                  <Overlay />
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <Music2 className="w-6 h-6 text-cyan-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Integración con TikTok LIVE API</h2>
                  <p className="text-xs text-slate-400">
                    Sincroniza los mensajes de tus espectadores de TikTok en tiempo real con Miku.
                  </p>
                </div>
              </div>

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
              </div>
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

