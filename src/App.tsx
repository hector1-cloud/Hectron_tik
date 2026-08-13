import { useContext, useState, useEffect } from "react";
import { testFirestoreConnection } from "./lib/firebase";
import { BrainContext } from "./BrainContext";
import { LiveControl } from "./components/LiveControl";
import { SceneSelector } from "./components/SceneSelector";
import { Chat } from "./components/Chat";
import { Overlay } from "./components/Overlay";
import { LogsView } from "./components/LogsView";
import { PerformanceView } from "./components/PerformanceView";
import { AutonomyMetricsView } from "./components/AutonomyMetricsView";
import { AndroidFirebaseValidator } from "./components/AndroidFirebaseValidator";
import { TiktokDnsGuide } from "./components/TiktokDnsGuide";
import { TiktokTokenExchange } from "./components/TiktokTokenExchange";
import { WorkersAiRunner } from "./components/WorkersAiRunner";
import { CloudflareWorkflowsRunner } from "./components/CloudflareWorkflowsRunner";
import { jsPDF } from "jspdf";
import {
  Mic,
  Tv,
  Radio,
  Settings,
  Music2,
  Database,
  Sparkles,
  GitFork,
  ExternalLink,
  Bot,
  Volume2,
  Cpu,
  HelpCircle,
  Terminal,
  Activity,
  Smartphone,
  Globe,
  Copy,
  Check,
  Image,
  AlertTriangle,
  CheckCircle2,
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
  const [tiktokSubTab, setTiktokSubTab] = useState<"web" | "dns" | "android" | "mockups">("web");
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
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [842, 595]
      });

      // Background Slate-950
      doc.setFillColor(9, 15, 29);
      doc.rect(0, 0, 842, 595, "F");

      // Header Banner
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, 842, 80, "F");
      // Accent line
      doc.setFillColor(6, 182, 212);
      doc.rect(0, 78, 842, 2, "F");

      // Title
      doc.setTextColor(6, 182, 212);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("HECTRON STREAMER STUDIO", 40, 35);

      // Subtitle
      doc.setTextColor(229, 231, 235);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("TikTok Integration - User Authorization Flow (UX Mockup)", 40, 55);

      // Status Badge
      doc.setFillColor(16, 185, 129);
      doc.rect(700, 25, 100, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("HIGH-FIDELITY", 712, 39);

      // Left Column - App metadata
      doc.setFillColor(17, 24, 39);
      doc.setDrawColor(31, 41, 55);
      doc.rect(40, 110, 340, 420, "FD");

      doc.setTextColor(6, 182, 212);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("1. INFORMACIÓN DE LA APLICACIÓN", 60, 140);

      doc.setTextColor(209, 213, 219);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      let y = 170;
      const lines = [
        "Nombre: HECTRON Streamer Studio",
        "Client Key: awvckv5za3nclqpe",
        "Redirect URI: https://hectron-streamer-studio-570399074846.us-east1.run.app/api/tiktok/callback",
        "",
        "ÁMBITOS SOLICITADOS (SCOPES):",
        "• user.info.basic (Información de Perfil)",
        "",
        "DESCRIPCIÓN DEL FLUJO DE AUTORIZACIÓN:",
        "Este mockup de alta fidelidad demuestra cómo la",
        "aplicación inicia la conexión segura con TikTok LIVE.",
        "El streamer hace clic en 'Conectar TikTok' en el panel",
        "de HECTRON, lo cual abre la ventana de autorización",
        "oficial de TikTok.",
        "",
        "Una vez autorizado, el servidor recibe el código de",
        "acceso para iniciar la sincronización de comentarios",
        "y regalos del directo en tiempo real."
      ];
      
      lines.forEach(line => {
        if (line.startsWith("•") || line.startsWith("Nombre:") || line.startsWith("Client Key:") || line.startsWith("Redirect URI:") || line.startsWith("ÁMBITOS")) {
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFont("helvetica", "normal");
        }
        doc.text(line, 60, y);
        y += 18;
      });

      // Right Column - Simulated Phone Authorization Window
      doc.setFillColor(17, 24, 39);
      doc.setDrawColor(31, 41, 55);
      doc.rect(420, 110, 380, 420, "FD");

      // Phone body outer
      doc.setFillColor(3, 7, 18);
      doc.setDrawColor(75, 85, 99);
      doc.rect(470, 130, 280, 380, "FD");

      // Phone screen header
      doc.setFillColor(17, 24, 39);
      doc.rect(470, 130, 280, 40, "F");
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("tiktok.com/v2/auth/authorize", 485, 154);

      // Close button indicator
      doc.setDrawColor(156, 163, 175);
      doc.line(725, 148, 735, 156);
      doc.line(735, 148, 725, 156);

      // Auth content inside phone
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Autorizar HECTRON Studio", 520, 210);

      // App icons connector
      // TikTok Circle
      doc.setFillColor(254, 44, 85);
      doc.circle(570, 255, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("d", 567, 260); // Simulated TikTok logo symbol

      // Link indicator
      doc.setDrawColor(6, 182, 212);
      doc.line(595, 255, 625, 255);

      // App Circle
      doc.setFillColor(6, 182, 212);
      doc.circle(650, 255, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("H", 646, 260);

      // Permissions bullet
      doc.setTextColor(209, 213, 219);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Esta aplicación solicita permiso para:", 500, 310);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("• Acceder a tu información básica de perfil", 500, 330);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(8);
      doc.text("(Nombre de usuario, foto de perfil y display name)", 510, 342);

      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text("Al hacer clic en Autorizar, aceptas compartir", 500, 380);
      doc.text("esta información según nuestros términos.", 500, 392);

      // Red-pink TikTok Authorize Button
      doc.setFillColor(254, 44, 85);
      doc.rect(500, 415, 220, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Autorizar", 590, 434);

      // Cancel Button
      doc.setFillColor(31, 41, 55);
      doc.rect(500, 455, 220, 32, "F");
      doc.setTextColor(209, 213, 219);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Cancelar", 592, 474);

      // Footer
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 560, 842, 35, "F");
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("CONFIDENTIAL UX DESIGN PROPOSAL FOR TIKTOK DEVELOPER REVIEW • © 2026 HECTRON STUDIO", 190, 582);

      doc.save("HECTRON_TikTok_Login_Mockup.pdf");
    } catch (err) {
      console.error("Error generating PDF 1", err);
    } finally {
      setIsDownloading1(false);
    }
  };

  const handleDownloadPDF2 = async () => {
    setIsDownloading2(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [842, 595]
      });

      // Background Slate-950
      doc.setFillColor(9, 15, 29);
      doc.rect(0, 0, 842, 595, "F");

      // Header Banner
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, 842, 80, "F");
      // Accent line
      doc.setFillColor(6, 182, 212);
      doc.rect(0, 78, 842, 2, "F");

      // Title
      doc.setTextColor(6, 182, 212);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("HECTRON STREAMER STUDIO", 40, 35);

      // Subtitle
      doc.setTextColor(229, 231, 235);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("TikTok LIVE Dashboard - Real-Time Interface (UX Mockup)", 40, 55);

      // Status Badge
      doc.setFillColor(16, 185, 129);
      doc.rect(700, 25, 100, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("HIGH-FIDELITY", 712, 39);

      // Panel 1: Left - AI Avatar Voice Preview
      doc.setFillColor(17, 24, 39);
      doc.setDrawColor(31, 41, 55);
      doc.rect(40, 110, 240, 420, "FD");

      doc.setTextColor(6, 182, 212);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("AVATAR DE IA 3D", 55, 135);

      // LIVE indicator
      doc.setFillColor(239, 68, 68);
      doc.rect(205, 125, 60, 16, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("● EN VIVO", 213, 136);

      // Simulated Avatar circle
      doc.setFillColor(31, 41, 55);
      doc.setDrawColor(6, 182, 212);
      doc.circle(160, 250, 60, "FD");
      
      // Face indicator
      doc.setTextColor(6, 182, 212);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(36);
      doc.text("🤖", 143, 262);

      // Under-avatar info
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("Estado: Hablando...", 110, 340);
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.text("Voz: Hectron-Latino AI", 100, 360);

      // Soundwaves
      doc.setDrawColor(6, 182, 212);
      doc.setLineWidth(2);
      for (let i = 0; i < 15; i++) {
        const h = 10 + Math.sin(i * 0.8) * 20;
        doc.line(75 + i * 11, 420 - h/2, 75 + i * 11, 420 + h/2);
      }
      doc.setLineWidth(1);

      // Panel 2: Center - Chat de TikTok en Vivo
      doc.setFillColor(17, 24, 39);
      doc.setDrawColor(31, 41, 55);
      doc.rect(300, 110, 260, 420, "FD");

      doc.setTextColor(6, 182, 212);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("CHAT DE TIKTOK LIVE", 315, 135);

      // Chat list
      let chatY = 170;
      const chatItems = [
        { user: "alberto92", msg: "¡Hectron, eres el mejor streamer de IA! 🔥", color: [34, 197, 94] },
        { user: "sofia_stream", msg: "Envió Regalo: Rosa x5! 🌹", color: [244, 63, 94] },
        { user: "hector_fans", msg: "¡Sube el volumen del avatar!", color: [59, 130, 246] },
        { user: "marcos_v", msg: "Nuevo seguidor en directo 💖", color: [168, 85, 247] },
        { user: "ana_k", msg: "Hectron responde a mi pregunta de antes...", color: [34, 197, 94] }
      ];

      chatItems.forEach(item => {
        // Chat item background
        doc.setFillColor(31, 41, 55);
        doc.rect(315, chatY, 230, 55, "F");

        // Username
        doc.setTextColor(item.color[0], item.color[1], item.color[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`@${item.user}`, 325, chatY + 18);

        // Message
        doc.setTextColor(229, 231, 235);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(item.msg, 325, chatY + 35);

        chatY += 65;
      });

      // Panel 3: Right - Logs del Sintetizador / Consola
      doc.setFillColor(17, 24, 39);
      doc.setDrawColor(31, 41, 55);
      doc.rect(580, 110, 220, 420, "FD");

      doc.setTextColor(6, 182, 212);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("CONSOLA DEL SISTEMA", 595, 135);

      // Terminal logs
      doc.setFillColor(3, 7, 18);
      doc.rect(595, 160, 190, 340, "F");

      doc.setTextColor(34, 197, 94);
      doc.setFont("courier", "bold");
      doc.setFontSize(8);

      let logY = 185;
      const logLines = [
        "[SYSTEM] Boot sequence OK",
        "[OBS] Scene switched to 'CHAT'",
        "[TIKTOK] Room connection open",
        "[TIKTOK] Room ID: 74210984711",
        "",
        "[EVENT] Gift received!",
        "User: @sofia_stream",
        "Gift: 5x Rose 🌹",
        "[AI] Triggering 'EXCITED' face",
        "[TTS] Synthesizing speech...",
        "\"Muchas gracias @sofia_stream",
        "por las rosas! Me alegra\"",
        "",
        "[EVENT] Follow received!",
        "User: @marcos_v",
        "[AI] Triggering 'HAPPY' face",
        "[TTS] Synthesizing speech..."
      ];

      logLines.forEach(line => {
        if (line.includes("[EVENT]") || line.includes("[AI]")) {
          doc.setTextColor(234, 179, 8); // Yellow
        } else if (line.includes("[TTS]")) {
          doc.setTextColor(6, 182, 212); // Cyan
        } else {
          doc.setTextColor(34, 197, 94); // Green
        }
        doc.text(line, 605, logY);
        logY += 15;
      });

      // Footer
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 560, 842, 35, "F");
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("CONFIDENTIAL UX DESIGN PROPOSAL FOR TIKTOK DEVELOPER REVIEW • © 2026 HECTRON STUDIO", 190, 582);

      doc.save("HECTRON_TikTok_Live_Mockup.pdf");
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

  const [tiktokError, setTiktokError] = useState<string | null>(null);
  const [tiktokSuccess, setTiktokSuccess] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    redirectUri: string;
    hostMatches: boolean;
    currentHost: string;
    configuredRedirect: string;
    suggestedRedirect: string;
  } | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Helper para espera de tiempo (delay)
  const waitMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Lógica de reintento exponencial (exponential backoff) para peticiones a endpoints
  const fetchWithBackoff = async (url: string, options: RequestInit = {}, maxRetries = 3, initialDelay = 1000): Promise<Response> => {
    let attempt = 0;
    while (true) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (err) {
        attempt++;
        if (attempt > maxRetries) {
          throw err;
        }
        const backoffDelay = initialDelay * Math.pow(2, attempt);
        console.warn(`[TikTok Retry] Intento ${attempt} fallido para ${url}. Reintentando en ${backoffDelay}ms...`, err);
        await waitMs(backoffDelay);
      }
    }
  };

  const runTiktokDiagnostics = async () => {
    setIsDiagnosing(true);
    try {
      // Conexión resiliente usando nuestra lógica de reintento exponencial
      const res = await fetchWithBackoff("/api/tiktok/inspect");
      if (res.ok) {
        const payload = await res.json();
        const configuredRedirect = payload.data.redirectUri;
        
        // Comparación dinámica de la URL actual de la aplicación (window.location.href) con REDIRECT_URI
        const currentUrl = window.location.href;
        const currentOrigin = new URL(currentUrl).origin;
        
        const parsedRedirect = new URL(configuredRedirect);
        const redirectOrigin = parsedRedirect.origin;
        const hostMatches = redirectOrigin === currentOrigin;

        setDiagnosticResult({
          redirectUri: configuredRedirect,
          hostMatches,
          currentHost: currentOrigin,
          configuredRedirect,
          suggestedRedirect: `${currentOrigin}/api/tiktok/callback`
        });
      }
    } catch (err) {
      console.error("Failed to run diagnostics after backoff retries:", err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tiktok_logout") === "true") {
      localStorage.removeItem("hectron_tiktok_code");
      // Clean up URL parameters cleanly
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    const errParam = params.get("tiktok_error");
    if (errParam) {
      setTiktokError(decodeURIComponent(errParam));
      // Clean up URL parameters cleanly
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const successParam = params.get("tiktok_success");
    if (successParam === "true") {
      setTiktokSuccess(true);
      // Clean up URL parameters cleanly
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Run diagnostics immediately to help user
    runTiktokDiagnostics();
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
              onClick={() => setActiveTab("autonomy" as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                (activeTab as string) === "autonomy"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Autonomía & BigQuery</span>
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

            <button
              onClick={() => setActiveTab("workers-ai")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "workers-ai"
                  ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Workers AI</span>
            </button>

            <button
              onClick={() => setActiveTab("workflows")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "workflows"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>Workflows</span>
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

        {(activeTab as string) === "autonomy" && (
          <div className="max-w-7xl mx-auto">
            <AutonomyMetricsView />
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

              {/* Subtabs for Web, DNS Verification, Android SDK & Mockups */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 text-xs gap-1">
                <button
                  onClick={() => setTiktokSubTab("web")}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    tiktokSubTab === "web"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Conexión Web</span>
                </button>
                <button
                  onClick={() => setTiktokSubTab("dns")}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    tiktokSubTab === "dns"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Verificación DNS TXT</span>
                </button>
                <button
                  onClick={() => setTiktokSubTab("android")}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    tiktokSubTab === "android"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android SDK</span>
                </button>
                <button
                  onClick={() => setTiktokSubTab("mockups")}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    tiktokSubTab === "mockups"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Maquetas UX</span>
                </button>
              </div>

              {tiktokSubTab === "dns" && (
                <div className="animate-fadeIn">
                  <TiktokDnsGuide />
                </div>
              )}

              {tiktokSubTab === "web" && (
                <div className="space-y-4 text-xs text-slate-300">
                  {/* Primary TikTok OAuth Login Button Card (PKCE Standard) */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/30 space-y-3.5 shadow-lg relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">TikTok Login Kit for Web/Desktop</span>
                          <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 font-mono text-[10px] rounded border border-cyan-500/30">
                            PKCE (S256) Activo
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">
                          Inicia sesión con tu cuenta de TikTok mediante el flujo seguro con Proof Key for Code Exchange (PKCE).
                        </p>
                      </div>

                      <a
                        href="/api/tiktok/login"
                        className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-lg transition-all shadow-lg shadow-cyan-500/20 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer border border-cyan-300/40 shrink-0"
                      >
                        <Music2 className="w-4 h-4 text-slate-950" />
                        <span>Continue with TikTok</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                      </a>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                      <div className="text-slate-400 font-sans font-bold flex items-center gap-1.5 text-xs text-cyan-300 border-b border-slate-800 pb-1.5 mb-2">
                        <span>Parámetros de Integración Real (TikTok Developers)</span>
                      </div>
                      <div><span className="text-slate-500">Client Key:</span> <code className="text-cyan-300">awvckv5za3nclqpe</code></div>
                      <div><span className="text-slate-500">Scope:</span> <code className="text-emerald-400">user.info.basic</code></div>
                      <div><span className="text-slate-500">Redirect URI:</span> <code className="text-cyan-300">{window.location.origin}/api/tiktok/callback</code></div>
                      <div><span className="text-slate-500">Challenge Method:</span> <code className="text-cyan-300">S256 (SHA-256 Hex)</code></div>
                    </div>
                  </div>

                  {/* OAuth Handshake Error / Success Alerts */}
                  {tiktokError && (
                    <div className="bg-red-950/50 border border-red-500/40 p-4 rounded-lg space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Fallo en Autorización de TikTok (OAuth Handshake)</span>
                      </div>
                      <p className="text-slate-300">
                        Se devolvió el siguiente código de error durante el inicio de sesión seguro:
                      </p>
                      <div className="bg-slate-950/60 p-2.5 rounded font-mono text-[11px] text-red-300 border border-red-950/80">
                        Código de Error: <strong className="text-red-400">{tiktokError}</strong>
                      </div>
                      <div className="text-slate-400 leading-relaxed text-[11px] space-y-1">
                        <p className="font-semibold text-slate-300">¿Cómo solucionar el error "{tiktokError}"?</p>
                        {tiktokError.includes("unauthorized_client") ? (
                          <p>
                            Este error ocurre porque la URL desde la que intentas conectar no coincide exactamente con los <strong>Redirect URIs</strong> registrados en tu panel de TikTok Developers, o bien la aplicación se encuentra en modo Sandbox/Staging y tu cuenta de TikTok no ha sido agregada como una cuenta de prueba (Tester Account).
                          </p>
                        ) : (
                          <p>
                            Verifica que las credenciales (Client Key y Client Secret) de TikTok Developers estén configuradas correctamente en los secretos de tu entorno y que la cuenta de usuario tenga los permisos de perfil aprobados.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {tiktokSuccess && (
                    <div className="bg-emerald-950/50 border border-emerald-500/40 p-4 rounded-lg flex items-center gap-3 text-emerald-400 animate-fadeIn">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-sm block">Conexión Completada</span>
                        <span className="text-slate-300 text-xs">Tu cuenta de TikTok se ha vinculado de manera oficial mediante Login Kit.</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <p className="font-bold text-cyan-300">Pasos para conectar tu cuenta:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Registra una aplicación en el portal de desarrolladores de TikTok.</li>
                      <li>Configura tu Client Key y Client Secret en tus secretos de entorno o `.env`.</li>
                      <li>Verifica la propiedad de tu dominio ante TikTok mediante el registro DNS TXT.</li>
                    </ul>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Verificación de sitio en TikTok (hekron-tik.vercel.app)</span>
                      </span>
                      <button
                        onClick={() => setTiktokSubTab("dns")}
                        className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                      >
                        <span>Ver Guía DNS Completa</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Robust Exponential Backoff Token Exchange Engine */}
                  <TiktokTokenExchange />

                  {/* Redirection Diagnostic Tool */}
                  <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-lg space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white text-xs">🩺 Validador de Redirección (OAuth Diagnostic Matcher)</span>
                      </div>
                      <button
                        onClick={runTiktokDiagnostics}
                        disabled={isDiagnosing}
                        className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-500/20 text-[10px] rounded font-bold cursor-pointer transition flex items-center gap-1"
                      >
                        {isDiagnosing ? "Analizando..." : "Ejecutar Análisis"}
                      </button>
                    </div>

                    {diagnosticResult ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Host de Origen (Navegador)</span>
                            <span className="font-mono text-[11px] text-white block mt-1 truncate">{diagnosticResult.currentHost}</span>
                          </div>
                          <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Redirect URI Configurado (Filtro)</span>
                            <span className="font-mono text-[11px] text-white block mt-1 truncate">{diagnosticResult.redirectUri}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 p-2.5 rounded border text-[11px] font-semibold bg-slate-900/30 border-slate-850">
                          {diagnosticResult.hostMatches ? (
                            <>
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                              <span className="text-emerald-400">✅ COINCIDENCIA CORRECTA: Las direcciones del handshake concuerdan.</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                              <span className="text-red-400">❌ ALERTA DE DISCREPANCIA: El redirect_uri configurado no coincide con tu host actual.</span>
                            </>
                          )}
                        </div>

                        {!diagnosticResult.hostMatches && (
                          <div className="bg-red-950/20 border border-red-900/40 p-3 rounded text-[11px] text-slate-300 leading-relaxed space-y-1.5">
                            <p className="font-bold text-red-400">¿Por qué es crítico solucionar esto?</p>
                            <p>
                              Para evitar el error de cliente no autorizado (<strong>unauthorized_client</strong>), la consola de desarrollador de TikTok requiere que registres exactamente esta dirección en tu panel de control de desarrolladores:
                            </p>
                            <div className="bg-slate-950/80 p-2 rounded font-mono text-[10px] text-cyan-300 select-all border border-red-950/60 overflow-x-auto">
                              {diagnosticResult.suggestedRedirect}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-[11px]">No se han cargado datos de diagnóstico. Haz clic en "Ejecutar Análisis" para iniciar.</p>
                    )}
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

                  {diagnosticResult && !diagnosticResult.hostMatches && (
                    <div className="bg-red-950/40 border border-red-500/30 p-3.5 rounded-lg flex items-start gap-3 text-xs text-red-300">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-red-200">⚠️ Discrepancia de Redirección Detectada</p>
                        <p className="text-slate-300 leading-relaxed">
                          La URL de tu navegador actual (<span className="font-mono text-white">{window.location.href}</span>) no coincide con el host registrado de tu <span className="font-mono text-cyan-300">REDIRECT_URI</span> en el servidor (<span className="font-mono text-white">{diagnosticResult.redirectUri}</span>). 
                          El intento de inicio de sesión de TikTok fallará con el error <strong className="text-red-400">unauthorized_client</strong>. 
                        </p>
                        <p className="text-[11px] text-red-300 font-semibold">
                          Por favor, configura tu URL correcta en el portal de TikTok Developers antes de conectar, o usa el dominio correcto de redirección.
                        </p>
                      </div>
                    </div>
                  )}

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
                  {/* Validation Component for Android SDK & Firebase google-services.json */}
                  <AndroidFirebaseValidator />

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

        {activeTab === "workers-ai" && <WorkersAiRunner />}
        {activeTab === "workflows" && <CloudflareWorkflowsRunner />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        <p>HECTRON Autonomous Streamer Studio v3.2 • Powered by Gemini AI & Three.js 3D Miku</p>
      </footer>
    </div>
  );
}

