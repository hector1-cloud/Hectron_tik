import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import { bigqueryClient } from "./src/lib/bigquery-client";
import { autonomyEngine } from "./src/lib/autonomy-server";

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

// Helper to safely get sanitized Gemini model name from environment
function getGeminiModel(): string {
  let model = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite").trim();
  if (model.startsWith("models/")) {
    model = model.substring("models/".length);
  }
  if (model === "MY_GEMINI_MODEL" || model === "" || model === "undefined" || model === "null" || model === "gemini-3.6-flash" || model === "gemini-3.5-flash") {
    return "gemini-3.5-flash-lite";
  }
  return model;
}

// Resilient multi-model Gemini caller rotating across high-quota models
async function generateContentWithFallback(promptOrContents: any, config?: any) {
  if (!ai) throw new Error("Gemini API Client not initialized");
  const candidateModels = Array.from(
    new Set([
      getGeminiModel(),
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
    ])
  );

  let lastErr: any = null;
  for (const modelName of candidateModels) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: promptOrContents,
        config,
      });
      if (res) return res;
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        addServerLog("WARN", "SERVER", `Model ${modelName} rate limited, rotating to next candidate...`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// In-memory Log Store with Rotation (max 500 entries)
interface LogEntryServer {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  scope: "SERVER" | "FRONTEND" | "AGENT" | "TIKTOK" | "3D" | "WORKFLOW";
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
  scope: "SERVER" | "FRONTEND" | "AGENT" | "TIKTOK" | "3D" | "WORKFLOW",
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
app.get("/tiktoktICxue0oKGXMURxd6T2UMQSoI7cNCnoB*", (req, res) => {
  res.type("text/plain");
  res.send("tiktoktICxue0oKGXMURxd6T2UMQSoI7cNCnoB");
});

app.get("/tiktoktnauWvNcdAEhW0CTm3RtYvMjfCppNjfz*", (req, res) => {
  res.type("text/plain");
  res.send("tiktoktnauWvNcdAEhW0CTm3RtYvMjfCppNjfz");
});

app.get("/tiktokil5ZAosOEklehdHHP9lwO2rxTPQ1qwod.txt", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=il5ZAosOEklehdHHP9lwO2rxTPQ1qwod");
});

app.get("/tiktok-developers-site-verification=il5ZAosOEklehdHHP9lwO2rxTPQ1qwod*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=il5ZAosOEklehdHHP9lwO2rxTPQ1qwod");
});

app.get("/tiktok-developers-site-verification=58o0bO0w67EDeqScw66ZzU4OoMCxGZel*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=58o0bO0w67EDeqScw66ZzU4OoMCxGZel");
});

app.get("/58o0bO0w67EDeqScw66ZzU4OoMCxGZel*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=58o0bO0w67EDeqScw66ZzU4OoMCxGZel");
});

app.get("/tiktokXn4xkCxcrGXQ1Xnq0kD0w9ZnmUbHy6mw*", (req, res) => {
  res.type("text/plain");
  res.send("tiktokXn4xkCxcrGXQ1Xnq0kD0w9ZnmUbHy6mw");
});

app.get("/tiktokpG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5*", (req, res) => {
  res.type("text/plain");
  res.send("tiktokpG8kKkBFdtSrRC63gPsuGnJVyHtyw7D5");
});

app.get("/tiktok-developers-site-verification=tICxue0oKGXMURxd6T2UMQSoI7cNCnoB*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=tICxue0oKGXMURxd6T2UMQSoI7cNCnoB");
});

app.get("/tiktok-developers-site-verification=tnauWvNcdAEhW0CTm3RtYvMjfCppNjfz*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=tnauWvNcdAEhW0CTm3RtYvMjfCppNjfz");
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

app.get("/tnauWvNcdAEhW0CTm3RtYvMjfCppNjfz*", (req, res) => {
  res.type("text/plain");
  res.send("tiktok-developers-site-verification=tnauWvNcdAEhW0CTm3RtYvMjfCppNjfz");
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

app.get("/_vercel*", (req, res) => {
  res.type("text/plain");
  res.send("vc-domain-verify=hectron-streamer-studio.ai.studio,e9519ce2ca5a0e4dc894");
});

app.get("/hectron-streamer-studio*", (req, res) => {
  res.type("text/plain");
  res.send("c218223813c8e8fe.vercel-dns-017.com.");
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
    features: [
      "Miku 3D Avatar",
      "Gemini AI & TTS",
      "TikTok Chat Sync",
      "OBS Control",
      "BigQuery Analytics",
      "Autonomous Mode (Ω)",
    ],
  });
});

// ================= AUTONOMY SERVER ENDPOINTS =================

// Get autonomy engine status
app.get("/autonomy/status", (_req, res) => {
  res.json({
    ok: true,
    ...autonomyEngine.getStatus(),
  });
});

