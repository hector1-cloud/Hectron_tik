import { createContext, useState, useEffect, ReactNode } from "react";
import { BrainContextType, Emotion, ObsStatus, ChatMessage, LogEntry, LogLevel, LogScope } from "./types";

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
  const [emotion, setEmotion] = useState<Emotion>("HAPPY");
  const [isAutonomous, setIsAutonomous] = useState<boolean>(true);
  const [tiktokConnected, setTiktokConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "overlay" | "agent" | "tiktok" | "logs" | "performance">("dashboard");

  // LOD & FPS state for 3D optimization
  const [lodLevel, setLodLevel] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [fps, setFps] = useState<number>(60);

  // Structured Log Buffer
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init_1",
      timestamp: new Date().toISOString(),
      level: "INFO",
      scope: "FRONTEND",
      message: "Client application mounted & BrainContext initialized",
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

  // Audio / Speech Synthesizer Function
  const speakText = async (text: string, currentEmotion?: Emotion) => {
    setIsSpeaking(true);
    setLatestSpeechText(text);
    addLog("INFO", "FRONTEND", `Triggering speech synthesis: "${text.substring(0, 30)}..."`);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "Kore" }),
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
            const decodedBuffer = await audioContext.decodeAudioData(bytes.buffer);
            const source = audioContext.createBufferSource();
            source.buffer = decodedBuffer;
            source.connect(audioContext.destination);
            source.onended = () => setIsSpeaking(false);
            source.start(0);
            return;
          } catch (decodeErr) {
            addLog("WARN", "FRONTEND", "PCM buffer decode failed, fallback to WebSpeech", decodeErr);
          }
        }
      }
    } catch (err) {
      addLog("WARN", "FRONTEND", "Server TTS unavailable, utilizing browser WebSpeech API", err);
    }

    // Web Speech API fallback for instant audio response in browser
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.pitch = 1.35; // High pitch for cute anime Miku voice
      utterance.rate = 1.05;
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
      }}
    >
      {children}
    </BrainContext.Provider>
  );
}

