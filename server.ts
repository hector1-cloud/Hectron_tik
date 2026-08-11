import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client server-side
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// In-memory Log Store with Rotation (max 500 entries)
interface LogEntryServer {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  scope: "SERVER" | "FRONTEND" | "AGENT" | "TIKTOK" | "3D";
  message: string;
  details?: any;
}

const MAX_LOGS = 500;
const logsStore: LogEntryServer[] = [];

// WebSocket clients pool
const wsClients = new Set<WebSocket>();

function broadcast(data: object) {
  const payload = JSON.stringify(data);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function addServerLog(
  level: "INFO" | "WARN" | "ERROR" | "DEBUG",
  scope: "SERVER" | "FRONTEND" | "AGENT" | "TIKTOK" | "3D",
  message: string,
  details?: any
) {
  const entry: LogEntryServer = {
    id: Math.random().toString(36).substring(2, 10),
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    details,
  };

  logsStore.push(entry);
  if (logsStore.length > MAX_LOGS) {
    logsStore.splice(0, logsStore.length - MAX_LOGS);
  }

  // Console output
  const prefix = `[${entry.timestamp}] [${level}] [${scope}]`;
  if (level === "ERROR") {
    console.error(prefix, message, details ? JSON.stringify(details) : "");
  } else if (level === "WARN") {
    console.warn(prefix, message, details ? JSON.stringify(details) : "");
  } else {
    console.log(prefix, message, details ? JSON.stringify(details) : "");
  }

  // Broadcast to WS clients
  broadcast({ type: "log", entry });
}

// Initial System Log
addServerLog("INFO", "SERVER", "HECTRON Streamer Studio backend initialized with structured logger");

// Brain State
const brainState = {
  currentEmotion: "IDLE",
  currentScene: "DEFAULT",
  lastMessageTime: Date.now(),
  isStreaming: false,
  tiktokConnected: false,
  isAutonomous: true,
  accessToken: null as string | null,
  roomId: null as string | null,
};

// Emotion mapped scene defaults
const EMOTION_SCENES: Record<string, string> = {
  HAPPY: "HAPPY_SCENE",
  SAD: "SAD_SCENE",
  ANGRY: "ANGRY_SCENE",
  SURPRISE: "SURPRISE_SCENE",
  FLIRT: "FLIRT_SCENE",
  IDLE: "DEFAULT",
};

// ================= LOGGING API ENDPOINTS =================

// Get logs with optional filters (level, scope, search, limit)
app.get("/api/logs", (req, res) => {
  const { level, scope, search, limit = "100" } = req.query;
  let filtered = [...logsStore];

  if (level) {
    filtered = filtered.filter((l) => l.level === String(level).toUpperCase());
  }
  if (scope) {
    filtered = filtered.filter((l) => l.scope === String(scope).toUpperCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter((l) => l.message.toLowerCase().includes(q));
  }

  const numLimit = Math.min(Math.max(parseInt(String(limit), 10) || 100, 1), 500);
  const sliced = filtered.slice(-numLimit);

  res.json({
    total: logsStore.length,
    count: sliced.length,
    logs: sliced,
  });
});

// Post a log from client or agent
app.post("/api/logs", (req, res) => {
  const { level = "INFO", scope = "FRONTEND", message, details } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  addServerLog(
    level as "INFO" | "WARN" | "ERROR" | "DEBUG",
    scope as "SERVER" | "FRONTEND" | "AGENT" | "TIKTOK" | "3D",
    message,
    details
  );

  res.json({ ok: true });
});

// Clear logs
app.delete("/api/logs", (_req, res) => {
  logsStore.length = 0;
  addServerLog("INFO", "SERVER", "Log buffer cleared by user request");
  res.json({ ok: true });
});

// Serve public files statically
app.use(express.static(path.join(process.cwd(), "public")));

// TikTok Developers Site Verification
app.get("/tiktok-developers-site-verification=tICxue0oKGXMURxd6T2UMQSoI7cNCnoB*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=tICxue0oKGXMURxd6T2UMQSoI7cNCnoB");
});

app.get("/tiktok-developers-site-verification=Xn4xkCxcrGXQ1Xnq0kD0w9ZnmUbHy6mw*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=Xn4xkCxcrGXQ1Xnq0kD0w9ZnmUbHy6mw");
});

app.get("/tiktok-developers-site-verification=pG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=pG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5");
});

app.get("/tiktok-developers-site-verification=tiktokpG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=tiktokpG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5");
});

app.get("/tiktok-developers-site-verification*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=pG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5");
});

app.get("/tICxue0oKGXMURxd6T2UMQSoI7cNCnoB*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=tICxue0oKGXMURxd6T2UMQSoI7cNCnoB");
});