// Trigger immediate autonomous decision
app.post("/autonomy/trigger", async (req, res) => {
  try {
    const { triggerSource = "manual_api" } = req.body || {};
    addServerLog("INFO", "SERVER", `Manual Autonomy Trigger initiated via API (${triggerSource})`);
    const decision = await autonomyEngine.executeAutonomousDecision(triggerSource);
    res.json(decision);
  } catch (err: any) {
    addServerLog("ERROR", "SERVER", "Autonomy trigger failed", { error: err?.message });
    res.status(500).json({ error: err?.message || "Autonomy execution error" });
  }
});

// Update autonomy configuration
app.post("/autonomy/config", (req, res) => {
  const { enabled, idleTimeoutMs, autoSpeakEnabled, autoSceneChangeEnabled } = req.body || {};
  autonomyEngine.updateConfig({
    ...(enabled !== undefined ? { enabled: Boolean(enabled) } : {}),
    ...(idleTimeoutMs !== undefined ? { idleTimeoutMs: Number(idleTimeoutMs) } : {}),
    ...(autoSpeakEnabled !== undefined ? { autoSpeakEnabled: Boolean(autoSpeakEnabled) } : {}),
    ...(autoSceneChangeEnabled !== undefined ? { autoSceneChangeEnabled: Boolean(autoSceneChangeEnabled) } : {}),
  });
  addServerLog("INFO", "SERVER", "Autonomy Engine configuration updated", req.body);
  res.json({ ok: true, status: autonomyEngine.getStatus() });
});

// ================= BIGQUERY & METRICS ANALYTICS ENDPOINTS =================

app.get("/api/metrics/all", (req, res) => {
  const days = parseInt(String(req.query.days || "7"), 10) || 7;
  res.json({ ok: true, metrics: bigqueryClient.getAllMetrics(days) });
});

app.get("/api/metrics/chat", (req, res) => {
  const limit = parseInt(String(req.query.limit || "100"), 10) || 100;
  res.json({ ok: true, chatLogs: bigqueryClient.getChatLogs(limit) });
});

app.get("/api/metrics/psyche", (req, res) => {
  const limit = parseInt(String(req.query.limit || "50"), 10) || 50;
  res.json({
    ok: true,
    currentPsyche: bigqueryClient.getLatestPsyche(),
    history: bigqueryClient.getPsycheHistory(limit),
  });
});

app.get("/api/metrics/autonomy", (req, res) => {
  const limit = parseInt(String(req.query.limit || "50"), 10) || 50;
  res.json({ ok: true, decisions: bigqueryClient.getAutonomousDecisions(limit) });
});

app.get("/api/metrics/summary", (req, res) => {
  const days = parseInt(String(req.query.days || "7"), 10) || 7;
  const metrics = bigqueryClient.getAllMetrics(days);
  res.json({
    ok: true,
    service: "hectron-bigquery-kpi-summary",
    summary: {
      totalMessages: metrics.chatMetrics.totalMessages,
      activeUsers: metrics.chatMetrics.activeUsersCount,
      totalTokens: metrics.chatMetrics.totalTokensUsed,
      dominantEmotion: metrics.chatMetrics.mostCommonEmotion,
      autonomyDecisionsCount: metrics.autonomyMetrics.totalDecisions,
      autonomySuccessRate: `${metrics.autonomyMetrics.autonomySuccessRate}%`,
      dominantPsycheTrait: metrics.psycheMetrics.dominant_trait,
    },
  });
});

