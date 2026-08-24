import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Play,
  ShieldCheck,
  Cpu,
  Layers,
  Code2,
  CheckCircle2,
  AlertCircle,
  Volume2,
  MessageSquare,
  UserCheck
} from "lucide-react";
import { DuixCreateAvatarRequest, DuixCreateAvatarResponse } from "../types";

export function DuixAvatarStudio() {
  const [token, setToken] = useState(
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcHBJZCI6IjE1MzYyNTQ5NDY1ODcwNTQwODAiLCJleHAiOjE3ODc1NTgyMzEsImlhdCI6MTc4NzU1MTAzMX0.nzfILIrLvVbLkboSMquQR2lJ1JA8Kb8ycWEwWQUS-Fo"
  );
  const [conversationId, setConversationId] = useState("1967895167468535809");
  const [ttsName, setTtsName] = useState("Marin");
  const [name, setName] = useState("Jane");
  const [greetings, setGreetings] = useState("Is there anything I can help you?");
  const [profile, setProfile] = useState("You are an AI avatar created by Duix API");

  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<any[]>([]);
  const [activePreset, setActivePreset] = useState<string>("jane");
  const [previewSpeaking, setPreviewSpeaking] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/duix/status");
      if (res.ok) {
        const data = await res.json();
        setApiStatus(data);
      }
    } catch (e) {
      console.error("Error fetching Duix status", e);
    }
  };

  const fetchAvatars = async () => {
    try {
      const res = await fetch("/api/duix/avatars");
      if (res.ok) {
        const data = await res.json();
        setAvatars(data.avatars || []);
      }
    } catch (e) {
      console.error("Error fetching Duix avatars", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchAvatars();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === "jane") {
      setConversationId("1967895167468535809");
      setTtsName("Marin");
      setName("Jane");
      setGreetings("Is there anything I can help you?");
      setProfile("You are an AI avatar created by Duix API");
    } else if (presetKey === "miku") {
      setConversationId("1967895167468535809");
      setTtsName("Marin");
      setName("Hectron Miku");
      setGreetings("¡Hola a todos! Bienvenidos al stream en vivo de TikTok LIVE 💙✨");
      setProfile("Eres HECTRON Miku, streamer virtual carismática con estética anime y voz dulce.");
    } else if (presetKey === "hector") {
      setConversationId("1967895167468535809");
      setTtsName("David");
      setName("Hector Abadalabs");
      setGreetings("Saludos. Bienvenido a la plataforma empresarial de Abadalabs.");
      setProfile("Eres el Copiloto Ejecutivo de Abadalabs especializado en automatizaciones e IA.");
    }
  };

  const handleCreateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLastResponse(null);

    const payload: DuixCreateAvatarRequest = {
      conversationId: conversationId.trim(),
      ttsName: ttsName.trim(),
      name: name.trim(),
      greetings: greetings.trim(),
      profile: profile.trim(),
    };

    try {
      const res = await fetch("/api/duix/avatar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, token: token.trim() }),
      });

      const data = await res.json();
      setLastResponse(data);
      await fetchAvatars();
      await fetchStatus();
    } catch (err: any) {
      setLastResponse({
        ok: false,
        error: err?.message || "Error al conectar con el servidor",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const curlExample = `curl --request POST \\
    --url https://app.duix.ai/duix-openapi-v2/sdk/v2/createAvatar \\
    --header "Content-Type:application/json" \\
    --header "token: ${token}"\\
    --data '{
   	  "conversationId": "${conversationId}",
   	  "ttsName": "${ttsName}",
   	  "name": "${name}",
   	  "greetings": "${greetings}",
   	  "profile": "${profile}"
    }'`;

  const speakGreeting = (text: string, id: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.pitch = 1.1;
      utterance.rate = 1.0;
      setPreviewSpeaking(id);
      utterance.onend = () => setPreviewSpeaking(null);
      utterance.onerror = () => setPreviewSpeaking(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/80 p-6 rounded-2xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 bg-indigo-500/20 border border-indigo-400/40 rounded-xl text-indigo-400">
                <Bot className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                DUIX Open API v2 Studio
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  createAvatar
                </span>
              </h2>
            </div>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Integración oficial con la plataforma de avatares digitales interactivos <strong className="text-indigo-300">Duix AI</strong> (Base URL: <code className="text-cyan-300">https://app.duix.ai</code>). Crea, configura y genera avatares inteligentes con síntesis de voz y animaciones neuronales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchStatus();
                fetchAvatars();
              }}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar Estado</span>
            </button>
            <a
              href="https://app.duix.ai"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Portal Duix.ai</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Token & Diagnostics / Preset selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Card & API Specs */}
        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Credenciales Duix API (JWT)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Activo
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Token de Autenticación (`token` Header):</span>
              <button
                onClick={() => handleCopy(token, "token_header")}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "token_header" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === "token_header" ? "Copiado" : "Copiar"}
              </button>
            </label>
            <textarea
              rows={3}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2.5 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
              placeholder="Pega tu token JWT de Duix AI..."
            />
          </div>

          {/* Decoded Token Details */}
          {apiStatus?.tokenPayload && (
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1.5 font-mono text-[11px]">
              <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                Metadatos del Token JWT
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">App ID:</span>
                <span className="text-indigo-300">{apiStatus.tokenPayload.appId || "1536254946587054080"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiración:</span>
                <span className="text-emerald-400">
                  {apiStatus.tokenPayload.exp ? new Date(apiStatus.tokenPayload.exp * 1000).toLocaleString() : "Sin exp"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Emitido:</span>
                <span className="text-slate-300">
                  {apiStatus.tokenPayload.iat ? new Date(apiStatus.tokenPayload.iat * 1000).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>
          )}

          {/* Endpoint Details */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1 text-slate-300">
            <div><span className="text-slate-500">Base URL:</span> <span className="text-cyan-300">https://app.duix.ai</span></div>
            <div><span className="text-slate-500">Endpoint:</span> <span className="text-emerald-400">/duix-openapi-v2/sdk/v2/createAvatar</span></div>
            <div><span className="text-slate-500">Method:</span> <span className="text-amber-400 font-bold">POST</span></div>
          </div>
        </div>

        {/* Creator Form */}
        <div className="lg:col-span-2 bg-slate-900/90 p-6 rounded-xl border border-slate-800 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Configuración de Nuevo Avatar (Paso 2: Post Duix)</span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">Plantillas:</span>
              <button
                type="button"
                onClick={() => applyPreset("jane")}
                className={`px-2.5 py-1 text-xs rounded-md transition font-medium cursor-pointer ${
                  activePreset === "jane"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Jane (Oficial)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("miku")}
                className={`px-2.5 py-1 text-xs rounded-md transition font-medium cursor-pointer ${
                  activePreset === "miku"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Miku Streamer
              </button>
              <button
                type="button"
                onClick={() => applyPreset("hector")}
                className={`px-2.5 py-1 text-xs rounded-md transition font-medium cursor-pointer ${
                  activePreset === "hector"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Hector Copilot
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateAvatar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  conversationId
                </label>
                <input
                  type="text"
                  value={conversationId}
                  onChange={(e) => setConversationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ttsName (Voz)
                </label>
                <select
                  value={ttsName}
                  onChange={(e) => setTtsName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Marin">Marin (Default)</option>
                  <option value="Jane">Jane</option>
                  <option value="David">David</option>
                  <option value="Emma">Emma</option>
                  <option value="Miku">Miku</option>
                  <option value="Abadalabs_Hector">Abadalabs_Hector</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  name (Nombre del Avatar)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                greetings (Mensaje de Saludo Inicial)
              </label>
              <input
                type="text"
                value={greetings}
                onChange={(e) => setGreetings(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                profile (Personalidad & Prompt del Sistema)
              </label>
              <textarea
                rows={2}
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Petición enviada mediante el gateway proxy seguro de Abadalabs</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creando en Duix...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Crear Avatar con Duix API (POST)</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Last Response Alert */}
          {lastResponse && (
            <div
              className={`p-4 rounded-xl border space-y-2 animate-fadeIn ${
                lastResponse.success || lastResponse.ok
                  ? "bg-indigo-950/40 border-indigo-500/40 text-indigo-200"
                  : "bg-amber-950/40 border-amber-500/40 text-amber-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  {lastResponse.success || lastResponse.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{lastResponse.message || "Resultado de la solicitud Duix API"}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                  HTTP {lastResponse.httpStatus || 200}
                </span>
              </div>

              <pre className="bg-slate-950/90 p-2.5 rounded font-mono text-[11px] overflow-x-auto text-cyan-300 border border-slate-800/80 max-h-40">
                {JSON.stringify(lastResponse.data || lastResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Curl & Integration Code Snippet */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Comando cURL Exacto (Paso 2: Duix OpenAPI v2)</span>
          </div>

          <button
            onClick={() => handleCopy(curlExample, "curl_snippet")}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedKey === "curl_snippet" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar cURL</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-cyan-300 overflow-x-auto border border-slate-800 leading-relaxed">
            {curlExample}
          </pre>
        </div>
      </div>

      {/* Roster of Duix Avatars */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Avatares Registrados en la Sesión ({avatars.length})</span>
          </div>
          <span className="text-xs text-slate-400">Sincronizado con WebSocket en tiempo real</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {avatars.map((av) => (
            <div
              key={av.id}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition space-y-3 relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    {av.name}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {av.ttsName}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Conv ID: {av.conversationId}
                  </p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 italic">
                "{av.greetings}"
              </div>

              <div className="text-[11px] text-slate-400 line-clamp-2">
                <strong className="text-slate-300 font-semibold">Perfil:</strong> {av.profile}
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                <button
                  onClick={() => speakGreeting(av.greetings, av.id)}
                  className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${previewSpeaking === av.id ? "animate-bounce text-indigo-300" : ""}`} />
                  <span>{previewSpeaking === av.id ? "Reproduciendo..." : "Probar Voz"}</span>
                </button>

                <span className="text-[10px] text-slate-500">
                  {new Date(av.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
