import React, { useState, useEffect, useRef } from "react";
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
  MessageSquare
} from "lucide-react";

export function StreamerBotStudio() {
  const [wsUrl, setWsUrl] = useState("ws://127.0.0.1:8080/");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const [testActionName, setTestActionName] = useState("");
  const [testUsername, setTestUsername] = useState("streamer_fan");
  const [testMessage, setTestMessage] = useState("Hello world!");
  
  const [logs, setLogs] = useState<{ time: string; type: "IN" | "OUT" | "INFO" | "ERROR"; msg: string }[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  
  const clientRef = useRef<StreamerbotClient | null>(null);

  const addLog = (type: "IN" | "OUT" | "INFO" | "ERROR", msg: string) => {
    setLogs((prev) => [{ time: new Date().toLocaleTimeString(), type, msg }, ...prev].slice(0, 50));
  };

  const connect = async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
      clientRef.current = null;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    addLog("INFO", `Connecting to ${wsUrl} via @streamerbot/client...`);
    
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
          addLog("INFO", `Connected to Streamer.bot (Instance: ${info?.instanceId || 'Unknown'})`);
        },
        onDisconnect: () => {
          setIsConnected(false);
          setIsConnecting(false);
          addLog("INFO", "Disconnected from Streamer.bot.");
        },
        onError: (err) => {
          setIsConnecting(false);
          setConnectionError(err.message || "WebSocket connection error");
          addLog("ERROR", err.message || "WebSocket error");
        },
        onData: (data) => {
          if (data && typeof data === 'object') {
            addLog("IN", JSON.stringify(data, null, 2));
            if (data.action === "sendChatbotMessage") {
               const chatMsg = data.args?.message || "No message provided in args";
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

  const handleCopyCode = () => {
    const code = `using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(new { action = "sendChatbotMessage", args = args }));
        return true;
    }
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const sendTestAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientRef.current || !isConnected) return;
    
    if (!testActionName.trim()) {
      addLog("ERROR", "Action name cannot be empty.");
      return;
    }

    try {
      addLog("OUT", `Executing DoAction: ${testActionName.trim()}`);
      await clientRef.current.doAction(testActionName.trim(), {
        userId: "123456789",
        username: testUsername,
        nickname: testUsername,
        commandParams: testMessage,
        profilePicturUrl: "https://via.placeholder.com/150",
        platform: "tiktok"
      });
    } catch (err: any) {
      addLog("ERROR", `Failed to execute action: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-purple-950/80 p-6 rounded-2xl border border-purple-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 bg-purple-500/20 border border-purple-400/40 rounded-xl text-purple-400">
                <Cable className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Streamer.bot Integration Studio
              </h2>
            </div>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Conecta Hectron Streamer Studio con tu instancia local de <strong className="text-purple-300">Streamer.bot</strong> vía WebSocket.
              Envía eventos (Gifts, Chat, Follows) como acciones, y recibe respuestas del chatbot directamente en la pantalla.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection & Setup Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Activity className="w-4 h-4" />
                <span>Estado de Conexión</span>
              </div>
              {isConnected ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ONLINE
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> OFFLINE
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL del Servidor WebSocket
                </label>
                <input
                  type="text"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  disabled={isConnected || isConnecting}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none disabled:opacity-50"
                  placeholder="ws://127.0.0.1:8080/"
                />
              </div>

              {connectionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">{connectionError}</span>
                </div>
              )}

              {isConnected ? (
                <button
                  onClick={disconnect}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold text-xs rounded-lg transition shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cable className="w-4 h-4" />
                  )}
                  {isConnecting ? "Conectando..." : "Conectar a Streamer.bot"}
                </button>
              )}
            </div>
            
            <div className="pt-4 border-t border-slate-800 mt-4 text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Setup Inicial:</strong> Descarga Streamer.bot, ve a la pestaña "Server/Clients" y activa "Websocket Server". Deja los valores por defecto.
            </div>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>Enviar Mensajes al Chat</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Para permitir que Streamer.bot envíe respuestas o mensajes al chat de TikTok a través de Hectron, añade el siguiente código en <strong>Core &gt; C# &gt; Execute C# Code</strong> en tu sub-acción de Streamer.bot:
            </p>
            
            <div className="relative">
              <button
                onClick={handleCopyCode}
                className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition cursor-pointer"
                title="Copiar código C#"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="bg-slate-950 p-3 rounded-lg font-mono text-[10px] text-cyan-300 overflow-x-auto border border-slate-800 leading-normal">
{`using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(new { 
            action = "sendChatbotMessage", 
            args = args 
        }));
        return true;
    }
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Action Tester & Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 p-6 rounded-xl border border-slate-800 shadow-lg space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Play className="w-4 h-4 text-purple-400" />
              <span>Disparador de Acciones de Prueba</span>
            </div>
            
            <form onSubmit={sendTestAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de la Acción en Streamer.bot (Ej: TikTokGiftAction)
                </label>
                <input
                  type="text"
                  value={testActionName}
                  onChange={(e) => setTestActionName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Escribe el Action Name exacto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    %username% / %nickname% simulado
                  </label>
                  <input
                    type="text"
                    value={testUsername}
                    onChange={(e) => setTestUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    %commandParams% simulado
                  </label>
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!isConnected}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Disparar Acción en Streamer.bot</span>
                </button>
              </div>
            </form>
          </div>

          {/* WS Logs */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-lg flex flex-col h-[300px] overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span>WebSocket Payload Logs</span>
              </div>
              <button 
                onClick={() => setLogs([])}
                className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Limpiar Logs
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-2">
              {logs.length === 0 ? (
                <div className="text-slate-600 h-full flex items-center justify-center italic">
                  Esperando actividad de red...
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
        </div>
      </div>
    </div>
  );
}