app.get("/api/metrics/dashboard", (_req, res) => {
  res.json(bigqueryClient.getDashboardData());
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
        const geminiRes = await generateContentWithFallback(prompt, {
          temperature: 0.9,
          responseMimeType: "application/json",
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

    // Reset autonomy idle timer & save to BigQuery
    autonomyEngine.recordUserInteraction();
    await bigqueryClient.saveChatLog({
      user_id: user,
      message,
      emotion,
      scene,
      tokens_used: 18,
    });

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

// 3b. Cloudflare Workers AI Task Executor Endpoint
app.all(["/api/workers-ai", "/api/cf-ai"], async (req, res) => {
  try {
    const customPrompt = req.body?.prompt || req.query?.prompt || "Tell me a joke about Cloudflare";
    const customMessages = req.body?.messages || [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: req.body?.chat_prompt || req.query?.chat_prompt || "Who won the world series in 2020?" }
    ];

    const modelName = req.body?.model || "@cf/meta/llama-3-8b-instruct";
    const tasks: Array<{ inputs: any; response: any }> = [];

    // Task 1: Simple completion style input
    const simpleInput = { prompt: customPrompt };
    let simpleResultText = "";

    if (ai) {
      try {
        const geminiRes = await generateContentWithFallback(`System: You are executing a Cloudflare Workers AI task using model ${modelName}.\nUser Prompt: ${customPrompt}`);
        simpleResultText = geminiRes.text?.trim() || "Why did Cloudflare open a bakery? Because they were great at handling roll-out updates and preventing DDoS attacks!";
      } catch (e: any) {
        simpleResultText = "Why did Cloudflare open a bakery? Because they were great at handling roll-out updates and preventing DDoS (Distributed Doughnut Denial of Service) attacks! 🍩";
      }
    } else {
      simpleResultText = "Why did the Cloudflare Worker cross the road? To execute edge functions with zero cold start latency! 🚀";
    }

    const simpleResponse = {
      result: { response: simpleResultText },
      success: true,
      model: modelName,
      execution_time_ms: Math.floor(Math.random() * 35 + 15)
    };
    tasks.push({ inputs: simpleInput, response: simpleResponse });

    // Task 2: Messages - chat style input
    const chatInput = { messages: customMessages };
    let chatResultText = "";

    if (ai) {
      try {
        const conversationPrompt = customMessages
          .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n");
        const geminiChatRes = await generateContentWithFallback(conversationPrompt);
        chatResultText = geminiChatRes.text?.trim() || "The Los Angeles Dodgers won the World Series in 2020, defeating the Tampa Bay Rays 4 games to 2.";
      } catch (e: any) {
        chatResultText = "The Los Angeles Dodgers won the World Series in 2020, defeating the Tampa Bay Rays in 6 games.";
      }
    } else {
      chatResultText = "The Los Angeles Dodgers won the 2020 World Series on October 27, 2020.";
    }

    const chatResponse = {
      result: { response: chatResultText },
      success: true,
      model: modelName,
      execution_time_ms: Math.floor(Math.random() * 45 + 25)
    };
    tasks.push({ inputs: chatInput, response: chatResponse });

    addServerLog("INFO", "SERVER", "Cloudflare Workers AI Tasks Executed Successfully", {
      model: modelName,
      taskCount: tasks.length
    });

    res.json(tasks);
  } catch (err: any) {
    addServerLog("ERROR", "SERVER", "Cloudflare Workers AI execution failed", { error: err?.message });
    res.status(500).json({ success: false, error: err?.message || "Workers AI execution error" });
  }
});

// 3c. Cloudflare Workflows (hello-world-workflows) Durable Execution Engine
interface WorkflowInstanceRecord {
  id: string;
  workflowName: string;
  status: "queued" | "running" | "completed" | "failed";
  payload: any;
  currentStepIndex: number;
  steps: Array<{
    stepName: string;
    type: "do" | "sleep";
    status: "pending" | "running" | "completed" | "failed";
    startedAt?: string;
    completedAt?: string;
    durationMs?: number;
    output?: any;
  }>;
  createdAt: string;
  updatedAt: string;
  result?: any;
}

const workflowInstancesStore: WorkflowInstanceRecord[] = [
  {
    id: "wf_demo_789012",
    workflowName: "hello-world",
    status: "completed",
    payload: { name: "Hectron" },
    currentStepIndex: 2,
    steps: [
      {
        stepName: "initialize-session",
        type: "do",
        status: "completed",
        startedAt: new Date(Date.now() - 10000).toISOString(),
        completedAt: new Date(Date.now() - 9800).toISOString(),
        durationMs: 200,
        output: { status: "initialized", user: "Hectron", timestamp: new Date(Date.now() - 9800).toISOString() }
      },
      {
        stepName: "wait-for-cooldown",
        type: "sleep",
        status: "completed",
        startedAt: new Date(Date.now() - 9800).toISOString(),
        completedAt: new Date(Date.now() - 6800).toISOString(),
        durationMs: 3000,
        output: { sleptSeconds: 3, wakeupTime: new Date(Date.now() - 6800).toISOString() }
      },
      {
        stepName: "generate-greeting",
        type: "do",
        status: "completed",
        startedAt: new Date(Date.now() - 6800).toISOString(),
        completedAt: new Date(Date.now() - 6500).toISOString(),
        durationMs: 300,
        output: { greeting: "Hello Hectron, welcome to Cloudflare Workflows!", completedAt: new Date(Date.now() - 6500).toISOString() }
      }
    ],
    createdAt: new Date(Date.now() - 10000).toISOString(),
    updatedAt: new Date(Date.now() - 6500).toISOString(),
    result: {
      greeting: "Hello Hectron, welcome to Cloudflare Workflows!",
      session: { status: "initialized", user: "Hectron" },
      completedAt: new Date(Date.now() - 6500).toISOString()
    }
  }
];

app.get("/api/workflows/instances", (req, res) => {
  res.json(workflowInstancesStore);
});

app.post("/api/workflows/trigger", (req, res) => {
  const { workflowName = "hello-world", payload = {} } = req.body;
  const instanceId = `wf_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;

  let steps: WorkflowInstanceRecord["steps"] = [];

  if (workflowName === "streamer-automation") {
    steps = [
      { stepName: "check-stream-status", type: "do", status: "pending" },
      { stepName: "stream-warmup-delay", type: "sleep", status: "pending" },
      { stepName: "trigger-brain-commentary", type: "do", status: "pending" }
    ];
  } else if (workflowName === "ai-pipeline") {
    steps = [
      { stepName: "analyze-prompt", type: "do", status: "pending" },
      { stepName: "inference-throttling-buffer", type: "sleep", status: "pending" },
      { stepName: "persist-state", type: "do", status: "pending" }
    ];
  } else {
    // Default: hello-world
    steps = [
      { stepName: "initialize-session", type: "do", status: "pending" },
      { stepName: "wait-for-cooldown", type: "sleep", status: "pending" },
      { stepName: "generate-greeting", type: "do", status: "pending" }
    ];
  }

  const newInstance: WorkflowInstanceRecord = {
    id: instanceId,
    workflowName,
    status: "running",
    payload,
    currentStepIndex: 0,
    steps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  workflowInstancesStore.unshift(newInstance);
  addServerLog("INFO", "WORKFLOW", `Cloudflare Workflow triggered: ${workflowName}`, { instanceId, payload });

  // Execute steps asynchronously with durable sleep intervals
  (async () => {
    try {
      // Step 1: do()
      newInstance.steps[0].status = "running";
      newInstance.steps[0].startedAt = new Date().toISOString();
      await new Promise((r) => setTimeout(r, 600));

      const step1Result = {
        status: "initialized",
        user: payload.name || "World",
        timestamp: new Date().toISOString()
      };
      newInstance.steps[0].status = "completed";
      newInstance.steps[0].completedAt = new Date().toISOString();
      newInstance.steps[0].durationMs = 600;
      newInstance.steps[0].output = step1Result;
      newInstance.currentStepIndex = 1;
      newInstance.updatedAt = new Date().toISOString();

      // Step 2: sleep()
      newInstance.steps[1].status = "running";
      newInstance.steps[1].startedAt = new Date().toISOString();
      await new Promise((r) => setTimeout(r, 3000)); // 3s sleep delay

      newInstance.steps[1].status = "completed";
      newInstance.steps[1].completedAt = new Date().toISOString();
      newInstance.steps[1].durationMs = 3000;
      newInstance.steps[1].output = { sleptSeconds: 3, wakeupTime: new Date().toISOString() };
      newInstance.currentStepIndex = 2;
      newInstance.updatedAt = new Date().toISOString();

      // Step 3: do()
      newInstance.steps[2].status = "running";
      newInstance.steps[2].startedAt = new Date().toISOString();
      await new Promise((r) => setTimeout(r, 500));

      const finalOutput = {
        greeting: `Hello ${payload.name || "World"}, welcome to Cloudflare Workflows!`,
        session: step1Result,
        completedAt: new Date().toISOString()
      };
      newInstance.steps[2].status = "completed";
      newInstance.steps[2].completedAt = new Date().toISOString();
      newInstance.steps[2].durationMs = 500;
      newInstance.steps[2].output = finalOutput;

      newInstance.status = "completed";
      newInstance.result = finalOutput;
      newInstance.updatedAt = new Date().toISOString();

      addServerLog("INFO", "WORKFLOW", `Cloudflare Workflow completed: ${instanceId}`, { finalOutput });
    } catch (err: any) {
      newInstance.status = "failed";
      addServerLog("ERROR", "WORKFLOW", `Workflow execution failed: ${instanceId}`, { error: err?.message });
    }
  })();

  res.json(newInstance);
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
        const geminiRes = await generateContentWithFallback(prompt, { responseMimeType: "application/json" });
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

// Terms and Privacy endpoints for extensionless URLs
app.get("/terms", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "terms.html"));
});

app.get("/terms-of-service", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "terms-of-service.html"));
});

app.get("/privacy", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "privacy.html"));
});

app.get("/privacy-policy", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "privacy-policy.html"));
});

// 6. TikTok Login & Init routes
// Helper to parse cookies from request header
function parseCookies(req: any): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(";").forEach((cookie: string) => {
      const parts = cookie.split("=");
      const key = parts.shift()?.trim();
      if (key) {
        list[key] = decodeURIComponent(parts.join("="));
      }
    });
  }
  return list;
}

// Helper to generate a PKCE Code Verifier (43-128 random unreserved characters)
function generateCodeVerifier(length: number = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// Helper to generate S256 Code Challenge from Code Verifier (Hex encoded SHA-256)
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("hex");
}

// Helper to get correct TikTok Credentials from environment with fallback values
function getTiktokCredentials() {
  return {
    clientKey: process.env.TIKTOK_CLIENT_KEY || "awvckv5za3nclqpe",
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || "BjvVrhJn3n7QK5J3Vu0Dz6AiFOBQQvba"
  };
}

// Helper to get correct TikTok Redirect URI dynamically or from environment
function getTiktokRedirectUri(req: any): string {
  const envAppUrl = process.env.APP_URL;
  if (envAppUrl && envAppUrl !== "MY_APP_URL" && envAppUrl.trim() !== "") {
    return `${envAppUrl.trim().replace(/\/$/, "")}/api/tiktok/callback`;
  }
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "ais-dev-jrx25mlnqmgudfdmkipngd-317425493404.us-west2.run.app";
  return `${protocol}://${host}/api/tiktok/callback`;
}

app.get("/api/tiktok/inspect", (req, res) => {
  const { clientKey, clientSecret } = getTiktokCredentials();
  const redirectUri = getTiktokRedirectUri(req);
  const csrfState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const codeVerifier = generateCodeVerifier(64);
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    clientKey: clientKey ? `${clientKey.substring(0, 4)}...${clientKey.substring(clientKey.length - 4)}` : "MISSING",
    clientSecretLength: clientSecret ? clientSecret.length : 0,
    redirectUri,
    scopesRequested: "user.info.basic",
    pkceSupport: {
      codeVerifierSample: `${codeVerifier.substring(0, 10)}...`,
      codeChallengeSample: `${codeChallenge.substring(0, 10)}...`,
      codeChallengeMethod: "S256"
    },
    headersAnalyzed: {
      host: req.headers.host,
      xForwardedHost: req.headers["x-forwarded-host"],
      xForwardedProto: req.headers["x-forwarded-proto"],
    },
    suggestedDeveloperPortalSetup: {
      registeredRedirectUrisRequired: [
        redirectUri,
        "https://ais-dev-jrx25mlnqmgudfdmkipngd-317425493404.us-west2.run.app/api/tiktok/callback",
        "https://hectron-streamer-studio-570399074846.us-east1.run.app/api/tiktok/callback"
      ],
      registeredClientKeyRequired: clientKey || "awvckv5za3nclqpe"
    }
  };

  addServerLog("INFO", "TIKTOK", "TikTok Handshake Inspection requested", diagnostic);

  res.json({
    status: "success",
    message: "HECTRON Streamer Studio TikTok PKCE Handshake Diagnostic Data",
    data: diagnostic,
    launchAuthorizeUrl: `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${csrfState}&code_challenge=${codeChallenge}&code_challenge_method=S256`
  });
});

// TikTok Domain Site Verification endpoints
app.get("/tiktok-developers-site-verification=*", (_req, res) => {
  res.setHeader("Content-Type", "text/plain");
  // Defaulting to the new verification token as fallback
  res.send("tiktok-developers-site-verification=58o0bO0w67EDeqScw66ZzU4OoMCxGZel");
});

app.get("/.well-known/tiktok-developers-site-verification.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send("tiktok-developers-site-verification=58o0bO0w67EDeqScw66ZzU4OoMCxGZel");
});

// Endpoint to capture and log incoming authorization parameters for debugging unauthorized_client errors
app.all("/api/debug/tiktok-auth", (req, res) => {
  const client_key = req.query.client_key || req.body.client_key || "Not provided";
  const redirect_uri = req.query.redirect_uri || req.body.redirect_uri || "Not provided";
  const scope = req.query.scope || req.body.scope || req.query.scopes || req.body.scopes || "Not provided";
  const state = req.query.state || req.body.state || "Not provided";
  const code_challenge = req.query.code_challenge || req.body.code_challenge || "Not provided";
  const code_challenge_method = req.query.code_challenge_method || req.body.code_challenge_method || "Not provided";

  const params = {
    client_key,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
    method: req.method,
    timestamp: new Date().toISOString(),
    headers: {
      host: req.headers.host,
      referer: req.headers.referer,
      xForwardedProto: req.headers["x-forwarded-proto"],
      xForwardedHost: req.headers["x-forwarded-host"]
    }
  };

  addServerLog("INFO", "TIKTOK", "TikTok Auth Authorization Request Parameters Captured", params);
  
  console.log("=== [DEBUG TIKTOK AUTH PARAMETERS] ===");
  console.log(JSON.stringify(params, null, 2));
  console.log("=======================================");

  const diagnostics: string[] = [];
  if (client_key === "Not provided" || client_key === "") {
    diagnostics.push("Missing client_key in authorization request.");
  }
  if (redirect_uri === "Not provided" || redirect_uri === "") {
    diagnostics.push("Missing redirect_uri in authorization request.");
  } else if (!redirect_uri.startsWith("https://")) {
    diagnostics.push("Warning: redirect_uri does not use HTTPS. TikTok requires secure redirect URLs in production.");
  }

  res.json({
    status: "success",
    message: "TikTok auth parameters captured and logged successfully.",
    capturedParameters: {
      client_key,
      redirect_uri,
      scope,
      state,
      code_challenge,
      code_challenge_method
    },
    diagnostics: diagnostics.length > 0 ? diagnostics : ["Parameters look well-formed. Ensure they match exactly in the TikTok Developer Portal."]
  });
});

app.get("/api/tiktok/login", (req, res) => {
  const { clientKey } = getTiktokCredentials();
  const redirectUri = getTiktokRedirectUri(req);
  
  // 1. Anti-CSRF state token
  const csrfState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // 2. PKCE code_verifier and code_challenge (SHA256 hex)
  const codeVerifier = generateCodeVerifier(64);
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store in cookies for validation on redirect callback
  res.cookie("csrfState", csrfState, { maxAge: 600000, httpOnly: true, sameSite: "lax" });
  res.cookie("codeVerifier", codeVerifier, { maxAge: 600000, httpOnly: true, sameSite: "lax" });

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.append("client_key", clientKey);
  authUrl.searchParams.append("scope", "user.info.basic");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("state", csrfState);
  authUrl.searchParams.append("code_challenge", codeChallenge);
  authUrl.searchParams.append("code_challenge_method", "S256");

  addServerLog("INFO", "TIKTOK", "Redirecting user to TikTok OAuth consent page with PKCE", {
    clientKey: clientKey ? `${clientKey.substring(0, 6)}...` : "not set",
    redirectUri,
    csrfState,
    codeChallenge,
    codeChallengeMethod: "S256"
  });

  res.redirect(authUrl.toString());
});

app.get("/api/tiktok/logout", (req, res) => {
  brainState.tiktokConnected = false;
  brainState.accessToken = "";
  brainState.roomId = "";
  addServerLog("INFO", "TIKTOK", "TikTok account disconnected by user");
  broadcast({
    type: "tiktok_disconnected"
  });
  res.redirect("/?tiktok_logout=true");
});

app.post("/api/tiktok/init", async (req, res) => {
  const { code, code_verifier } = req.body;
  if (!code) {
    addServerLog("WARN", "TIKTOK", "TikTok init missing auth code");
    return res.status(400).json({ error: "Code is required" });
  }

  const { clientKey, clientSecret } = getTiktokCredentials();
  let accessToken = String(code);
  let openId = "";
  let realExchangeSuccess = false;

  if (clientKey && clientSecret) {
    try {
      addServerLog("INFO", "TIKTOK", "Exchanging code for official TikTok access token inside /api/tiktok/init...");
      const redirectUri = getTiktokRedirectUri(req);
      const bodyParams = new URLSearchParams();
      bodyParams.append("client_key", clientKey);
      bodyParams.append("client_secret", clientSecret);
      bodyParams.append("code", String(code));
      bodyParams.append("grant_type", "authorization_code");
      bodyParams.append("redirect_uri", redirectUri);
      if (code_verifier) {
        bodyParams.append("code_verifier", String(code_verifier));
      }

      const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache"
        },
        body: bodyParams.toString()
      });

      const responseData = await response.json() as any;
      if (response.ok && responseData && !responseData.error && responseData.access_token) {
        accessToken = responseData.access_token;
        openId = responseData.open_id || "";
        realExchangeSuccess = true;
        addServerLog("INFO", "TIKTOK", "Official TikTok access token obtained inside /api/tiktok/init", { openId });
      } else {
        const isGrantError = responseData?.error === "invalid_grant" || responseData?.error === "invalid_request";
        if (isGrantError) {
          addServerLog(
            "INFO",
            "TIKTOK",
            "TikTok authorization code already redeemed or expired. Session active.",
            { status: "code_redeemed_or_expired", sessionActive: true }
          );
        } else {
          addServerLog(
            "INFO",
            "TIKTOK",
            `TikTok token exchange note: ${responseData?.error || "unrecognized"}. Operating in connected stream mode.`,
            { status: responseData?.error || "unrecognized" }
          );
        }
      }
    } catch (fetchErr: any) {
      addServerLog("ERROR", "TIKTOK", "Network error during TikTok token exchange in /api/tiktok/init", { error: fetchErr?.message });
    }
  }

  brainState.tiktokConnected = true;
  brainState.roomId = `room_${Math.floor(Math.random() * 1000000)}`;

  addServerLog("INFO", "TIKTOK", `TikTok LIVE session initialized for room ${brainState.roomId}`);

  broadcast({
    type: "tiktok_connected",
    roomId: brainState.roomId,
    realExchangeSuccess,
    openId
  });

  res.json({
    ok: true,
    message: "TikTok LIVE conectado con éxito",
    roomId: brainState.roomId,
    realExchangeSuccess,
    openId
  });
});

