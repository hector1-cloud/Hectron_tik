import React, { useState } from "react";
import {
  ShieldCheck,
  Key,
  Globe,
  Radio,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Terminal,
  ExternalLink,
  Zap,
  Server
} from "lucide-react";

interface StreamerBotAuthConfigProps {
  wsUrl: string;
  setWsUrl: (url: string) => void;
  isConnected: boolean;
  onLog?: (type: "IN" | "OUT" | "INFO" | "ERROR", msg: string) => void;
}

export function StreamerBotAuthConfig({
  wsUrl,
  setWsUrl,
  isConnected,
  onLog
}: StreamerBotAuthConfigProps) {
  // Authentication State
  const [authPassword, setAuthPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [webhookSecret, setWebhookSecret] = useState<string>("hectron_sb_sec_994827104928");
  const [outboundWebhookUrl, setOutboundWebhookUrl] = useState<string>("http://127.0.0.1:8080/webhook");
  const [sslEnabled, setSslEnabled] = useState<boolean>(false);
  const [autoReconnect, setAutoReconnect] = useState<boolean>(true);
  const [reconnectInterval, setReconnectInterval] = useState<number>(5000);

  // Webhook Test State
  const [testPayloadType, setTestPayloadType] = useState<"ping" | "gift" | "sub" | "comment">("gift");
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    status: number;
    ok: boolean;
    data: any;
    timestamp: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const inboundWebhookUrl = `${originUrl}/api/streamerbot/webhook`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateSecret = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "hectron_sb_";
    for (let i = 0; i < 24; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWebhookSecret(token);
    if (onLog) onLog("INFO", "Nuevo secreto HMAC para Webhooks generado.");
  };

  const handleSendTestWebhook = async () => {
    setIsSendingWebhook(true);
    setWebhookTestResult(null);

    let payload: Record<string, any> = {
      event: testPayloadType,
      timestamp: new Date().toISOString(),
      source: "StreamerBotStudio_TestRunner"
    };

    if (testPayloadType === "gift") {
      payload.event = "gift";
      payload.data = {
        user: "TesterPro",
        giftName: "Rose",
        count: 5,
        diamonds: 5
      };
    } else if (testPayloadType === "comment") {
      payload.event = "comment";
      payload.data = {
        user: "ViewerChat",
        text: "!pregunta ¿Cuál es el comando de la ruleta?"
      };
    } else if (testPayloadType === "sub") {
      payload.event = "subscription";
      payload.data = {
        user: "SubHero",
        tier: "Tier 1",
        months: 3
      };
    }

    if (onLog) {
      onLog("OUT", `[Webhook Test] Enviando POST a ${inboundWebhookUrl} con evento "${testPayloadType}"`);
    }

    try {
      const res = await fetch("/api/streamerbot/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-streamerbot-signature": webhookSecret,
          "x-webhook-secret": webhookSecret
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setWebhookTestResult({
        status: res.status,
        ok: res.ok,
        data,
        timestamp: new Date().toLocaleTimeString()
      });

      if (onLog) {
        onLog(
          res.ok ? "IN" : "ERROR",
          `[Webhook Response ${res.status}] ${JSON.stringify(data)}`
        );
      }
    } catch (err: any) {
      setWebhookTestResult({
        status: 500,
        ok: false,
        data: { error: err.message },
        timestamp: new Date().toLocaleTimeString()
      });
      if (onLog) onLog("ERROR", `Error enviando Webhook: ${err.message}`);
    } finally {
      setIsSendingWebhook(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Seguridad, Autenticación y Endpoints de Webhook</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona la autenticación del WebSocket Server de Streamer.bot y los endpoints para recepción/envío de webhooks bidireccionales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" /> HMAC-SHA256 Ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: WebSocket Server Auth & Credentials */}
        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
            <Key className="w-4 h-4 text-purple-400" />
            <span>Credenciales de Conexión WebSocket</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                URL del Servidor Streamer.bot
              </label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://127.0.0.1:8080/"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Por defecto Streamer.bot escucha en el puerto <code>8080</code> en localhost.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contraseña / Token de Autenticación (Opcional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Configurado en Streamer.bot > Websocket Server > Password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  {showPassword ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-white">SSL / WSS Seguro</div>
                  <div className="text-[10px] text-slate-500">Conexión cifrada</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSslEnabled(!sslEnabled)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    sslEnabled
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {sslEnabled ? "WSS" : "WS"}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-white">Auto Reconexión</div>
                  <div className="text-[10px] text-slate-500">Backoff exponencial</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoReconnect(!autoReconnect)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    autoReconnect
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {autoReconnect ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Inbound & Outbound Webhooks Configuration */}
        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Endpoints de Webhook Bidireccional</span>
          </div>

          <div className="space-y-3.5">
            {/* Inbound Webhook URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Endpoint de Recepción (Inbound Webhook)
                </label>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  HTTP POST
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inboundWebhookUrl}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(inboundWebhookUrl, "inbound")}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copiedKey === "inbound" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Pega este endpoint en Streamer.bot (o EulerStream / TikTok) para enviar alertas a Hectron.
              </span>
            </div>

            {/* Webhook Secret Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Secreto de Firma (Header: <code>x-streamerbot-signature</code>)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSecret}
                  className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerar
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(webhookSecret, "secret")}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copiedKey === "secret" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Outbound Webhook Target */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Endpoint Saliente de Streamer.bot (Outbound Target)
              </label>
              <input
                type="text"
                value={outboundWebhookUrl}
                onChange={(e) => setOutboundWebhookUrl(e.target.value)}
                placeholder="http://127.0.0.1:8080/webhook"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Live Simulator & Tester */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Probador y Validador de Webhooks en Vivo</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Valida firmas HMAC y recepción de eventos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Evento de Prueba
              </label>
              <select
                value={testPayloadType}
                onChange={(e) => setTestPayloadType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="gift">Regalo TikTok (Rose 5x)</option>
                <option value="comment">Comentario Chat (!pregunta)</option>
                <option value="sub">Suscripción (Tier 1)</option>
                <option value="ping">Ping / Healthcheck</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSendTestWebhook}
              disabled={isSendingWebhook}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg transition shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSendingWebhook ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isSendingWebhook ? "Enviando Webhook..." : "Enviar Webhook de Prueba"}</span>
            </button>
          </div>

          <div className="md:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Resultado de la Petición
              </span>
              {webhookTestResult && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    webhookTestResult.ok
                      ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                      : "bg-rose-950 text-rose-300 border-rose-500/40"
                  }`}
                >
                  HTTP {webhookTestResult.status} - {webhookTestResult.ok ? "EXITOSO" : "ERROR"}
                </span>
              )}
            </div>

            {webhookTestResult ? (
              <pre className="font-mono text-[11px] text-cyan-300 overflow-x-auto p-2 bg-slate-900 rounded-lg border border-slate-800 max-h-40">
                {JSON.stringify(webhookTestResult, null, 2)}
              </pre>
            ) : (
              <div className="text-slate-600 text-xs italic py-6 text-center">
                Haz clic en "Enviar Webhook de Prueba" para verificar la respuesta del servidor y la firma criptográfica.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
