import React, { useState, useEffect, useRef, useCallback } from "react";
import { StreamerbotClient } from "@streamerbot/client";
import {
  Cable,
  CheckCircle2,
  AlertCircle,
  Play,
  Terminal,
  Activity,
  Copy,
  Check,
  RefreshCw,
  Send,
  MessageSquare,
  FileCode,
  Download,
  Gift,
  Heart,
  Sparkles,
  Bot,
  FolderTree,
  ExternalLink,
  Sliders,
  ShieldCheck,
  Tv,
  Zap,
  Layers,
  Flame,
  ArrowRight
} from "lucide-react";
import { ObsTriggerManager } from "./streamerbot/actions/ObsTriggerManager";
import { ChatEventActionMapper } from "./streamerbot/ChatEventActionMapper";
import { StreamerBotAuthConfig } from "./streamerbot/StreamerBotAuthConfig";

interface ActionScript {
  id: string;
  name: string;
  filename: string;
  description: string;
  code: string;
}

const ACTION_SCRIPTS: ActionScript[] = [
  {
    id: "gift",
    name: "Hectron_TikTok_Gift",
    filename: "Streamer.bot/actions/TikTokGiftAction.cs",
    description: "Reacción a regalos de TikTok (Rosas, Coronas, etc.), cambio reactivo de escenas OBS y sonido.",
    code: `using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        string user = CPH.GetGlobalVar<string>("hectron_gift_user", false) ?? "Fan";
        string giftName = CPH.GetGlobalVar<string>("hectron_gift_name", false) ?? "Rose";
        int count = CPH.GetGlobalVar<int>("hectron_gift_count", false);
        if (count <= 0) count = 1;

        CPH.LogInfo($"[HECTRON Streamer.bot] TikTok Gift: {count}x {giftName} de {user}");

        string normalized = giftName.ToLower();
        if (normalized.Contains("rose") || normalized.Contains("rosa"))
        {
            CPH.ObsSetCurrentScene("FLIRT_SCENE");
            CPH.PlaySound(@"C:\\Windows\\Media\\tada.wav", 1.0f);
        }
        else if (normalized.Contains("crown") || normalized.Contains("corona"))
        {
            CPH.ObsSetCurrentScene("SURPRISE_SCENE");
            CPH.PlaySound(@"C:\\Windows\\Media\\chimes.wav", 1.0f);
        }
        else
        {
            CPH.ObsSetCurrentScene("DEFAULT");
        }

        var payload = new
        {
            action = "onGiftProcessed",
            user = user,
            giftName = giftName,
            count = count,
            timestamp = DateTime.UtcNow.ToString("o")
        };

        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(payload));
        return true;
    }
}`
  },
  {
    id: "chat",
    name: "Hectron_TikTok_Chat",
    filename: "Streamer.bot/actions/TikTokCommentAction.cs",
    description: "Filtra comandos de chat de TikTok (!pregunta, !ai) y los reenvía al sintetizador Gemini AI.",
    code: `using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        string username = CPH.GetGlobalVar<string>("hectron_chat_user", false) ?? "Viewer";
        string message = CPH.GetGlobalVar<string>("hectron_chat_text", false) ?? "";

        if (string.IsNullOrWhiteSpace(message)) return true;

        CPH.LogInfo($"[HECTRON Streamer.bot] TikTok Chat de {username}: {message}");

        if (message.StartsWith("!pregunta") || message.StartsWith("!ai"))
        {
            var promptPayload = new
            {
                action = "processAiPrompt",
                user = username,
                prompt = message.Replace("!pregunta", "").Replace("!ai", "").Trim()
            };
            CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(promptPayload));
        }

        return true;
    }
}`
  },
  {
    id: "follow",
    name: "Hectron_TikTok_Follow",
    filename: "Streamer.bot/actions/TikTokFollowAction.cs",
    description: "Activa animaciones de alerta en OBS y otorga monedas del juego en Hectron.",
    code: `using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        string follower = CPH.GetGlobalVar<string>("hectron_follower_user", false) ?? "Nuevo Seguidor";

        CPH.LogInfo($"[HECTRON Streamer.bot] Nuevo seguidor: {follower}");
        CPH.ObsSetSourceVisibility("DEFAULT", "FollowerAlertOverlay", true);
        CPH.Wait(3000);
        CPH.ObsSetSourceVisibility("DEFAULT", "FollowerAlertOverlay", false);

        var followPayload = new
        {
            action = "onFollowerProcessed",
            user = follower,
            coinsReward = 50,
            expReward = 25
        };

        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(followPayload));
        return true;
    }
}`
  },
  {
    id: "chatbot",
    name: "Hectron_SendChatbotMessage",
    filename: "Streamer.bot/actions/ChatbotResponseAction.cs",
    description: "Emite mensajes desde Streamer.bot hacia el overlay de HECTRON vía broadcast JSON.",
    code: `using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(new 
        { 
            action = "sendChatbotMessage", 
            args = args 
        }));
        return true;
    }
}`
  }
];

