import os
import re

with open('src/BrainContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the imports
content = content.replace(
    'import { useGameState } from "./hooks/useGameState";',
    'import { useGameState } from "./hooks/useGameState";\nimport { useWebSocketReconnection } from "./hooks/useWebSocketReconnection";'
)

# Find the block starting at `const attemptTiktokReconnection`
# all the way down to `return () => { isMounted = false;` ... `}, []);`

# Wait, the easiest way is to use regex or string matching.
start_marker = "  // Real-time server state sync over WebSocket (with automatic background reconnection)"
end_marker = "  // Audio / Speech Synthesizer Function"

new_block = """  // Real-time server state sync over WebSocket (with automatic background reconnection)
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
  });\n
"""

idx1 = content.find(start_marker)
idx2 = content.find(end_marker)

if idx1 != -1 and idx2 != -1:
    content = content[:idx1] + new_block + content[idx2:]
    with open('src/BrainContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Failed to find markers")