app.get("/Xn4xkCxcrGXQ1Xnq0kD0w9ZnmUbHy6mw*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=Xn4xkCxcrGXQ1Xnq0kD0w9ZnmUbHy6mw");
});

app.get("/pG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=pG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5");
});

app.get("/tiktok3HwgJOPP0WfqAzuy9CWxoU6cJ6El9Hkm*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok3HwgJOPP0WfqAzuy9CWxoU6cJ6El9Hkm");
});

app.get("/tiktokpG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5*", (req, res) => {
  res.type("text/plain");
  res.send("tiktokpG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5");
});

// ================= API ENDPOINTS =================

// 1. Health check
app.get("/api/health", (_req, res) => {
  addServerLog("DEBUG", "SERVER", "Health check queried");
  res.json({
    ok: true,
    service: "hectron-autonomous-v3.2",
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(apiKey),
    features: ["Miku 3D Avatar", "Gemini AI & TTS", "TikTok Chat Sync", "OBS Control"],
  });
});

// 2. TTS Generation Route using Gemini 3.1 TTS or Fallbacks
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "Kore" } = req.body;
    if (!text) {
      addServerLog("WARN", "SERVER", "TTS request missing text parameter");
      return res.status(400).json({ error: "Text parameter is required" });
    }

    addServerLog("INFO", "SERVER", `Generating TTS audio for text: "${text.substring(0, 40)}..."`);

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: `Say cheerfully in Spanish: ${text}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });

        const base64Audio =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (base64Audio) {
          addServerLog("INFO", "SERVER", "Gemini 3.1 TTS audio generated successfully");
          return res.json({
            ok: true,
            audio: base64Audio,
            mimeType: "audio/pcm;rate=24000",
            source: "gemini-tts",
          });
        }
      } catch (geminiError: any) {
        addServerLog("WARN", "SERVER", "Gemini TTS model failed, testing ElevenLabs fallback", {
          error: geminiError?.message,
        });
      }
    }

    // Fallback: ElevenLabs if key available
    if (process.env.ELEVENLABS_API_KEY) {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
      const elRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.7, similarity_boost: 0.8 },
          }),
        }
      );

      if (elRes.ok) {
        const arrayBuf = await elRes.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuf).toString("base64");
        addServerLog("INFO", "SERVER", "ElevenLabs fallback TTS synthesized audio successfully");
        return res.json({
          ok: true,
          audio: base64Audio,
          mimeType: "audio/mp3",
          source: "elevenlabs",
        });
      } else {
        addServerLog("WARN", "SERVER", "ElevenLabs TTS request failed", { status: elRes.status });
      }
    }

    // If no server keys available, notify client to use Web Speech Synthesis fallback
    addServerLog("INFO", "SERVER", "Delegating speech synthesis to Web Speech API client fallback");
    return res.json({
      ok: true,
      audio: null,
      fallbackClientSpeech: true,
      text,
    });
  } catch (err: any) {
    addServerLog("ERROR", "SERVER", "TTS endpoint internal error", { error: err?.message });
    res.status(500).json({ error: err?.message || "TTS error" });
  }
});

// 3. AI Chat Brain Handler
app.post("/api/chat", async (req, res) => {
  try {
    const { message, user = "Anónimo" } = req.body;
    if (!message) {
      addServerLog("WARN", "SERVER", "Chat request missing message payload");
      return res.status(400).json({ error: "El mensaje es obligatorio" });
    }

    addServerLog("INFO", "SERVER", `Processing incoming chat message from [${user}]: "${message}"`);

    let emotion = "IDLE";
    let responseText = "¡Hola! Gracias por acompañarme en el stream. 💙";
    let scene = "DEFAULT";

    if (ai) {
      const prompt = `
Eres HECTRON, una streamer virtual carismática, dulce y profesional con la apariencia de Miku Hatsune. Estás haciendo un directo en TikTok LIVE.
El usuario "${user}" te envía este mensaje en el chat: "${message}"