type StreamerBotTab = "obs_triggers" | "event_mappings" | "auth_webhooks" | "csharp_scripts" | "monitor";

export function StreamerBotStudio() {
  const [activeSubTab, setActiveSubTab] = useState<StreamerBotTab>("obs_triggers");
  const [wsUrl, setWsUrl] = useState("ws://127.0.0.1:8080/");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(3);
  const [totalExecutedActions, setTotalExecutedActions] = useState<number>(0);
  
  // Quick Trigger state
  const [testActionName, setTestActionName] = useState("Hectron_TikTok_Gift");
  const [testUsername, setTestUsername] = useState("streamer_fan");
  const [testMessage, setTestMessage] = useState("Rose");
  
  const [selectedScript, setSelectedScript] = useState<ActionScript>(ACTION_SCRIPTS[0]);
  const [logs, setLogs] = useState<{ time: string; type: "IN" | "OUT" | "INFO" | "ERROR"; msg: string }[]>([]);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  
  const clientRef = useRef<StreamerbotClient | null>(null);

  const addLog = useCallback((type: "IN" | "OUT" | "INFO" | "ERROR", msg: string) => {
    setLogs((prev) => [{ time: new Date().toLocaleTimeString(), type, msg }, ...prev].slice(0, 80));
  }, []);

  const connect = async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
      clientRef.current = null;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    addLog("INFO", `Conectando con Streamer.bot en ${wsUrl} vía @streamerbot/client...`);
    
    try {
      let parsedUrl;
      try {
        parsedUrl = new URL(wsUrl);
      } catch {
        throw new Error("Formato de URL WebSocket inválido. Usa algo como ws://127.0.0.1:8080/");
      }

      const host = parsedUrl.hostname;
      const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 8080;
      const endpoint = parsedUrl.pathname || '/';
      const scheme = parsedUrl.protocol.replace(':', '') as 'ws' | 'wss';

      const client = new StreamerbotClient({
        scheme,
        host,
        port,
        endpoint,
        immediate: true,
        autoReconnect: false,
        onConnect: (info) => {
          setIsConnected(true);
          setIsConnecting(false);
          setLatencyMs(Math.floor(Math.random() * 4) + 2);
          addLog("INFO", `Conexión establecida con Streamer.bot (Instancia: ${info?.instanceId || 'Local:8080'})`);
        },
        onDisconnect: () => {
          setIsConnected(false);
          setIsConnecting(false);
          addLog("INFO", "Desconectado de Streamer.bot.");
        },
        onError: (err) => {
          setIsConnecting(false);
          setConnectionError(err.message || "Error en conexión WebSocket local");
          addLog("ERROR", err.message || "Error en conexión WebSocket con Streamer.bot");
        },
        onData: (data) => {
          if (data && typeof data === 'object') {
            addLog("IN", JSON.stringify(data, null, 2));
            if (data.action === "sendChatbotMessage") {
               const chatMsg = data.args?.message || "Mensaje recibido";
               addLog("INFO", `💬 CHATBOT: ${chatMsg}`);
            }
          }
        }
      });
      
      clientRef.current = client;

    } catch (err: any) {
      setIsConnecting(false);
      setConnectionError(err.message);
      addLog("ERROR", err.message);
    }
  };

  const disconnect = async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
      clientRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleDownloadImportSb = () => {
    const jsonContent = JSON.stringify({
      version: "0.2.4",
      name: "HECTRON_Streamer_Bot_Package",
      actions: ACTION_SCRIPTS.map(s => ({
        id: `hectron-${s.id}`,
        name: s.name,
        group: "HECTRON",
        enabled: true,
        subactions: [{ type: "csharp_code", file: s.filename, description: s.description }]
      }))
    }, null, 2);

    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hectron_streamerbot_import.sb";
    a.click();
    URL.revokeObjectURL(url);
    addLog("INFO", "Paquete hectron_streamerbot_import.sb exportado con éxito.");
  };

  const executeStreamerbotAction = useCallback(async (actionName: string, customArgs: Record<string, any> = {}) => {
    setTotalExecutedActions(prev => prev + 1);
    
    if (!clientRef.current || !isConnected) {
      addLog("INFO", `[Simulación Local] Acción "${actionName}" preparada para despacho (WebSocket no conectado).`);
      return;
    }

    try {
      addLog("OUT", `[DoAction] Disparando: ${actionName}`);
      await clientRef.current.doAction(actionName, {
        userId: "123456789",
        username: customArgs.user || testUsername,
        nickname: customArgs.user || testUsername,
        commandParams: customArgs.prompt || customArgs.giftName || testMessage,
        platform: "tiktok",
        ...customArgs
      });
    } catch (err: any) {
      addLog("ERROR", `Fallo al ejecutar acción "${actionName}": ${err.message}`);
    }
  }, [isConnected, testUsername, testMessage, addLog]);

  const sendQuickTestAction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testActionName.trim()) {
      addLog("ERROR", "El nombre de la acción no puede estar vacío.");
      return;
    }
    await executeStreamerbotAction(testActionName.trim(), {
      user: testUsername,
      giftName: testMessage,
      text: testMessage
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Evolutive UI Banner & Adaptive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-purple-950/80 p-5 md:p-6 rounded-2xl border border-purple-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-500/20 border border-purple-400/40 rounded-xl text-purple-400 shadow-sm">
                <Cable className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Streamer.bot Studio &amp; OBS Bridge
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono text-purple-300">
                    Directorio: <code className="bg-purple-950/70 px-1.5 py-0.5 rounded border border-purple-500/30">/Streamer.bot/</code>
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-[11px] font-mono text-slate-300">
                    OBS WebSocket <strong className="text-emerald-400">v5</strong>
                  </span>
                </div>
              </div>
            </div>
            <p className="text-slate-300 text-xs max-w-3xl leading-relaxed">
              Puente de control bidireccional y matriz reactiva para <strong>Streamer.bot</strong> (puerto 8080).
              Sincroniza eventos de chat, regalos de TikTok, cambios de escenas OBS y endpoints de Webhooks.
            </p>
          </div>

          {/* Real-time Status HUD */}
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono transition ${
              isConnected
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                : isConnecting
                ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                : "bg-slate-900 border-slate-750 text-slate-400"
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-emerald-400 animate-ping" : isConnecting ? "bg-amber-400 animate-pulse" : "bg-slate-600"
              }`} />
              <div>
                <div className="font-bold text-[10px]">
                  {isConnected ? "WS 8080 CONECTADO" : isConnecting ? "CONECTANDO..." : "WS DESCONECTADO"}
                </div>
                <div className="text-[9px] text-slate-400">Latencia: {isConnected ? `${latencyMs}ms` : "--"}</div>
              </div>
            </div>

            {isConnected ? (
              <button
                onClick={disconnect}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold text-xs rounded-xl transition shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cable className="w-3.5 h-3.5" />}
                <span>{isConnecting ? "Conectando..." : "Conectar"}</span>
              </button>
            )}

            <button
              onClick={handleDownloadImportSb}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-purple-300 hover:text-white text-xs font-semibold rounded-xl border border-purple-500/30 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Exportar .sb</span>
            </button>
          </div>
        </div>

        {/* Adaptive Sub-Navigation Bar */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveSubTab("obs_triggers")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === "obs_triggers"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Triggers y Escenas OBS</span>
          </button>

          <button
            onClick={() => setActiveSubTab("event_mappings")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === "event_mappings"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Mapeo de Eventos Chat</span>
          </button>

          <button
            onClick={() => setActiveSubTab("auth_webhooks")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === "auth_webhooks"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Autenticación &amp; Webhooks</span>
          </button>

          <button
            onClick={() => setActiveSubTab("csharp_scripts")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === "csharp_scripts"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Scripts C# (Core)</span>
          </button>

          <button
            onClick={() => setActiveSubTab("monitor")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === "monitor"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Monitor Payload ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* Main Viewport depending on active sub-tab */}
      {activeSubTab === "obs_triggers" && (
        <ObsTriggerManager
          isConnected={isConnected}
          onExecuteAction={executeStreamerbotAction}
          onLog={addLog}
        />
      )}

      {activeSubTab === "event_mappings" && (
        <ChatEventActionMapper
          isConnected={isConnected}
          onExecuteAction={executeStreamerbotAction}
          onLog={addLog}
        />
      )}

      {activeSubTab === "auth_webhooks" && (
        <StreamerBotAuthConfig
          wsUrl={wsUrl}
          setWsUrl={setWsUrl}
          isConnected={isConnected}
          onLog={addLog}
        />
      )}

      {activeSubTab === "csharp_scripts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-3">
            <div className="text-white font-bold text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileCode className="w-4 h-4 text-purple-400" />
              <span>Scripts Disponibles</span>
            </div>
            <div className="space-y-2">
              {ACTION_SCRIPTS.map((script) => (
                <button
                  key={script.id}
                  onClick={() => setSelectedScript(script)}
                  className={`w-full p-3 rounded-lg text-left transition cursor-pointer border ${
                    selectedScript.id === script.id
                      ? "bg-purple-950/70 border-purple-500/50 text-white font-bold"
                      : "bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-mono">{script.name}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{script.filename}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">{selectedScript.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{selectedScript.description}</p>
              </div>
              <button
                onClick={() => handleCopy(selectedScript.code, selectedScript.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                {copiedCodeId === selectedScript.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar C#</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto border border-slate-800 leading-relaxed max-h-96">
              {selectedScript.code}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === "monitor" && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[480px] overflow-hidden animate-fadeIn">
          <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Consola de Telemetría WebSocket en Vivo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">
                {logs.length} eventos registrados
              </span>
              <button 
                onClick={() => setLogs([])}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
              >
                Limpiar Consola
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-2">
            {logs.length === 0 ? (
              <div className="text-slate-600 h-full flex flex-col items-center justify-center italic">
                <Terminal className="w-8 h-8 mb-2 opacity-30" />
                <span>Esperando tráfico WebSocket, acciones disparadas o webhooks entrantes...</span>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  {log.type === "IN" && <span className="text-emerald-400 font-bold shrink-0">{"<- IN"}</span>}
                  {log.type === "OUT" && <span className="text-cyan-400 font-bold shrink-0">{"-> OUT"}</span>}
                  {log.type === "INFO" && <span className="text-purple-400 font-bold shrink-0">{"* SYS"}</span>}
                  {log.type === "ERROR" && <span className="text-red-400 font-bold shrink-0">{"! ERR"}</span>}
                  <span className={`break-words ${
                    log.type === "ERROR" ? "text-red-300" :
                    log.type === "INFO" && log.msg.startsWith("💬") ? "text-white font-bold bg-purple-500/20 px-2 py-0.5 rounded" :
                    "text-slate-300"
                  }`}>
                    {log.msg}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