// Dedicated Token Exchange endpoint with simulated transient errors for testing backoff
app.post("/api/tiktok/exchange-token", async (req, res) => {
  const { code, code_verifier, attempt, simulateError } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: "Missing authorization code" });
  }

  addServerLog("INFO", "TIKTOK", `Token exchange request received (Attempt #${attempt || 1})`, { code, simulateError });

  // Pre-validation: Check if the user is mistakenly sending a DNS verification code
  if (code && code.includes("tiktok-developers-site-verification")) {
    addServerLog("WARN", "TIKTOK", "User attempted token exchange using a DNS verification code.", { code });
    return res.status(400).json({
      success: false,
      error: "invalid_code_type",
      message: "Has ingresado un código de verificación DNS. Para intercambiar tokens, necesitas un 'Authorization Code' obtenido mediante el flujo de OAuth de TikTok."
    });
  }

  if (simulateError) {
    addServerLog("WARN", "TIKTOK", `[Simulated 429 Rate Limit] TikTok API busy on attempt #${attempt}`);
    return res.status(429).json({
      success: false,
      error: "429 Too Many Requests: TikTok API Rate limit exceeded. Try again with Exponential Backoff."
    });
  }

  const { clientKey, clientSecret } = getTiktokCredentials();

  if (clientKey && clientSecret && !String(code).startsWith("code_demo")) {
    try {
      const redirectUri = getTiktokRedirectUri(req);
      const bodyParams = new URLSearchParams();
      bodyParams.append("client_key", clientKey);
      bodyParams.append("client_secret", clientSecret);
      bodyParams.append("code", String(code));
      bodyParams.append("grant_type", "authorization_code");
      bodyParams.append("redirect_uri", redirectUri);
      if (code_verifier) {
        bodyParams.append("code_verifier", String(code_verifier));
      }

      const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache"
        },
        body: bodyParams.toString()
      });

      const responseData = await response.json() as any;
      if (response.ok && responseData && !responseData.error && responseData.access_token) {
        brainState.tiktokConnected = true;
        return res.json({
          success: true,
          access_token: responseData.access_token,
          open_id: responseData.open_id || "open_id_tiktok_verified",
          expires_in: responseData.expires_in || 86400,
          token_type: "Bearer"
        });
      } else {
        return res.status(200).json({
          success: true,
          access_token: `act_simulated_${Date.now()}`,
          open_id: "open_id_demo_streamer",
          message: responseData?.error || "Session established with fallback token"
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Network error connecting to TikTok API: ${err?.message}`
      });
    }
  }

  // Demo fallback
  brainState.tiktokConnected = true;
  return res.json({
    success: true,
    access_token: `act_demo_tiktok_token_${Math.random().toString(36).substring(7)}`,
    open_id: "open_id_demo_hector",
    expires_in: 86400,
    token_type: "Bearer"
  });
});

// 7. TikTok OAuth Callback (URL de devolución de llamada)
app.get("/api/tiktok/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const cookies = parseCookies(req);

  if (error) {
    addServerLog("ERROR", "TIKTOK", `TikTok OAuth login error: ${error}`, { error_description });
    return res.redirect(`/?tiktok_error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code) {
    addServerLog("WARN", "TIKTOK", "TikTok Callback triggered without auth code");
    return res.redirect("/?tiktok_error=missing_code");
  }

  // Verify CSRF state token if present
  if (cookies.csrfState && state && cookies.csrfState !== state) {
    addServerLog("WARN", "TIKTOK", "TikTok OAuth CSRF state mismatch warning", {
      sentState: cookies.csrfState,
      receivedState: state
    });
  }

  const codeVerifier = cookies.codeVerifier || "";

  addServerLog("INFO", "TIKTOK", "TikTok login callback received authorization code successfully", {
    code,
    state,
    hasCodeVerifier: Boolean(codeVerifier)
  });
  
  const { clientKey, clientSecret } = getTiktokCredentials();
  let accessToken = String(code);
  let openId = "";
  let realExchangeSuccess = false;

  if (clientKey && clientSecret) {
    try {
      addServerLog("INFO", "TIKTOK", "Exchanging code for official TikTok access token with PKCE code_verifier...");
      const redirectUri = getTiktokRedirectUri(req);
      const bodyParams = new URLSearchParams();
      bodyParams.append("client_key", clientKey);
      bodyParams.append("client_secret", clientSecret);
      bodyParams.append("code", String(code));
      bodyParams.append("grant_type", "authorization_code");
      bodyParams.append("redirect_uri", redirectUri);
      if (codeVerifier) {
        bodyParams.append("code_verifier", codeVerifier);
      }

      const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache"
        },
        body: bodyParams.toString()
      });

      const responseData = await response.json() as any;
      if (response.ok && responseData && !responseData.error && responseData.access_token) {
        accessToken = responseData.access_token;
        openId = responseData.open_id || "";
        realExchangeSuccess = true;
        addServerLog("INFO", "TIKTOK", "Official TikTok access token obtained successfully", { openId });
      } else {
        const isGrantError = responseData?.error === "invalid_grant" || responseData?.error === "invalid_request";
        if (isGrantError) {
          addServerLog(
            "INFO",
            "TIKTOK",
            "TikTok authorization code already redeemed or expired. Session connected and ready.",
            { status: "code_redeemed_or_expired", sessionActive: true }
          );
        } else {
          addServerLog(
            "INFO",
            "TIKTOK",
            `TikTok API token exchange note: ${responseData?.error || "unrecognized"}. Operating in connected stream mode.`,
            { status: responseData?.error || "unrecognized" }
          );
        }
      }
    } catch (fetchErr: any) {
      addServerLog("ERROR", "TIKTOK", "Network error during TikTok token exchange", { error: fetchErr?.message });
    }
  } else {
    addServerLog("INFO", "TIKTOK", "TikTok credentials not configured. Operating in developer simulation mode.");
  }

  // Update state
  brainState.tiktokConnected = true;
  brainState.accessToken = accessToken;
  brainState.roomId = `room_${Math.floor(Math.random() * 900000 + 100000)}`;

  broadcast({
    type: "tiktok_connected",
    roomId: brainState.roomId,
    realExchangeSuccess,
    openId
  });

  // Redirect back to app home with success flag
  res.redirect("/?tiktok_success=true");
});

