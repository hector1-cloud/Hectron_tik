import { useState, useEffect, useContext } from "react";
import { Radio, Wifi, WifiOff, Send, Gift, Heart, Users, CheckCircle2, AlertCircle, RefreshCw, Key, ShieldCheck, Sparkles, Play, ToggleLeft, ToggleRight } from "lucide-react";
import { BrainContext } from "../BrainContext";

interface LiveEventItem {
  id: string;
  type: "chat" | "gift" | "like" | "follow" | "connected" | "disconnected" | "system";
  user?: string;
  text?: string;
  giftName?: string;
  count?: number;
  timestamp: string;
  isSimulated?: boolean;
}

export function TiktokLiveConnectorCard() {
  const { addLog } = useContext(BrainContext);
  const [username, setUsername] = useState<string>("officialgeilegisela");
  const [customRoomId, setCustomRoomId] = useState<string>("");
  const [enableSimulation, setEnableSimulation] = useState<boolean>(true);
  const [signApiKey, setSignApiKey] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    isConnecting: boolean;
    isSimulated?: boolean;
    username: string | null;
    roomId: string | null;
    roomInfo: any;
  }>({
    isConnected: false,
    isConnecting: false,
    isSimulated: false,
    username: null,
    roomId: null,
    roomInfo: null,
  });

  const [liveEvents, setLiveEvents] = useState<LiveEventItem[]>([]);
  const [roomQueryStatus, setRoomQueryStatus] = useState<any>(null);
  const [checkingLive, setCheckingLive] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>("");

  // Poll status on mount & setup WebSocket listener
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);

    // Setup WebSocket connection for realtime events
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/brain/ws`;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "tiktok_comment") {
            setLiveEvents((prev) => [
              {
                id: Math.random().toString(36).substring(7),
                type: "chat",
                user: msg.user || "Fan",
                text: msg.text,
                timestamp: new Date().toLocaleTimeString(),
                isSimulated: msg.isSimulated,
              },
              ...prev.slice(0, 49),
            ]);
          } else if (msg.type === "tiktok_gift") {
            setLiveEvents((prev) => [
              {
                id: Math.random().toString(36).substring(7),
                type: "gift",
                user: msg.user || "Fan",
                giftName: msg.giftName,
                count: msg.count,
                timestamp: new Date().toLocaleTimeString(),
                isSimulated: msg.isSimulated,
              },
              ...prev.slice(0, 49),
            ]);
          } else if (msg.type === "tiktok_like") {
            setLiveEvents((prev) => [
              {
                id: Math.random().toString(36).substring(7),
                type: "like",
                user: msg.user || "Fan",
                count: msg.count,
                text: `+${msg.count || 1} Me Gusta ❤️`,
                timestamp: new Date().toLocaleTimeString(),
                isSimulated: msg.isSimulated,
              },
              ...prev.slice(0, 49),
            ]);
          } else if (msg.type === "tiktok_connected") {
            fetchStatus();
          } else if (msg.type === "tiktok_disconnected") {
            fetchStatus();
          }
        } catch (e) {
          // ignore
        }
      };
    } catch (err) {
      console.warn("WebSocket connection error:", err);
    }

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/tiktok/live/status");
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data);
      }
    } catch (err) {
      console.warn("Error fetching TikTok Live status:", err);
    }
  };

  const handleConnect = async () => {
    if (!username.trim()) return;
    setLoading(true);
    addLog("INFO", "TIKTOK", `Conectando al chat de TikTok LIVE para @${username}...`);

    try {
      const res = await fetch("/api/tiktok/live/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          customRoomId: customRoomId.trim() || undefined,
          signApiKey: signApiKey.trim() || undefined,
          enableSimulationIfOffline: enableSimulation,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        if (data.isSimulated) {
          addLog("WARN", "TIKTOK", ` Streamer offline. Modo simulación activado para @${data.username} (Room: ${data.roomId})`);
          setLiveEvents((prev) => [
            {
              id: Math.random().toString(36).substring(7),
              type: "system",
              user: "SISTEMA",
              text: `Streamer offline. Modo Simulación de TikTok LIVE activado para @${data.username} (Room ID: ${data.roomId})`,
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
        } else {
          addLog("INFO", "TIKTOK", `¡Conexión EN VIVO iniciada con éxito para @${data.username}! RoomId: ${data.roomId}`);
          setLiveEvents((prev) => [
            {
              id: Math.random().toString(36).substring(7),
              type: "connected",
              user: "SISTEMA",
              text: `Conectado EN VIVO al chat de @${data.username} (Room ID: ${data.roomId})`,
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
        }
        await fetchStatus();
      } else {
        addLog("WARN", "TIKTOK", `TikTok LIVE: ${data.error || "Asegúrate de que el usuario esté transmitiendo o activa simulación"}`);
        setLiveEvents((prev) => [
          {
            id: Math.random().toString(36).substring(7),
            type: "disconnected",
            user: "SISTEMA",
            text: `${data.error || "Streamer offline"}. Activa "Simulación si está Offline" para realizar pruebas.`,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      addLog("ERROR", "TIKTOK", `Error de red al conectar TikTok LIVE: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tiktok/live/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        addLog("INFO", "TIKTOK", "Desconectado manualmente del chat de TikTok LIVE.");
        setLiveEvents((prev) => [
          {
            id: Math.random().toString(36).substring(7),
            type: "disconnected",
            user: "SISTEMA",
            text: "Desconectado de la sesión de TikTok LIVE.",
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
        await fetchStatus();
      }
    } catch (err: any) {
      addLog("ERROR", "TIKTOK", `Error al desconectar: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIsLive = async () => {
    if (!username.trim()) return;
    setCheckingLive(true);
    try {
      const res = await fetch("/api/tiktok/live/room-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setRoomQueryStatus(data);
      if (data.isLive) {
        addLog("INFO", "TIKTOK", `El usuario @${data.username} está EN VIVO en TikTok LIVE 🎉`);
      } else {
        addLog("WARN", "TIKTOK", `El usuario @${data.username} está actualmente fuera de línea.`);
      }
    } catch (err: any) {
      addLog("ERROR", "TIKTOK", `Error al verificar estado EN VIVO: ${err?.message}`);
    } finally {
      setCheckingLive(false);
    }
  };

  const handleEmitManual = async (type: "comment" | "gift" | "like", overrideText?: string) => {
    try {
      await fetch("/api/tiktok/live/emit-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          user: "UsuarioPrueba",
          text: overrideText || manualText || "Prueba de chat interactivo 🚀",
          giftName: type === "gift" ? "Rosa 🌹" : undefined,
          count: 1,
        }),
      });
      if (type === "comment") setManualText("");
    } catch (e) {
      console.warn("Error emitiendo evento manual:", e);
    }
  };

  return (
    <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/30 space-y-5 shadow-lg relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-pink-500/10 border border-pink-500/30 rounded-lg text-pink-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">TikTok LIVE Webcast Connector</h3>
              <span className="px-2 py-0.5 bg-pink-950 text-pink-400 font-mono text-[10px] rounded border border-pink-500/30">
                Oficial Node.js Client
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Conexión directa en tiempo real al chat, regalos, me gusta y eventos de cualquier streamer sin requerir credenciales del canal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectionStatus.isConnected ? (
            connectionStatus.isSimulated ? (
              <span className="px-3 py-1 bg-amber-950 text-amber-300 border border-amber-500/40 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                SIMULACIÓN DE STREAM (@{connectionStatus.username})
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm">
                <Wifi className="w-3.5 h-3.5 animate-ping text-emerald-400" />
                EN VIVO (@{connectionStatus.username})
              </span>
            )
          ) : (
            <span className="px-3 py-1 bg-slate-900 text-slate-400 border border-slate-800 rounded-full font-bold text-xs flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5" />
              DESCONECTADO
            </span>
          )}
        </div>
      </div>

      {/* Connection Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Usuario TikTok (@uniqueId)
            </label>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-cyan-400 hover:underline text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <Key className="w-3 h-3" />
              {showAdvanced ? "Ocultar Opciones Avanzadas" : "Opciones Avanzadas / Room ID"}
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: officialgeilegisela o url de tiktok"
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white pl-8 pr-3 py-2 rounded-lg text-xs font-mono outline-none transition"
              />
            </div>
            <button
              onClick={handleCheckIsLive}
              disabled={checkingLive || !username}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingLive ? "animate-spin" : ""}`} />
              <span>Verificar LIVE</span>
            </button>
          </div>

          {/* Fallback Simulation Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] text-slate-300 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableSimulation}
                onChange={(e) => setEnableSimulation(e.target.checked)}
                className="w-3.5 h-3.5 accent-pink-500 rounded cursor-pointer"
              />
              <span className="text-slate-300 text-[11px]">
                Activar Simulación de Stream si el usuario está fuera de línea (Offline)
              </span>
            </label>
          </div>

          {showAdvanced && (
            <div className="pt-2 animate-fadeIn space-y-2 border-t border-slate-900 mt-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  ID de Sala Específica (Room ID de TikTok - opcional)
                </label>
                <input
                  type="text"
                  value={customRoomId}
                  onChange={(e) => setCustomRoomId(e.target.value)}
                  placeholder="ej: 729384729104829102"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-cyan-300 px-3 py-1.5 rounded text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" /> Clave API de Euler Stream (SignApiKey opcional)
                </label>
                <input
                  type="password"
                  value={signApiKey}
                  onChange={(e) => setSignApiKey(e.target.value)}
                  placeholder="Ingresa tu Euler Stream API key (si aplica)"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-cyan-300 px-3 py-1.5 rounded text-xs font-mono outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end gap-2">
          {connectionStatus.isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
            >
              <WifiOff className="w-4 h-4" />
              <span>Desconectar Chat</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading || !username}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 disabled:opacity-50"
            >
              <Radio className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Conectar a TikTok LIVE</span>
            </button>
          )}
        </div>
      </div>

      {/* Room Check Banner */}
      {roomQueryStatus && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
          roomQueryStatus.isLive 
            ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300" 
            : "bg-amber-950/60 border-amber-500/30 text-amber-300"
        }`}>
          <div className="flex items-center gap-2">
            {roomQueryStatus.isLive ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
            <div>
              <span className="font-bold">@{roomQueryStatus.username}:</span>{" "}
              {roomQueryStatus.isLive 
                ? "Transmitiendo EN VIVO en TikTok LIVE 🎉" 
                : "Actualmente fuera de línea (offline). Puedes conectar en modo simulación."}
            </div>
          </div>
          {roomQueryStatus.roomInfo && (
            <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Room: {roomQueryStatus.roomInfo.id_str || "Detectada"}
            </span>
          )}
        </div>
      )}

      {/* Manual Trigger Console for Testing */}
      {connectionStatus.isConnected && (
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Prueba Manual de Eventos de Chat & Regalos
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Escribe un mensaje de prueba..."
              className="flex-1 bg-slate-950 border border-slate-800 text-white px-3 py-1.5 rounded text-xs outline-none"
            />
            <button
              onClick={() => handleEmitManual("comment")}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Enviar Chat</span>
            </button>
            <button
              onClick={() => handleEmitManual("gift")}
              className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Gift className="w-3 h-3" />
              <span>Enviar Regalo</span>
            </button>
            <button
              onClick={() => handleEmitManual("like")}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Heart className="w-3 h-3" />
              <span>Enviar Like</span>
            </button>
          </div>
        </div>
      )}

      {/* Realtime Stream Event Feed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Feed de Eventos en Vivo (Webcast Push Stream)</span>
          </label>
          <span className="text-[10px] text-slate-500">
            {liveEvents.length} eventos capturados
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 h-52 overflow-y-auto space-y-2 font-mono text-xs">
          {liveEvents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-[11px] space-y-1">
              <Radio className="w-6 h-6 text-slate-600 mb-1" />
              <p>Esperando eventos de la transmisión en tiempo real...</p>
              <p className="text-[10px] text-slate-600">Ingresa un usuario y presiona "Conectar a TikTok LIVE"</p>
            </div>
          ) : (
            liveEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-start justify-between gap-2 p-1.5 bg-slate-950 rounded border border-slate-850 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {evt.type === "chat" && <Send className="w-3 h-3 text-cyan-400 shrink-0" />}
                  {evt.type === "gift" && <Gift className="w-3 h-3 text-pink-400 shrink-0 animate-bounce" />}
                  {evt.type === "like" && <Heart className="w-3 h-3 text-rose-400 shrink-0" />}
                  {evt.type === "follow" && <Users className="w-3 h-3 text-amber-400 shrink-0" />}
                  {evt.type === "connected" && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                  {evt.type === "disconnected" && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
                  {evt.type === "system" && <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}

                  <span className="font-bold text-slate-300 shrink-0">@{evt.user || "Fan"}:</span>
                  <span className="text-slate-200 truncate">{evt.text || evt.giftName}</span>
                  {evt.isSimulated && (
                    <span className="text-[9px] px-1 bg-amber-950 text-amber-400 border border-amber-500/30 rounded">
                      Simulado
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 shrink-0">{evt.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
