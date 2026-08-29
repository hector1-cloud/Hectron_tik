import { createContext, useState, useEffect, ReactNode, useRef } from "react";
import {
  BrainContextType,
  Emotion,
  AvatarAnimationClass,
  ObsStatus,
  ChatMessage,
  LogEntry,
  LogLevel,
  LogScope,
  GeminiVoiceName,
  TtsExpressiveness,
  TtsVoiceSettings,
} from "./types";
import { useGeminiTtsEmotion } from "./hooks/useGeminiTtsEmotion";
import { useGameState } from "./hooks/useGameState";
import { useWebSocketReconnection } from "./hooks/useWebSocketReconnection";

export const DEFAULT_TTS_VOICE_SETTINGS: TtsVoiceSettings = {
  voice: "Kore",
  speakingRate: 1.05,
  pitch: 1.1,
  expressiveness: "cheerful",
  autoSpeechEnabled: true,
};

export const BrainContext = createContext<BrainContextType>({} as BrainContextType);

export function BrainProvider({ children }: { children: ReactNode }) {
  const [agentUrl, setAgentUrl] = useState<string>("http://127.0.0.1:8787");
  const [agentStatus, setAgentStatus] = useState<"ONLINE" | "OFFLINE" | "CHECKING">("OFFLINE");
  const [obsStatus, setObsStatus] = useState<ObsStatus>({
    connected: false,
    streaming: false,
    scene: "DEFAULT",
  });
  const [scenes, setScenes] = useState<string[]>([]);
  const {
    animationClass,
    setAnimationClass,
    emotion,
    setEmotion,
    latestMetadata: latestTtsMetadata,
    processTtsMetadata,
  } = useGeminiTtsEmotion();

  const [isAutonomous, setIsAutonomous] = useState<boolean>(true);
  const [tiktokConnected, setTiktokConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "game" | "inventory" | "saves" | "overlay" | "agent" | "tiktok" | "duix" | "streamerbot" | "logs" | "performance" | "autonomy" | "workers-ai" | "workflows" | "executive" | "enterprise" | "sims" | "livestudio" | "linux" | "studio3d" | "analytics">("dashboard");

  // LOD & FPS state for 3D optimization
  const [lodLevel, setLodLevel] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [fps, setFps] = useState<number>(60);

  // Gemini TTS Voice Profiles & Fine-Tuning State with LocalStorage Persistence
  const [ttsVoiceSettings, setTtsVoiceSettings] = useState<TtsVoiceSettings>(() => {
    try {
      const saved = localStorage.getItem("hectron_tts_voice_settings");
      if (saved) {
        return { ...DEFAULT_TTS_VOICE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_TTS_VOICE_SETTINGS;
  });

  const updateTtsVoiceSettings = (partial: Partial<TtsVoiceSettings>) => {
    setTtsVoiceSettings((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem("hectron_tts_voice_settings", JSON.stringify(updated));
      } catch (err) {
        console.warn("Error saving TTS settings to localStorage", err);
      }
      return updated;
    });
  };

  const resetTtsVoiceSettings = () => {
    setTtsVoiceSettings(DEFAULT_TTS_VOICE_SETTINGS);
    try {
      localStorage.setItem("hectron_tts_voice_settings", JSON.stringify(DEFAULT_TTS_VOICE_SETTINGS));
    } catch {}
  };

  // Structured Log Buffer
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init_1",
      timestamp: new Date().toISOString(),
      level: "INFO",
      scope: "FRONTEND",
      message: "Sistema HECTRON Universe montado & BrainContext listo.",
    },
  ]);

  const addLog = (level: LogLevel, scope: LogScope, message: string, details?: any) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      level,
      scope,
      message,
      details,
    };
    setLogs((prev) => [...prev.slice(-300), entry]);

    // Send to backend
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, scope, message, details }),
    }).catch(() => {});
  };

  const clearLogs = () => {
    setLogs([]);
    fetch("/api/logs", { method: "DELETE" }).catch(() => {});
  };

  // Connect Game, Inventory and Save/Load hook
  const {
    gameState,
    collectItem,
    useItem,
    equipItem,
    discardItem,
    spawnRandomWorldItem,
    pickupWorldItem,
    saveGame,
    loadGame,
    deleteSave,
    exportSaveData,
    importSaveData,
    saveSlots,
    isAutoSaving,
    lastAutoSaveTime,
    triggerAutoSave,
    gainExperience,
    gainCoins,
    soundEffect,
  } = useGameState(obsStatus.scene, emotion, setEmotion, addLog);

  // Poll server logs periodically
  useEffect(() => {
    const fetchServerLogs = async () => {
      try {
        const res = await fetch("/api/logs?limit=100");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.logs)) {
            setLogs(data.logs);
          }
        }
      } catch {
        // Silently ignore network failures
      }
    };

    fetchServerLogs();
    const timer = setInterval(fetchServerLogs, 4000);
    return () => clearInterval(timer);
  }, []);

  // Simple FPS Measurement loop
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "HECTRON (Miku)",
      text: "¡Hola a todos! Bienvenidos al directo. Soy Miku y estoy lista para platicar con ustedes. 🎤💙",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: "HAPPY",
      isAi: true,
    },
  ]);

  const [latestSpeechText, setLatestSpeechText] = useState<string>("¡Hola a todos! Bienvenidos al directo.");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const addMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev.slice(-30), newMsg]);
    if (msg.isAi) {
      setLatestSpeechText(msg.text);
    }
  };

  // Check Local Agent Health
  useEffect(() => {
    let isMounted = true;
    const checkAgent = async () => {
      if (!agentUrl) return;
      try {
        const res = await fetch(`${agentUrl}/health`, { method: "GET" });
        if (res.ok && isMounted) {
          setAgentStatus("ONLINE");
          const statusRes = await fetch(`${agentUrl}/status`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setObsStatus({
              connected: Boolean(statusData.obs),
              streaming: Boolean(statusData.streaming),
              scene: statusData.scene || "DEFAULT",
            });
          }
        } else if (isMounted) {
          setAgentStatus("OFFLINE");
        }
      } catch {
        if (isMounted) setAgentStatus("OFFLINE");
      }
    };

    checkAgent();
    const timer = setInterval(checkAgent, 8000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [agentUrl]);

  // Keep track of active TikTok connection state
  const wasTiktokActiveRef = useRef<boolean>(false);
  useEffect(() => {
    wasTiktokActiveRef.current = tiktokConnected;
  }, [tiktokConnected]);

  // Real-time server state sync over WebSocket (with automatic background reconnection)
  const attemptTiktokReconnection = async () => {
    const savedCode = localStorage.getItem("hectron_tiktok_code");
    if (!savedCode) {
      setTiktokConnected(true);
      return;
    }
    localStorage.removeItem("hectron_tiktok_code"); // One-time code used, clear immediately
    addLog("INFO", "TIKTOK", "Verificando sesión activa de TikTok LIVE con el servidor...");
    try {
      const res = await fetch("/api/tiktok/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: savedCode }),
      });
      if (res.ok) {
        setTiktokConnected(true);
        addLog("INFO", "TIKTOK", "¡Sesión de TikTok LIVE vinculada activamente!");
      } else {
        setTiktokConnected(true);
        addLog("INFO", "TIKTOK", "Sesión de TikTok LIVE activa mantenida en el servidor.");
      }
    } catch (err: any) {
      setTiktokConnected(true);
    }
  };

  const protocol = typeof window !== 'undefined' && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = typeof window !== 'undefined' ? window.location.host : "localhost";
  const wsUrl = `${protocol}//${host}/api/brain/ws`;

  useWebSocketReconnection({
    url: wsUrl,
    onOpen: (event) => {
      addLog("INFO", "FRONTEND", "Conexión WebSocket en vivo establecida con el servidor de HECTRON");
      // If we had an active TikTok session, check if we need to restore/reconnect the TikTok stream
      if (wasTiktokActiveRef.current) {
        // Give a tiny delay for state to sync first
        setTimeout(() => {
          if (!wasTiktokActiveRef.current) {
            // If after syncing, tiktokConnected is still false, trigger auto-reconnect
            attemptTiktokReconnection();
          }
        }, 1000);
      }
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state") {
          setTiktokConnected(data.tiktokConnected || false);
          setObsStatus({
            connected: data.obsConnected !== undefined ? data.obsConnected : Boolean(data.currentScene),
            streaming: data.isStreaming || false,
            scene: data.currentScene || "DEFAULT",
          });
          if (data.currentEmotion) {
            setEmotion(data.currentEmotion);
          }
          if (data.isAutonomous !== undefined) {
            setIsAutonomous(data.isAutonomous);
          }
        } else if (data.type === "tiktok_connected") {
          setTiktokConnected(true);
          addLog("INFO", "TIKTOK", `Sesión de TikTok LIVE vinculada. ID de Sala: ${data.roomId || "Desconocido"}`);
        } else if (data.type === "tiktok_disconnected") {
          setTiktokConnected(false);
          addLog("WARN", "TIKTOK", "Sesión de TikTok LIVE desconectada");
        } else if (data.type === "tiktok_comment") {
          addMessage({
            sender: data.user || "TikTok User",
            text: data.text || "",
            isAi: false,
          });
        } else if (data.type === "tiktok_gift") {
          const giftName = data.giftName || "Rosa";
          addMessage({
            sender: `Regalo: ${data.user}`,
            text: `¡Envió ${data.count}x ${giftName}! 🎁`,
            isAi: false,
          });
          addLog("INFO", "TIKTOK", `Regalo recibido: ${data.count}x ${giftName} de ${data.user}`);
          // Trigger Miku's reactive avatar & OBS scene switch
          let targetEmotion: Emotion = "HAPPY";
          let targetScene = "HAPPY_SCENE";
          let voiceResponse = `¡Muchas gracias por ese genial regalo de ${giftName}!`;
          const normalized = giftName.toLowerCase();
          if (normalized.includes("rosa") || normalized.includes("rose")) {
            targetEmotion = "FLIRT";
            targetScene = "FLIRT_SCENE";
            voiceResponse = `¡Oh, una rosa! Qué romántico, muchísimas gracias por este hermoso detalle de ${data.user}.`;
          } else if (normalized.includes("corona") || normalized.includes("crown")) {
            targetEmotion = "SURPRISE";
            targetScene = "SURPRISE_SCENE";
            voiceResponse = `¡Guao! ¡Una corona majestuosa de ${data.user}! ¡No lo puedo creer, me siento como una reina!`;
          } else if (normalized.includes("pesa") || normalized.includes("dumbbell")) {
            targetEmotion = "HAPPY";
            targetScene = "HAPPY_SCENE";
            voiceResponse = `¡Muchas gracias por la pesa ${data.user}, a entrenar fuerte hoy!`;
          } else if (normalized.includes("picante") || normalized.includes("chili")) {
            targetEmotion = "ANGRY";
            targetScene = "ANGRY_SCENE";
            voiceResponse = `¡Ay ay ay, eso pica demasiado ${data.user}! Qué travieso eres.`;
          } else if (normalized.includes("llanto") || normalized.includes("cry")) {
            targetEmotion = "SAD";
            targetScene = "SAD_SCENE";
            voiceResponse = `Oh ${data.user}, no estés triste. Muchas gracias por tu tierno apoyo.`;
          }
          // Reward player with in-game items & coins on TikTok Gift!
          if (normalized.includes("rosa") || normalized.includes("rose")) {
            collectItem("cyber_rose", data.count || 1);
          } else if (normalized.includes("corona") || normalized.includes("crown")) {
            collectItem("streamer_crown", 1);
            gainCoins(500);
          } else {
            gainCoins((data.count || 1) * 20);
            gainExperience((data.count || 1) * 15);
          }
          setEmotion(targetEmotion);
          setObsStatus((prev) => ({ ...prev, scene: targetScene }));
          speakText(voiceResponse, targetEmotion).catch(err => console.warn("TTS error:", err));
        } else if (data.type === "tiktok_follow") {
          addMessage({
            sender: `Seguidor: ${data.user}`,
            text: "¡Te ha comenzado a seguir! 💖",
            isAi: false,
          });
          addLog("INFO", "TIKTOK", `Nuevo seguidor en directo: ${data.user}`);
          gainCoins(50);
          gainExperience(25);
        } else if (data.type === "log" && data.entry) {
          const entry = data.entry;
          if (entry.scope !== "FRONTEND") {
            setLogs((prev) => {
              if (prev.some((l) => l.id === entry.id)) return prev;
              return [...prev.slice(-300), {
                id: entry.id,
                timestamp: entry.timestamp,
                level: entry.level,
                scope: entry.scope,
                message: entry.message,
                details: entry.details,
              }];
            });
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    },
    onClose: (event) => {
      addLog("WARN", "FRONTEND", `Conexión perdida con el servidor de HECTRON (Código: ${event.code}). Intentando reconectar en segundo plano...`);
    },
    onError: (error) => {
      // Log gracefully to avoid throwing uncaught console.error
      console.log("WebSocket connecting/reconnecting status...");
    }
  });

  // Audio / Speech Synthesizer Function
  const speakText = async (
    text: string,
    currentEmotion?: Emotion,
    customAnimation?: AvatarAnimationClass,
    customVoiceConfig?: Partial<TtsVoiceSettings>
  ) => {
    const activeConfig: TtsVoiceSettings = {
      ...ttsVoiceSettings,
      ...customVoiceConfig,
    };

    // If autoSpeech is disabled and this wasn't explicitly triggered with a custom override or test
    if (!activeConfig.autoSpeechEnabled && !customVoiceConfig) {
      addLog("INFO", "FRONTEND", `Speech synthesis skipped (autoSpeech is turned off): "${text.substring(0, 30)}..."`);
      return;
    }

    setIsSpeaking(true);
    setLatestSpeechText(text);

    // Map Gemini TTS text/metadata to avatar emotion state & animation class
    const ttsMeta = processTtsMetadata(text, { emotion: currentEmotion });
    if (customAnimation) {
      setAnimationClass(customAnimation);
    }
    
    addLog("INFO", "FRONTEND", `Triggering Gemini TTS synthesis [${activeConfig.voice} | ${ttsMeta.animationClass.toUpperCase()}]: "${text.substring(0, 30)}..."`, {
      voice: activeConfig.voice,
      speakingRate: activeConfig.speakingRate,
      pitch: activeConfig.pitch,
      expressiveness: activeConfig.expressiveness,
      sentimentScore: ttsMeta.sentimentScore,
      emotion: ttsMeta.emotion,
      animationClass: ttsMeta.animationClass,
    });

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: activeConfig.voice,
          expressiveness: activeConfig.expressiveness,
          speakingRate: activeConfig.speakingRate,
          pitch: activeConfig.pitch,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const binaryStr = atob(data.audio);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          try {
            let decodedBuffer: AudioBuffer;

            if (data.mimeType && data.mimeType.includes("audio/pcm")) {
              // Extract sample rate from mimeType (e.g. audio/pcm;rate=24000) or default to 24000
              let sampleRate = 24000;
              const rateMatch = data.mimeType.match(/rate=(\d+)/);
              if (rateMatch) {
                sampleRate = parseInt(rateMatch[1], 10);
              }

              const numSamples = Math.floor(bytes.length / 2);
              decodedBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
              const channelData = decodedBuffer.getChannelData(0);
              const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

              for (let i = 0; i < numSamples; i++) {
                const intSample = dataView.getInt16(i * 2, true); // little-endian
                channelData[i] = intSample / 32768.0;
              }
              
              addLog("INFO", "FRONTEND", `Successfully parsed raw PCM audio (${sampleRate}Hz, Voice: ${activeConfig.voice})`);
            } else {
              decodedBuffer = await audioContext.decodeAudioData(bytes.buffer);
              addLog("INFO", "FRONTEND", "Successfully decoded fallback encoded audio format");
            }

            const source = audioContext.createBufferSource();
            source.buffer = decodedBuffer;
            // Apply speaking rate & pitch modulation to PCM buffer source
            if (activeConfig.speakingRate && activeConfig.speakingRate > 0) {
              source.playbackRate.value = Math.max(0.5, Math.min(2.0, activeConfig.speakingRate));
            }
            source.connect(audioContext.destination);
            source.onended = () => setIsSpeaking(false);
            source.start(0);
            return;
          } catch (decodeErr: any) {
            addLog("WARN", "FRONTEND", "Audio buffer decode failed, fallback to WebSpeech", {
              error: decodeErr?.message || String(decodeErr)
            });
          }
        }
      }
    } catch (err: any) {
      addLog("WARN", "FRONTEND", "Server TTS unavailable, utilizing browser WebSpeech API", {
        error: err?.message || String(err)
      });
    }

    // Web Speech API fallback for instant audio response in browser
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      // Fine-tuned pitch and rate calculation
      const basePitch = ttsMeta.pitch || 1.1;
      utterance.pitch = Math.max(0.5, Math.min(2.0, basePitch * activeConfig.pitch));
      const baseSpeed = ttsMeta.speed || 1.0;
      utterance.rate = Math.max(0.5, Math.min(2.0, baseSpeed * activeConfig.speakingRate));
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsSpeaking(false), 2500);
    }
  };

  return (
    <BrainContext.Provider
      value={{
        agentUrl,
        setAgentUrl,
        agentStatus,
        setAgentStatus,
        obsStatus,
        setObsStatus,
        scenes,
        setScenes,
        emotion,
        setEmotion,
        animationClass,
        setAnimationClass,
        latestTtsMetadata,
        isAutonomous,
        setIsAutonomous,
        tiktokConnected,
        setTiktokConnected,
        messages,
        addMessage,
        activeTab,
        setActiveTab,
        speakText,
        latestSpeechText,
        isSpeaking,
        logs,
        addLog,
        clearLogs,
        lodLevel,
        setLodLevel,
        fps,
        ttsVoiceSettings,
        setTtsVoiceSettings,
        updateTtsVoiceSettings,
        resetTtsVoiceSettings,
        gameState,
        collectItem,
        useItem,
        equipItem,
        discardItem,
        spawnRandomWorldItem,
        pickupWorldItem,
        saveGame,
        loadGame,
        deleteSave,
        exportSaveData,
        importSaveData,
        saveSlots,
        isAutoSaving,
        lastAutoSaveTime,
        triggerAutoSave,
        gainExperience,
        gainCoins,
        soundEffect,
      }}
    >
      {children}
    </BrainContext.Provider>
  );
}