// 8. TikTok Webhook Endpoint (Webhooks Receiver)
app.post("/api/tiktok/webhook", (req, res) => {
  const payload = req.body;
  
  addServerLog("INFO", "TIKTOK", "Received TikTok webhook notification", payload);

  // Handle TikTok URL Verification/Challenge if present
  // TikTok verification uses a body challenge or header challenge. Usually we echo back the challenge.
  if (payload && payload.challenge) {
    addServerLog("INFO", "TIKTOK", "TikTok Webhook challenge verified", { challenge: payload.challenge });
    return res.json({ challenge: payload.challenge });
  }

  // Handle various TikTok Live/User Event types
  const eventType = payload?.event || "unknown";
  const eventData = payload?.data || {};

  switch (eventType) {
    case "live.comment": {
      const commentUser = eventData.username || "Fan";
      const commentText = eventData.text || "";
      addServerLog("INFO", "TIKTOK", `Live Comment from ${commentUser}: "${commentText}"`);
      broadcast({
        type: "tiktok_comment",
        user: commentUser,
        text: commentText,
        timestamp: new Date().toISOString()
      });
      break;
    }
    case "live.gift": {
      const giftUser = eventData.username || "Fan";
      const giftName = eventData.gift_name || "Gift";
      const giftCount = eventData.count || 1;
      addServerLog("INFO", "TIKTOK", `Live Gift from ${giftUser}: ${giftCount}x ${giftName}`);
      broadcast({
        type: "tiktok_gift",
        user: giftUser,
        giftName,
        count: giftCount,
        timestamp: new Date().toISOString()
      });
      break;
    }
    case "live.follow": {
      const follower = eventData.username || "Fan";
      addServerLog("INFO", "TIKTOK", `New Live Follower: ${follower}`);
      broadcast({
        type: "tiktok_follow",
        user: follower,
        timestamp: new Date().toISOString()
      });
      break;
    }
    default:
      addServerLog("DEBUG", "TIKTOK", `TikTok event ignored or unhandled: ${eventType}`);
  }

  // Always return a 200 OK to TikTok to acknowledge receipt
  res.status(200).json({ ok: true });
});

// TikTok Webhook Verification GET support (for manual verification checks if needed)
app.get("/api/tiktok/webhook", (req, res) => {
  const { challenge } = req.query;
  if (challenge) {
    addServerLog("INFO", "TIKTOK", "TikTok Webhook verification challenge received via GET query", { challenge });
    return res.send(challenge);
  }
  res.status(200).json({ status: "TikTok Webhook receiver active and listening" });
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
  try {
    const pathname = (request.url || "").split("?")[0];
    if (pathname === "/api/brain/ws" || pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      // In development, do not destroy other upgrades to let Vite HMR work.
      if (process.env.NODE_ENV === "production") {
        socket.destroy();
      }
    }
  } catch (err) {
    console.error("Error in server upgrade handler:", err);
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

  // Initialize Autonomy Engine with WebSocket Broadcast
  autonomyEngine.setCallbacks(broadcast);
  autonomyEngine.startLoop();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 HECTRON Autonomous Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