INSTRUCCIONES CRÍTICAS:
1. Responde de forma muy natural, expresiva y en español (máximo 25 palabras).
2. Usa emojis azules/cian (💙, 🎤, ✨, 🎵, 🌟).
3. Selecciona una emoción adecuada entre: HAPPY, SAD, ANGRY, SURPRISE, FLIRT, IDLE.
4. Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "emotion": "HAPPY",
  "scene": "HAPPY_SCENE",
  "response": "¡Muchas gracias por tu mensaje! Me alegra mucho verte aquí hoy. 💙"
}
`;

      try {
        const geminiRes = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          contents: prompt,
          config: {
            temperature: 0.9,
            responseMimeType: "application/json",
          },
        });

        const raw = geminiRes.text || "{}";
        const parsed = JSON.parse(raw);
        emotion = parsed.emotion || "HAPPY";
        responseText = parsed.response || responseText;
        scene = parsed.scene || EMOTION_SCENES[emotion] || "DEFAULT";
        addServerLog("INFO", "SERVER", `Gemini Brain response computed`, { emotion, scene, responseText });
      } catch (aiErr: any) {
        addServerLog("WARN", "SERVER", "Gemini Brain AI call failed, utilizing safe fallback response", {
          error: aiErr?.message,
        });
        emotion = "HAPPY";
        responseText = `¡Gracias por tu mensaje, ${user}! Me encanta platicar con ustedes. 💙✨`;
        scene = "HAPPY_SCENE";
      }
    } else {
      addServerLog("INFO", "SERVER", "No GEMINI_API_KEY detected, generating simulated Miku chat response");
      const emotionsList = ["HAPPY", "FLIRT", "SURPRISE"];
      emotion = emotionsList[Math.floor(Math.random() * emotionsList.length)];
      scene = EMOTION_SCENES[emotion] || "DEFAULT";
      responseText = `¡Hola ${user}! Qué emoción leerte en el chat. ¡Miku Streamer al habla! 🎤💙`;
    }

    brainState.currentEmotion = emotion;
    brainState.currentScene = scene;
    brainState.lastMessageTime = Date.now();

    // Broadcast update over WebSocket to overlay/dashboard
    broadcast({
      type: "message",
      sender: `HECTRON (Miku)`,
      user,
      text: responseText,
      emotion,
      scene,
      timestamp: new Date().toISOString(),
    });

    res.json({
      emotion,
      scene,
      response: responseText,
      user,
    });
  } catch (error: any) {
    addServerLog("ERROR", "SERVER", "Chat endpoint exception", { error: error?.message });
    res.status(500).json({ error: error?.message || "Internal chat error" });
  }
});

// 4. Brain Initiative (Proactive commentary)
app.post("/api/brain/initiative", async (_req, res) => {
  try {
    addServerLog("INFO", "SERVER", "Proactive Brain Initiative trigger received");
    let responseText = "¡Gracias a todos por conectarse al directo de hoy! Miku está lista para cantar. 🎵💙";
    let emotion = "HAPPY";

    if (ai) {
      const prompt = `
Genera una frase proactiva y coqueta corta de streamer virtual Miku Hatsune para interactuar con su audiencia en TikTok LIVE.
En español, máximo 20 palabras, con emojis cian/azules. Devuelve JSON:
{
  "emotion": "FLIRT",
  "response": "¡Si me mandan regalitos en TikTok, canto mi canción favorita para ustedes! 💙🎤"
}
`;
      try {
        const geminiRes = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(geminiRes.text || "{}");
        responseText = parsed.response || responseText;
        emotion = parsed.emotion || "FLIRT";
        addServerLog("INFO", "SERVER", `Proactive speech generated: "${responseText}"`);
      } catch (err: any) {
        addServerLog("WARN", "SERVER", "Initiative AI call failed", { error: err?.message });
      }
    }

    brainState.currentEmotion = emotion;
    brainState.lastMessageTime = Date.now();

    broadcast({
      type: "initiative",
      text: responseText,
      emotion,
      timestamp: new Date().toISOString(),
    });

    res.json({ ok: true, response: responseText, emotion });
  } catch (error: any) {
    addServerLog("ERROR", "SERVER", "Initiative error", { error: error?.message });
    res.status(500).json({ error: error?.message || "Initiative error" });
  }
});

// 5. State getters & setters
app.get("/api/brain/state", (_req, res) => {
  res.json(brainState);
});

// 6. TikTok Init route
app.post("/api/tiktok/init", (req, res) => {
  const { code } = req.body;
  if (!code) {
    addServerLog("WARN", "TIKTOK", "TikTok init missing auth code");
    return res.status(400).json({ error: "Code is required" });
  }
  brainState.tiktokConnected = true;
  brainState.roomId = `room_${Math.floor(Math.random() * 1000000)}`;

  addServerLog("INFO", "TIKTOK", `TikTok LIVE session initialized for room ${brainState.roomId}`);

  broadcast({
    type: "tiktok_connected",
    roomId: brainState.roomId,
  });

  res.json({
    ok: true,
    message: "TikTok LIVE conectado con éxito",
    roomId: brainState.roomId,
  });
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket Server for real-time brain updates
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  wsClients.add(ws);
  ws.send(JSON.stringify({ type: "state", ...brainState }));

  ws.on("close", () => {
    wsClients.delete(ws);
  });
});

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  if (pathname === "/api/brain/ws" || pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start server with Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 HECTRON Autonomous Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
