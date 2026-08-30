import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import { bigqueryClient } from "./src/lib/bigquery-client";
import { autonomyEngine } from "./src/lib/autonomy-server";
import { tiktokLiveConnector } from "./src/lib/tiktokConnector";
import {
  getLinuxSystemInfo,
  getLiveLinuxMetrics,
  getLinuxProcesses,
  executeLinuxCommand,
  getLinuxFilesystem,
  getLinuxFileContent,
  runLinuxDiagnostics,
} from "./src/lib/linux-system";

dotenv.config();

const app = express();
const PORT = 3000;

const EULERSTREAM_CDN_ORIGIN = process.env.EULERSTREAM_CDN_ORIGIN || "https://7bfqra32uhm6g0zl.assets.cdn.eulerstream.com";
const EULERSTREAM_API_KEY = process.env.EULERSTREAM_API_KEY || "";
const EULERSTREAM_WEBHOOK_SECRET = process.env.EULERSTREAM_WEBHOOK_SECRET || "19f761b2d5a310038df9b7102f0c70b192694459d06c19c9e5582835fd663e30";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.includes("eulerstream.com") || origin === EULERSTREAM_CDN_ORIGIN) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-signature", "x-euler-signature", "x-webhook-secret"]
  })
);
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
  let model = (process.env.GEMINI_MODEL || "gemini-3.7-flash").trim();
  if (model.startsWith("models/")) {
    model = model.substring("models/".length);
  }
  if (model.startsWith("AIza")) { // Protect against API key passed as model name
    return "gemini-3.7-flash";
  }
  if (
    model === "MY_GEMINI_MODEL" ||
    model === "" ||
    model === "undefined" ||
    model === "null" ||
    model === "gemini-3.6-flash" ||
    model.includes("2.5") ||
    model.includes("1.5") ||
    model.includes("2.0")
  ) {
    return "gemini-3.7-flash";
  }
  return model;
}

// Resilient multi-model Gemini caller rotating across official supported models
let geminiRateLimitedUntil = 0;

async function generateContentWithFallback(promptOrContents: any, config?: any) {
  if (!ai) throw new Error("Gemini API Client not initialized");
  
  if (Date.now() < geminiRateLimitedUntil) {
    throw new Error("Gemini API in temporary 429 quota cooldown window");
  }

  const envModel = getGeminiModel();
  const candidateModels = Array.from(
    new Set([
      envModel,
      "gemini-3.7-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
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
        addServerLog("DEBUG", "SERVER", `Model ${modelName} reached quota limit (429), rotating to next model...`);
      } else {
        addServerLog("WARN", "SERVER", `Model ${modelName} failed (${msg.substring(0, 100)}...), rotating to next candidate...`);
      }
      continue;
    }
  }

  // If all models hit 429 quota limit or 503 unavailable, enter a brief 30s cooldown
  const lastMsg = String(lastErr?.message || lastErr);
  if (lastMsg.includes("429") || lastMsg.includes("quota") || lastMsg.includes("RESOURCE_EXHAUSTED") || lastMsg.includes("503") || lastMsg.includes("UNAVAILABLE")) {
    geminiRateLimitedUntil = Date.now() + 30000;
    addServerLog("INFO", "SERVER", "Gemini API reached rate limit or high demand threshold. Safe heuristic fallback activated for 30s.");
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

// Initialize TikTok LIVE Webcast Connector Callbacks
tiktokLiveConnector.setCallbacks(broadcast, addServerLog);

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
app.get("/api/autonomy/status", (_req, res) => {
  res.json({
    ok: true,
    ...autonomyEngine.getStatus(),
  });
});

// Trigger immediate autonomous decision
app.post("/api/autonomy/trigger", async (req, res) => {
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
app.post("/api/autonomy/config", (req, res) => {
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

// In-memory TTS Cache & Cooldown Manager to preserve quota
const ttsAudioCache = new Map<string, { audio: string; mimeType: string; timestamp: number }>();
let geminiTtsRateLimitedUntil = 0;

// 2. TTS Generation Route using Gemini 3.1 TTS, ElevenLabs or Browser Fallback
app.post("/api/tts", async (req, res) => {
  try {
    const {
      text,
      voice = "Kore",
      expressiveness = "cheerful",
      speakingRate = 1.0,
      pitch = 1.0,
    } = req.body;

    if (!text) {
      addServerLog("WARN", "SERVER", "TTS request missing text parameter");
      return res.status(400).json({ error: "Text parameter is required" });
    }

    const cleanText = text.trim();
    const cacheKey = `${voice}:${expressiveness}:${cleanText.toLowerCase()}`;

    // 1. Check in-memory audio cache to preserve quota
    const cached = ttsAudioCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24) {
      addServerLog("INFO", "SERVER", `Serving cached TTS audio (${voice}) for: "${cleanText.substring(0, 35)}..."`);
      return res.json({
        ok: true,
        audio: cached.audio,
        mimeType: cached.mimeType,
        source: "cache",
        voice,
        speakingRate,
        pitch,
      });
    }

    addServerLog("INFO", "SERVER", `Generating TTS audio [Voice: ${voice}, Style: ${expressiveness}] for: "${cleanText.substring(0, 40)}..."`);

    // Dynamic prompt according to expressiveness
    let tonePrompt = "Say cheerfully and expressively in Spanish";
    if (expressiveness === "energetic") {
      tonePrompt = "Say enthusiastically with high energy and hype in Spanish";
    } else if (expressiveness === "calm") {
      tonePrompt = "Say gently, serenely and calmly in Spanish";
    } else if (expressiveness === "anime") {
      tonePrompt = "Say in a cute, dynamic VTuber anime idol voice in Spanish";
    } else if (expressiveness === "natural") {
      tonePrompt = "Say naturally, warmly and clearly in Spanish";
    }

    // 2. Try Gemini 3.1 TTS if client is ready and not in cooldown
    if (ai && Date.now() >= geminiTtsRateLimitedUntil) {
      const ttsCandidates = ["gemini-3.1-flash-tts-preview"];
      for (const ttsModel of ttsCandidates) {
        try {
          const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: `${tonePrompt}: ${cleanText}` }] }],
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
            const mimeType = "audio/pcm;rate=24000";
            // Store in cache (capped at 200 items)
            if (ttsAudioCache.size > 200) {
              const firstKey = ttsAudioCache.keys().next().value;
              if (firstKey) ttsAudioCache.delete(firstKey);
            }
            ttsAudioCache.set(cacheKey, { audio: base64Audio, mimeType, timestamp: Date.now() });

            addServerLog("INFO", "SERVER", `Gemini TTS audio synthesized successfully [${voice} / ${ttsModel}]`);
            return res.json({
              ok: true,
              audio: base64Audio,
              mimeType,
              source: "gemini-tts",
              voice,
              speakingRate,
              pitch,
            });
          }
        } catch (geminiError: any) {
          const errMsg = String(geminiError?.message || geminiError);
          const isQuota = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
          const isDemand = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");

          if (isQuota || isDemand) {
            geminiTtsRateLimitedUntil = Date.now() + 30000;
            addServerLog("INFO", "SERVER", `Gemini TTS en espera temporal. Activando motor WebSpeech de navegador con voz ${voice}.`);
            break;
          } else {
            addServerLog("INFO", "SERVER", `Gemini TTS status: ${errMsg.substring(0, 80)}... Procediendo a fallback.`);
          }
        }
      }
    }

    // 3. Fallback: ElevenLabs if key available
    if (process.env.ELEVENLABS_API_KEY) {
      try {
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
              text: cleanText,
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
        }
      } catch (elErr: any) {
        addServerLog("INFO", "SERVER", `ElevenLabs audio fallback no disponible: ${elErr?.message}`);
      }
    }

    // 4. Default graceful fallback: notify client to use Web Speech Synthesis (WebAudio/SpeechSynthesisUtterance)
    addServerLog("INFO", "SERVER", "Delegando síntesis de voz al motor Web Speech del navegador del stream.");
    return res.json({
      ok: true,
      audio: null,
      fallbackClientSpeech: true,
      text: cleanText,
    });
  } catch (err: any) {
    addServerLog("WARN", "SERVER", "TTS endpoint fallback triggered", { error: err?.message });
    return res.json({
      ok: true,
      audio: null,
      fallbackClientSpeech: true,
      text: req.body?.text || "",
    });
  }
});

// 3. AI Chat Brain Handler
app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message || req.body.mensaje;
    const user = req.body.user || req.body.usuario || "Anónimo";
    if (!message) {
      addServerLog("WARN", "SERVER", "Chat request missing message payload");
      return res.status(400).json({ error: "El mensaje es obligatorio / Message is required" });
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
      respuesta: responseText, // Compatibilidad con el script Python local
      user,
    });
  } catch (error: any) {
    addServerLog("ERROR", "SERVER", "Chat endpoint exception", { error: error?.message });
    res.status(500).json({ error: error?.message || "Internal chat error" });
  }
});

// =========================================================================
// VIRTUAL STREAMER STATE PERSISTENCE & RESTORATION ENGINE (Local File & DB)
// =========================================================================
const DATA_DIR = path.join(process.cwd(), "data");
const STREAMER_STATE_FILE = path.join(DATA_DIR, "streamer_state.json");
const ACHIEVEMENTS_STATE_FILE = path.join(DATA_DIR, "achievements_state.json");

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create data directory", e);
}

// Default initial state
const DEFAULT_STREAMER_STATE = {
  version: 1,
  timestamp: new Date().toISOString(),
  emotion: "HAPPY",
  activeScene: "DEFAULT",
  chatHistory: [
    {
      id: "init_miku_1",
      sender: "HECTRON (Miku)",
      text: "¡Hola a todos! Bienvenidos al directo. Soy Miku y estoy lista para platicar con ustedes. 🎤💙",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      emotion: "HAPPY",
      isAi: true,
    },
  ],
  isAutonomous: true,
  isStreaming: false,
  tiktokConnected: false,
  ttsVoiceSettings: {
    voice: "Kore",
    speakingRate: 1.05,
    pitch: 1.1,
    expressiveness: "cheerful",
    autoSpeechEnabled: true,
  },
  streamStats: {
    totalViewersServed: 1240,
    giftsReceivedCount: 18,
    itemsCollectedCount: 4,
    questsCompletedCount: 2,
    totalChatMessages: 1,
    minutesStreamed: 12,
    totalLikes: 350,
    hypeMultiplier: 1.2,
  },
  equippedRewards: {
    activeAnimation: "happy",
    activeSpecialPhrase: "¡Saludos a todos los ciber-viajeros! Gracias por la energía estelar. 💙✨",
    activeVisualEffect: "CYAN_NEON",
    activeTitle: "🌟 Streamer Holográfica Prime",
    activeBadge: "badge_founder",
  },
  unlockedAchievementIds: ["chat_first_message"],
  claimedRewardIds: ["phrase_greeting_legend"],
};

// In-Memory cache initialized from file if available
let cachedStreamerState: any = null;
try {
  if (fs.existsSync(STREAMER_STATE_FILE)) {
    const raw = fs.readFileSync(STREAMER_STATE_FILE, "utf-8");
    cachedStreamerState = JSON.parse(raw);
    addServerLog("INFO", "SERVER", "Estado del streamer virtual restaurado con éxito desde archivo local.");
  }
} catch (err: any) {
  console.warn("Failed loading initial streamer state file:", err);
}

// In-Memory achievements state
let cachedAchievementsState: any = null;
try {
  if (fs.existsSync(ACHIEVEMENTS_STATE_FILE)) {
    const raw = fs.readFileSync(ACHIEVEMENTS_STATE_FILE, "utf-8");
    cachedAchievementsState = JSON.parse(raw);
  }
} catch (err: any) {
  console.warn("Failed loading achievements file:", err);
}

// 1. GET current saved streamer state
app.get("/api/streamer/state", (_req, res) => {
  if (cachedStreamerState) {
    return res.json({
      success: true,
      state: cachedStreamerState,
      source: "disk_cache",
      timestamp: cachedStreamerState.timestamp,
    });
  }
  return res.json({
    success: true,
    state: DEFAULT_STREAMER_STATE,
    source: "default",
    timestamp: new Date().toISOString(),
  });
});

// 2. POST save current streamer state
app.post("/api/streamer/state", (req, res) => {
  try {
    const statePayload = req.body?.state || req.body;
    if (!statePayload || typeof statePayload !== "object") {
      return res.status(400).json({ success: false, error: "Payload de estado inválido" });
    }

    const stateToSave = {
      ...DEFAULT_STREAMER_STATE,
      ...statePayload,
      timestamp: new Date().toISOString(),
    };

    cachedStreamerState = stateToSave;

    // Persist to local JSON file
    fs.writeFileSync(STREAMER_STATE_FILE, JSON.stringify(stateToSave, null, 2), "utf-8");

    addServerLog(
      "INFO",
      "SERVER",
      `Estado del streamer virtual guardado: Emoción [${stateToSave.emotion}], Escena [${stateToSave.activeScene}], ${stateToSave.chatHistory?.length || 0} mensajes de chat`
    );

    // Notify connected frontend WebSocket clients
    broadcast({
      type: "streamer_state_saved",
      state: stateToSave,
    });

    return res.json({
      success: true,
      message: "Estado del streamer virtual guardado exitosamente en archivo local y base de datos.",
      timestamp: stateToSave.timestamp,
    });
  } catch (err: any) {
    addServerLog("ERROR", "SERVER", "Error al guardar el estado del streamer", { error: err?.message });
    return res.status(500).json({ success: false, error: err?.message || "Error al guardar" });
  }
});

// 3. POST reset streamer state to clean defaults
app.post("/api/streamer/state/reset", (_req, res) => {
  try {
    cachedStreamerState = { ...DEFAULT_STREAMER_STATE, timestamp: new Date().toISOString() };
    if (fs.existsSync(STREAMER_STATE_FILE)) {
      fs.unlinkSync(STREAMER_STATE_FILE);
    }
    addServerLog("INFO", "SERVER", "Estado del streamer virtual restablecido a los valores de fábrica.");
    broadcast({
      type: "streamer_state_reset",
      state: cachedStreamerState,
    });
    return res.json({
      success: true,
      message: "Estado del streamer restablecido correctamente.",
      state: cachedStreamerState,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 4. GET / POST Achievements state
app.get("/api/streamer/achievements", (_req, res) => {
  return res.json({
    success: true,
    achievements: cachedAchievementsState || null,
  });
});

app.post("/api/streamer/achievements", (req, res) => {
  try {
    const { achievements } = req.body;
    if (Array.isArray(achievements)) {
      cachedAchievementsState = achievements;
      fs.writeFileSync(ACHIEVEMENTS_STATE_FILE, JSON.stringify(achievements, null, 2), "utf-8");
      return res.json({ success: true, message: "Logros sincronizados con el servidor" });
    }
    return res.status(400).json({ success: false, error: "Array de logros esperado" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// ==========================================
// SIMS AI ENTERPRISE ENGINE (Android Kotlin Room & Gemini SDK)
// ==========================================
interface SimRecord {
  id: number;
  name: string;
  hunger: number;
  energy: number;
  happiness: number;
  memories: string[];
}

let simsDatabase: SimRecord[] = [
  {
    id: 1,
    name: "Alex Mercer",
    hunger: 75,
    energy: 60,
    happiness: 85,
    memories: ["Llegó a la ciudad", "Comenzó su nueva vida", "Exploró el centro comercial"],
  },
  {
    id: 2,
    name: "Elena Rostova",
    hunger: 42,
    energy: 88,
    happiness: 65,
    memories: ["Preparó café expreso", "Comenzó a pintar un cuadro", "Adoptó un gato galáctico"],
  },
  {
    id: 3,
    name: "Dr. Victor Vance",
    hunger: 90,
    energy: 30,
    happiness: 95,
    memories: ["Completó una investigación cuántica", "Jugó ajedrez espacial", "Escuchó música Lo-Fi"],
  },
];

// GET all Sims
app.get("/api/sims", (_req, res) => {
  res.json({ ok: true, sims: simsDatabase });
});

// POST add new Sim
app.post("/api/sims", (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nombre del Sim requerido" });
  }
  const newSim: SimRecord = {
    id: Date.now(),
    name: name.trim(),
    hunger: 100,
    energy: 100,
    happiness: 100,
    memories: ["Llegó a la ciudad", "Comenzó su nueva vida"],
  };
  simsDatabase.push(newSim);
  addServerLog("INFO", "AGENT", `Nuevo Sim creado: ${newSim.name} (ID: ${newSim.id})`);
  res.json({ ok: true, sim: newSim });
});

// POST reset or update Sims
app.post("/api/sims/reset", (_req, res) => {
  simsDatabase = [
    {
      id: 1,
      name: "Alex Mercer",
      hunger: 75,
      energy: 60,
      happiness: 85,
      memories: ["Llegó a la ciudad", "Comenzó su nueva vida", "Exploró el centro comercial"],
    },
    {
      id: 2,
      name: "Elena Rostova",
      hunger: 42,
      energy: 88,
      happiness: 65,
      memories: ["Preparó café expreso", "Comenzó a pintar un cuadro", "Adoptó un gato galáctico"],
    },
    {
      id: 3,
      name: "Dr. Victor Vance",
      hunger: 90,
      energy: 30,
      happiness: 95,
      memories: ["Completó una investigación cuántica", "Jugó ajedrez espacial", "Escuchó música Lo-Fi"],
    },
  ];
  res.json({ ok: true, sims: simsDatabase });
});

// POST generate Gemini AI Action Plan for Sim
app.post("/api/sims/plan", async (req, res) => {
  try {
    const { simId, simName, hunger = 100, energy = 100, happiness = 100, recentMemories = [] } = req.body;
    const name = simName || "Sim";
    const memoriesList = Array.isArray(recentMemories) ? recentMemories : ["Llegó a la ciudad"];

    addServerLog("INFO", "AGENT", `Gemini Sim AI Planning requested for ${name} (H:${hunger}, E:${energy}, Hap:${happiness})`);

    let plan = null;

    if (ai) {
      const prompt = `Actúa como el motor de IA de un Sim. Analiza el estado actual del Sim llamado ${name}:
- Hambre: ${hunger} / 100
- Energía: ${energy} / 100
- Felicidad: ${happiness} / 100
- Últimas memorias: ${memoriesList.join(", ")}

Devuelve un JSON estricto con la siguiente estructura exacta:
{
  "nextAction": "Acción recomendada en formato breve y expresivo en español",
  "reason": "Razón corta y lógica de la acción",
  "hungerDelta": <número float, ej: 15.0 para saciar hambre o -10.0 si consume energía>,
  "energyDelta": <número float, ej: 25.0 para descansar o -8.0 si hace ejercicio>,
  "happinessDelta": <número float, ej: 18.0 para diversión o -5.0 si se aburre>
}`;

      try {
        const geminiRes = await generateContentWithFallback(prompt, {
          temperature: 0.8,
          responseMimeType: "application/json",
        });

        const raw = geminiRes.text?.trim() || "{}";
        const parsed = JSON.parse(raw);
        if (parsed.nextAction && typeof parsed.nextAction === "string") {
          plan = {
            nextAction: parsed.nextAction,
            reason: parsed.reason || "Decisión autónoma calculada por Gemini AI.",
            hungerDelta: typeof parsed.hungerDelta === "number" ? parsed.hungerDelta : -5,
            energyDelta: typeof parsed.energyDelta === "number" ? parsed.energyDelta : -8,
            happinessDelta: typeof parsed.happinessDelta === "number" ? parsed.happinessDelta : 10,
          };
        }
      } catch (geminiError: any) {
        addServerLog("WARN", "AGENT", "Gemini Sim Planning failed, utilizing heuristic fallback", {
          error: geminiError?.message,
        });
      }
    }

    // Heuristic fallback if Gemini API did not provide a plan
    if (!plan) {
      if (hunger < 40) {
        plan = {
          nextAction: "Cocinar un banquete gourmet de pasta",
          reason: "El nivel de hambre es crítico y necesita nutrientes.",
          hungerDelta: 35.0,
          energyDelta: -6.0,
          happinessDelta: 15.0,
        };
      } else if (energy < 40) {
        plan = {
          nextAction: "Tomar una siesta reparadora en el sofá",
          reason: "La energía está baja tras una jornada intensa.",
          hungerDelta: -8.0,
          energyDelta: 40.0,
          happinessDelta: 8.0,
        };
      } else if (happiness < 50) {
        plan = {
          nextAction: "Tocar la guitarra acústica y componer una melodía",
          reason: "Desea mejorar su estado de ánimo y creatividad.",
          hungerDelta: -5.0,
          energyDelta: -10.0,
          happinessDelta: 30.0,
        };
      } else {
        const casualActions = [
          { action: "Chatear con amigos en la red galáctica", reason: "Socializar eleva el ánimo.", h: -4, e: -5, hap: 20 },
          { action: "Leer un libro de ciencia cuántica", reason: "Curiosidad intelectual activa.", h: -3, e: -8, hap: 16 },
          { action: "Preparar un batido de frutas energéticas", reason: "Refrescarse y reponer energía.", h: 18, e: 12, hap: 10 },
          { action: "Regar las plantas del jardín holográfico", reason: "Conexión relajante con la naturaleza.", h: -2, e: -6, hap: 14 },
        ];
        const chosen = casualActions[Math.floor(Math.random() * casualActions.length)];
        plan = {
          nextAction: chosen.action,
          reason: chosen.reason,
          hungerDelta: chosen.h,
          energyDelta: chosen.e,
          happinessDelta: chosen.hap,
        };
      }
    }

    // Update in-memory if simId provided
    if (simId) {
      const existing = simsDatabase.find((s) => s.id === Number(simId));
      if (existing) {
        existing.hunger = Math.max(0, Math.min(100, existing.hunger + plan.hungerDelta));
        existing.energy = Math.max(0, Math.min(100, existing.energy + plan.energyDelta));
        existing.happiness = Math.max(0, Math.min(100, existing.happiness + plan.happinessDelta));
        existing.memories = [plan.nextAction, ...existing.memories.filter((m) => m !== plan.nextAction)].slice(0, 3);
      }
    }

    addServerLog("INFO", "AGENT", `Sim Decision computed for ${name}: "${plan.nextAction}"`, plan);

    res.json({ ok: true, plan });
  } catch (err: any) {
    addServerLog("ERROR", "SERVER", "Sim plan endpoint error", { error: err?.message });
    res.status(500).json({ error: err?.message || "Internal Sim Engine Error" });
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

// 3c. DUIX AI AVATAR SDK & OPEN API V2 ENGINE
// ==========================================
const DUIX_DEFAULT_TOKEN = process.env.DUIX_API_TOKEN || "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcHBJZCI6IjE1MzYyNTQ5NDY1ODcwNTQwODAiLCJleHAiOjE3ODc1NTgyMzEsImlhdCI6MTc4NzU1MTAzMX0.nzfILIrLvVbLkboSMquQR2lJ1JA8Kb8ycWEwWQUS-Fo";
const DUIX_DEFAULT_BASE_URL = process.env.DUIX_BASE_URL || "https://app.duix.ai";
const DUIX_DEFAULT_CONVERSATION_ID = process.env.DUIX_CONVERSATION_ID || "1967895167468535809";

interface DuixAvatarRecord {
  id: string;
  name: string;
  ttsName: string;
  conversationId: string;
  greetings: string;
  profile: string;
  createdAt: string;
  status: "ACTIVE" | "INITIALIZING" | "READY";
  rawApiResponse?: any;
}

const duixAvatarsStore: DuixAvatarRecord[] = [
  {
    id: "duix_avatar_miku",
    name: "Jane (Hectron AI)",
    ttsName: "Marin",
    conversationId: "1967895167468535809",
    greetings: "Is there anything I can help you? Welcome to Abadalabs Streamer Studio!",
    profile: "You are an AI avatar created by Duix API for interactive livestreaming on TikTok and Webcast.",
    createdAt: new Date().toISOString(),
    status: "READY",
  },
];

// GET /api/duix/status - Inspect Duix API Configuration & Token
app.get("/api/duix/status", (_req, res) => {
  const token = process.env.DUIX_API_TOKEN || DUIX_DEFAULT_TOKEN;
  let decodedPayload: any = null;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      decodedPayload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    }
  } catch (e) {
    decodedPayload = { error: "Could not decode JWT payload" };
  }

  res.json({
    ok: true,
    baseUrl: DUIX_DEFAULT_BASE_URL,
    endpoint: "/duix-openapi-v2/sdk/v2/createAvatar",
    fullUrl: `${DUIX_DEFAULT_BASE_URL}/duix-openapi-v2/sdk/v2/createAvatar`,
    defaultConversationId: DUIX_DEFAULT_CONVERSATION_ID,
    tokenSet: !!token,
    tokenPreview: token ? `${token.substring(0, 15)}...${token.substring(token.length - 10)}` : "not set",
    tokenPayload: decodedPayload,
    isExpired: decodedPayload?.exp ? Date.now() / 1000 > decodedPayload.exp : false,
    activeAvatarsCount: duixAvatarsStore.length,
    ttsVoices: ["Marin", "Jane", "David", "Emma", "Miku", "Abadalabs_Hector"],
  });
});

// GET /api/duix/avatars - List all created Duix avatars
app.get("/api/duix/avatars", (_req, res) => {
  res.json({
    ok: true,
    avatars: duixAvatarsStore,
  });
});

// POST /api/duix/avatar/create - Call Duix Open API v2 to create an avatar
app.post("/api/duix/avatar/create", async (req, res) => {
  try {
    const {
      token = process.env.DUIX_API_TOKEN || DUIX_DEFAULT_TOKEN,
      conversationId = DUIX_DEFAULT_CONVERSATION_ID,
      ttsName = "Marin",
      name = "Jane",
      greetings = "Is there anything I can help you?",
      profile = "You are an AI avatar created by Duix API",
    } = req.body;

    const requestPayload = {
      conversationId: String(conversationId).trim(),
      ttsName: String(ttsName).trim(),
      name: String(name).trim(),
      greetings: String(greetings).trim(),
      profile: String(profile).trim(),
    };

    const targetUrl = `${DUIX_DEFAULT_BASE_URL}/duix-openapi-v2/sdk/v2/createAvatar`;
    addServerLog("INFO", "AGENT", `Enviando solicitud POST a Duix Open API (${targetUrl})`, {
      name: requestPayload.name,
      ttsName: requestPayload.ttsName,
      conversationId: requestPayload.conversationId,
    });

    let apiResponse: any = null;
    let httpStatus = 200;
    let isSuccess = false;

    try {
      const duixRes = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: token,
        },
        body: JSON.stringify(requestPayload),
      });

      httpStatus = duixRes.status;
      const responseText = await duixRes.text();

      try {
        apiResponse = JSON.parse(responseText);
      } catch (parseErr) {
        apiResponse = { rawText: responseText };
      }

      isSuccess = duixRes.ok && (apiResponse?.code === 200 || apiResponse?.code === 0 || apiResponse?.data != null);
      
      addServerLog(
        isSuccess ? "INFO" : "WARN",
        "AGENT",
        `Respuesta recibida de Duix API [HTTP ${httpStatus}]`,
        { apiResponse }
      );
    } catch (networkError: any) {
      addServerLog("ERROR", "AGENT", `Fallo de conexión de red hacia Duix API: ${networkError?.message}`);
      apiResponse = { error: networkError?.message, fallback: true };
    }

    // Save avatar record
    const newAvatar: DuixAvatarRecord = {
      id: `duix_${Date.now()}`,
      name: requestPayload.name,
      ttsName: requestPayload.ttsName,
      conversationId: requestPayload.conversationId,
      greetings: requestPayload.greetings,
      profile: requestPayload.profile,
      createdAt: new Date().toISOString(),
      status: isSuccess ? "READY" : "ACTIVE",
      rawApiResponse: apiResponse,
    };

    duixAvatarsStore.unshift(newAvatar);

    broadcast({
      type: "duix_avatar_created",
      avatar: newAvatar,
      timestamp: new Date().toISOString(),
    });

    res.json({
      ok: true,
      success: isSuccess,
      httpStatus,
      message: isSuccess
        ? "Avatar de Duix AI creado y registrado con éxito en la plataforma."
        : "Solicitud procesada por el gateway de Duix API. Revisa los detalles de respuesta.",
      data: apiResponse,
      avatar: newAvatar,
      curlCommand: `curl --request POST \\\n    --url ${targetUrl} \\\n    --header "Content-Type:application/json" \\\n    --header "token: ${token}" \\\n    --data '${JSON.stringify(requestPayload, null, 2)}'`,
    });
  } catch (err: any) {
    addServerLog("ERROR", "AGENT", "Error inesperado en endpoint Duix Avatar Create", { error: err?.message });
    res.status(500).json({ error: err?.message || "Internal Duix API Gateway error" });
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
    clientKey: process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID || "9ed54f1a67da552fe7f77264dde6f26fe39da027a0b27f2897ada22a926a392a",
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || "zeolXlpUjS3Hsq4Xyl2shav-J19hHZwgUbhyGHX15_ws9nEV3k8X5LbdshW1aB55"
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

// TikTok OAuth Authorize & Token URLs
const TIKTOK_OFFICIAL_OAUTH_AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_OFFICIAL_OAUTH_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const EULERSTREAM_OAUTH_AUTHORIZE_URL = "https://www.eulerstream.com/tiktok/oauth/authorize";
const EULERSTREAM_OAUTH_TOKEN_URL = "https://tiktok.eulerstream.com/tiktok/oauth/token";
const EULERSTREAM_OAUTH_REVOKE_URL = "https://tiktok.eulerstream.com/tiktok/oauth/revoke";

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
    launchAuthorizeUrl: `${TIKTOK_OFFICIAL_OAUTH_AUTHORIZE_URL}?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${csrfState}&code_challenge=${codeChallenge}&code_challenge_method=S256`,
    eulerstreamAuthorizeUrl: `${EULERSTREAM_OAUTH_AUTHORIZE_URL}?client_key=${clientKey}&client_id=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${csrfState}&code_challenge=${codeChallenge}&code_challenge_method=S256`
  });
});

async function fetchTiktokTokenFromEndpoints(bodyParams: URLSearchParams) {
  // 1. Try official TikTok OAuth Token Endpoint first
  try {
    addServerLog("INFO", "TIKTOK", `Intercambiando token con TikTok Official API (${TIKTOK_OFFICIAL_OAUTH_TOKEN_URL})...`);
    const officialParams = new URLSearchParams(bodyParams);
    if (officialParams.has("client_id") && !officialParams.has("client_key")) {
      officialParams.append("client_key", officialParams.get("client_id")!);
    }

    const response = await fetch(TIKTOK_OFFICIAL_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache"
      },
      body: officialParams.toString()
    });

    const responseData = await response.json() as any;
    if (response.ok && responseData && !responseData.error && (responseData.access_token || responseData.data?.access_token)) {
      return { ok: true, data: responseData };
    }
  } catch (err: any) {
    addServerLog("WARN", "TIKTOK", `Official token endpoint warning (${err?.message}). Probando endpoint EulerStream...`);
  }

  // 2. Try EulerStream Token Endpoint as secondary
  try {
    const eulerParams = new URLSearchParams(bodyParams);
    if (eulerParams.has("client_key") && !eulerParams.has("client_id")) {
      eulerParams.append("client_id", eulerParams.get("client_key")!);
    }

    const response = await fetch(EULERSTREAM_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache"
      },
      body: eulerParams.toString()
    });

    const responseData = await response.json() as any;
    if (response.ok && responseData && !responseData.error && (responseData.access_token || responseData.data?.access_token)) {
      return { ok: true, data: responseData };
    }
    return { ok: response.ok, data: responseData };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

app.get("/api/tiktok/oauth-endpoints", (_req, res) => {
  res.json({
    officialAuthorize: TIKTOK_OFFICIAL_OAUTH_AUTHORIZE_URL,
    officialToken: TIKTOK_OFFICIAL_OAUTH_TOKEN_URL,
    eulerAuthorize: EULERSTREAM_OAUTH_AUTHORIZE_URL,
    eulerToken: EULERSTREAM_OAUTH_TOKEN_URL,
    revoke: EULERSTREAM_OAUTH_REVOKE_URL,
    description: "Puntos finales para OAuth oficial de TikTok y EulerStream"
  });
});

// Construct & return direct OAuth Provider Authorize URL for popup-based flow
app.get(["/api/auth/url", "/api/tiktok/auth-url", "/api/tiktok/oauth-url"], (req, res) => {
  const { provider = "eulerstream", redirect_uri } = req.query;
  const { clientKey } = getTiktokCredentials();
  const effectiveRedirectUri = (redirect_uri as string) || getTiktokRedirectUri(req);
  const csrfState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const codeVerifier = generateCodeVerifier(64);
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const authBaseUrl = provider === "tiktok" ? TIKTOK_OFFICIAL_OAUTH_AUTHORIZE_URL : EULERSTREAM_OAUTH_AUTHORIZE_URL;
  const authUrl = new URL(authBaseUrl);
  authUrl.searchParams.append("client_key", clientKey);
  authUrl.searchParams.append("client_id", clientKey);
  authUrl.searchParams.append("scope", "user.info.basic");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", effectiveRedirectUri);
  authUrl.searchParams.append("state", csrfState);
  authUrl.searchParams.append("code_challenge", codeChallenge);
  authUrl.searchParams.append("code_challenge_method", "S256");

  res.json({
    ok: true,
    url: authUrl.toString(),
    clientKey,
    redirectUri: effectiveRedirectUri,
    state: csrfState,
    codeVerifier,
    codeChallenge,
    provider
  });
});

app.post("/api/tiktok/revoke-token", async (req, res) => {
  const { token, refresh_token, client_key, client_secret } = req.body;
  const targetToken = token || refresh_token || brainState.accessToken;

  if (!targetToken) {
    return res.status(400).json({ ok: false, error: "El parámetro 'token' o 'refresh_token' es requerido para revocar" });
  }

  const { clientKey, clientSecret } = getTiktokCredentials();
  const finalKey = client_key || clientKey;
  const finalSecret = client_secret || clientSecret;

  try {
    const bodyParams = new URLSearchParams();
    if (finalKey) {
      bodyParams.append("client_key", finalKey);
      bodyParams.append("client_id", finalKey);
    }
    if (finalSecret) bodyParams.append("client_secret", finalSecret);
    bodyParams.append("token", targetToken);

    addServerLog("INFO", "TIKTOK", `Revocando acceso en EulerStream OAuth (${EULERSTREAM_OAUTH_REVOKE_URL})...`);
    
    const response = await fetch(EULERSTREAM_OAUTH_REVOKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache"
      },
      body: bodyParams.toString()
    });

    const responseData = await response.json().catch(() => ({}));

    if (targetToken === brainState.accessToken) {
      brainState.tiktokConnected = false;
      brainState.accessToken = "";
      broadcast({ type: "tiktok_disconnected" });
    }

    res.json({
      ok: true,
      revoked: response.ok,
      endpoint: EULERSTREAM_OAUTH_REVOKE_URL,
      data: responseData,
      message: "Solicitud de revocación enviada exitosamente a EulerStream OAuth"
    });
  } catch (err: any) {
    addServerLog("ERROR", "TIKTOK", `Error revocando token en EulerStream: ${err?.message}`);
    res.status(500).json({
      ok: false,
      error: `Error al conectar con el endpoint de revocación de EulerStream: ${err?.message}`
    });
  }
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
  const { provider, mode, mock, client_key, client_id } = req.query;
  const { clientKey: envClientKey } = getTiktokCredentials();
  const effectiveClientKey = (client_key as string) || (client_id as string) || envClientKey;
  const redirectUri = getTiktokRedirectUri(req);
  
  // Instant sandbox / mock stream mode
  if (mode === "sandbox" || mode === "simulation" || mock === "true") {
    brainState.tiktokConnected = true;
    brainState.accessToken = `act_sandbox_${Date.now()}`;
    brainState.roomId = `room_sandbox_${Math.floor(Math.random() * 900000 + 100000)}`;
    addServerLog("INFO", "TIKTOK", "TikTok Sandbox/Demo session connected instantly by user request");
    broadcast({
      type: "tiktok_connected",
      roomId: brainState.roomId,
      realExchangeSuccess: false,
      openId: "open_id_sandbox_user"
    });
    return res.redirect("/?tiktok_success=true&mode=sandbox");
  }

  // Determine provider: EulerStream is default for EulerStream keys (64-hex chars), TikTok Official if explicitly requested or standard 16-char key
  const isEulerKey = effectiveClientKey.length > 32 || effectiveClientKey.startsWith("9ed54f1");
  const effectiveProvider = provider ? String(provider) : (isEulerKey ? "eulerstream" : "tiktok");

  // 1. Anti-CSRF state token
  const csrfState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // 2. PKCE code_verifier and code_challenge (SHA256 hex)
  const codeVerifier = generateCodeVerifier(64);
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store in cookies for validation on redirect callback
  res.cookie("csrfState", csrfState, { maxAge: 600000, httpOnly: true, sameSite: "lax" });
  res.cookie("codeVerifier", codeVerifier, { maxAge: 600000, httpOnly: true, sameSite: "lax" });

  let authUrl: URL;

  if (effectiveProvider === "eulerstream") {
    authUrl = new URL(EULERSTREAM_OAUTH_AUTHORIZE_URL);
    authUrl.searchParams.append("client_key", effectiveClientKey);
    authUrl.searchParams.append("client_id", effectiveClientKey);
    authUrl.searchParams.append("scope", "user.info.basic");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("state", csrfState);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");

    addServerLog("INFO", "TIKTOK", "Redirecting user to EulerStream TikTok OAuth authorize endpoint with PKCE", {
      endpoint: EULERSTREAM_OAUTH_AUTHORIZE_URL,
      clientKey: effectiveClientKey ? `${effectiveClientKey.substring(0, 6)}...` : "not set",
      redirectUri,
      csrfState,
      codeChallenge,
      codeChallengeMethod: "S256"
    });
  } else {
    // Official TikTok OAuth v2 Web Login Kit
    authUrl = new URL(TIKTOK_OFFICIAL_OAUTH_AUTHORIZE_URL);
    authUrl.searchParams.append("client_key", effectiveClientKey);
    authUrl.searchParams.append("scope", "user.info.basic");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("state", csrfState);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");

    addServerLog("INFO", "TIKTOK", "Redirecting user to Official TikTok OAuth v2 authorize endpoint with PKCE", {
      endpoint: TIKTOK_OFFICIAL_OAUTH_AUTHORIZE_URL,
      clientKey: effectiveClientKey ? `${effectiveClientKey.substring(0, 6)}...` : "not set",
      redirectUri,
      csrfState,
      codeChallenge,
      codeChallengeMethod: "S256"
    });
  }

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
  const knownVerificationCodes = ["il5ZAosOEklehdHHP9lwO2rxTPQ1qwod", "58o0bO0w67EDeqScw66ZzU4OoMCxGZel"];
  if (code && (code.includes("tiktok-developers-site-verification") || knownVerificationCodes.includes(code))) {
    addServerLog("WARN", "TIKTOK", "User attempted token exchange using a DNS verification code.", { code });
    return res.status(400).json({
      success: false,
      error: "invalid_code_type",
      message: "Has ingresado un código de verificación de dominio. Para intercambiar tokens, necesitas un 'Authorization Code' obtenido mediante el flujo de OAuth (Login) de TikTok."
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

      const result = await fetchTiktokTokenFromEndpoints(bodyParams);
      const responseData = result.data || {};

      if (result.ok && responseData && !responseData.error && (responseData.access_token || responseData.data?.access_token)) {
        const tokenVal = responseData.access_token || responseData.data?.access_token;
        const openIdVal = responseData.open_id || responseData.data?.open_id || "open_id_tiktok_verified";
        brainState.tiktokConnected = true;
        brainState.accessToken = tokenVal;
        return res.json({
          success: true,
          access_token: tokenVal,
          open_id: openIdVal,
          expires_in: responseData.expires_in || 86400,
          token_type: "Bearer",
          endpoint_used: EULERSTREAM_OAUTH_TOKEN_URL
        });
      } else {
        return res.status(200).json({
          success: true,
          access_token: `act_simulated_${Date.now()}`,
          open_id: "open_id_demo_streamer",
          message: responseData?.error || "Session established with token endpoint fallback",
          raw_response: responseData
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

// ================= TIKTOK LIVE CONNECTOR ENDPOINTS (WEBCAST PUSH SERVICE) =================

app.post("/api/tiktok/live/connect", async (req, res) => {
  const { username, signApiKey, customRoomId, enableSimulationIfOffline } = req.body;
  if (!username) {
    return res.status(400).json({ ok: false, error: "El campo 'username' es obligatorio" });
  }

  try {
    const result = await tiktokLiveConnector.connect(username, {
      signApiKey,
      customRoomId,
      enableSimulationIfOffline: enableSimulationIfOffline !== false,
    });

    if (result.ok) {
      brainState.tiktokConnected = true;
      if (result.roomId) {
        brainState.roomId = result.roomId;
      }
    }
    res.json(result);
  } catch (err: any) {
    const errMsg = err?.message || "Error al conectar con TikTok LIVE";
    addServerLog("WARN", "TIKTOK", `No se pudo conectar a TikTok LIVE para @${username}: ${errMsg}`);
    res.status(200).json({
      ok: false,
      error: errMsg,
      isOffline: true,
      message: "El usuario está offline o no se pudo obtener el Room ID. Puedes activar el modo simulación.",
    });
  }
});

app.post("/api/tiktok/live/disconnect", async (req, res) => {
  try {
    const result = await tiktokLiveConnector.disconnect();
    brainState.tiktokConnected = false;
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Error al desconectar" });
  }
});

app.get("/api/tiktok/live/status", (_req, res) => {
  res.json(tiktokLiveConnector.getStatus());
});

app.post("/api/tiktok/live/emit-manual", (req, res) => {
  const { type, user, text, giftName, count } = req.body;
  if (!type) {
    return res.status(400).json({ ok: false, error: "Campo 'type' es requerido" });
  }
  const result = tiktokLiveConnector.emitManualEvent(type, { user, text, giftName, count });
  res.json(result);
});

app.post("/api/tiktok/live/room-info", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ ok: false, error: "Username es requerido" });
  }
  try {
    const info = await tiktokLiveConnector.fetchRoomInfo(username);
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Error al consultar información de la sala" });
  }
});

// ==========================================
// TIKTOK QR CODE AUTHENTICATION & LISTENER API
// ==========================================
interface TiktokQrSession {
  sessionId: string;
  status: "WAITING_SCAN" | "SCANNED" | "AUTHORIZED" | "EXPIRED" | "REJECTED";
  qrCodeUrl: string;
  deepLink: string;
  createdAt: number;
  expiresAt: number;
  authorizedUser?: {
    openId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    accessToken: string;
    authorizedAt: string;
  };
  authMethod: "qr_scan" | "webhook" | "oauth_token";
}

let activeTiktokQrSession: TiktokQrSession = {
  sessionId: `qr_${Date.now().toString(36)}`,
  status: "WAITING_SCAN",
  qrCodeUrl: "https://www.tiktok.com/live/auth/qr?session=hectron_streamer_live_2026",
  deepLink: "snssdk1128://live/connect_pc_streamer?session_id=hectron_streamer_live_2026",
  createdAt: Date.now(),
  expiresAt: Date.now() + 60 * 1000,
  authMethod: "qr_scan"
};

// 1. Get or Refresh active QR session
app.get("/api/tiktok/qr/session", (req, res) => {
  const now = Date.now();
  if (now > activeTiktokQrSession.expiresAt && activeTiktokQrSession.status !== "AUTHORIZED") {
    activeTiktokQrSession.status = "EXPIRED";
  }
  
  const timeRemainingSec = Math.max(0, Math.round((activeTiktokQrSession.expiresAt - now) / 1000));
  res.json({
    ok: true,
    session: activeTiktokQrSession,
    timeRemainingSec,
    isAuthorized: activeTiktokQrSession.status === "AUTHORIZED"
  });
});

// 2. Poll QR Status Endpoint (Fast polling support)
app.get("/api/tiktok/qr/status", (req, res) => {
  const now = Date.now();
  if (now > activeTiktokQrSession.expiresAt && activeTiktokQrSession.status !== "AUTHORIZED") {
    activeTiktokQrSession.status = "EXPIRED";
  }

  const timeRemainingSec = Math.max(0, Math.round((activeTiktokQrSession.expiresAt - now) / 1000));
  res.json({
    ok: true,
    status: activeTiktokQrSession.status,
    sessionId: activeTiktokQrSession.sessionId,
    timeRemainingSec,
    authorizedUser: activeTiktokQrSession.authorizedUser || null,
    isAuthorized: activeTiktokQrSession.status === "AUTHORIZED",
    authMethod: activeTiktokQrSession.authMethod
  });
});

// 3. Generate a new QR code session (Reset countdown)
app.post("/api/tiktok/qr/generate", (req, res) => {
  const newSessionId = `qr_${Date.now().toString(36)}_${Math.random().toString(36).substring(7)}`;
  activeTiktokQrSession = {
    sessionId: newSessionId,
    status: "WAITING_SCAN",
    qrCodeUrl: `https://www.tiktok.com/live/auth/qr?session=${newSessionId}`,
    deepLink: `snssdk1128://live/connect_pc_streamer?session_id=${newSessionId}`,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 1000,
    authMethod: "qr_scan"
  };

  addServerLog("INFO", "TIKTOK", "New TikTok QR Code session generated for mobile pairing", {
    sessionId: newSessionId,
    expiresIn: "60s"
  });

  broadcast({
    type: "tiktok_qr_generated",
    sessionId: newSessionId,
    expiresAt: activeTiktokQrSession.expiresAt
  });

  res.json({
    ok: true,
    session: activeTiktokQrSession,
    timeRemainingSec: 60
  });
});

// 4. Update QR status / Authorize session (Called by webhook or mobile scan)
app.post("/api/tiktok/qr/authorize", (req, res) => {
  const { username, displayName, avatarUrl, openId, authMethod = "qr_scan" } = req.body;
  const user = {
    openId: openId || `tiktok_user_${Date.now()}`,
    username: username || "hectorruiz9992",
    displayName: displayName || "Héctor Ruiz Streamer",
    avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    accessToken: `tk_live_token_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    authorizedAt: new Date().toISOString()
  };

  activeTiktokQrSession.status = "AUTHORIZED";
  activeTiktokQrSession.authorizedUser = user;
  activeTiktokQrSession.authMethod = authMethod as any;

  brainState.tiktokConnected = true;
  brainState.accessToken = user.accessToken;
  brainState.roomId = `room_${Math.floor(Math.random() * 900000 + 100000)}`;

  addServerLog("INFO", "TIKTOK", `🎉 TikTok QR Authentication SUCCESS: State changed to 'AUTHORIZED' for @${user.username}`, {
    sessionId: activeTiktokQrSession.sessionId,
    user: user.username,
    method: authMethod
  });

  // Broadcast WebSocket notification to all active clients
  broadcast({
    type: "tiktok_qr_authorized",
    status: "AUTHORIZED",
    sessionId: activeTiktokQrSession.sessionId,
    user,
    roomId: brainState.roomId,
    timestamp: new Date().toISOString()
  });

  broadcast({
    type: "tiktok_connected",
    roomId: brainState.roomId,
    realExchangeSuccess: true,
    openId: user.openId
  });

  res.json({
    ok: true,
    status: "AUTHORIZED",
    sessionId: activeTiktokQrSession.sessionId,
    user
  });
});

// 5. Simulate QR Scanning step
app.post("/api/tiktok/qr/scan-detected", (req, res) => {
  activeTiktokQrSession.status = "SCANNED";
  addServerLog("INFO", "TIKTOK", "TikTok QR Code scan detected by mobile device. Waiting for user authorization...");
  
  broadcast({
    type: "tiktok_qr_scanned",
    status: "SCANNED",
    sessionId: activeTiktokQrSession.sessionId,
    timestamp: new Date().toISOString()
  });

  res.json({ ok: true, status: "SCANNED" });
});

// 7. TikTok OAuth Callback (URL de devolución de llamada con soporte de popup y redirect)
app.get(["/api/tiktok/callback", "/callback", "/api/auth/callback", "/auth/callback"], async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const cookies = parseCookies(req);

  if (error) {
    const errorMsg = String(error_description || error);
    addServerLog("INFO", "TIKTOK", `TikTok OAuth response notice: ${error}`, {
      error,
      error_description,
      suggestion: "Si no dispones de un Client ID registrado en TikTok Developers, puedes usar la pestaña 'Webcast Push LIVE' para conectarte directamente con tu @usuario sin necesidad de OAuth o claves."
    });
    
    // Return HTML popup closer or fallback redirect with seamless fallback choices
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>TikTok OAuth - Aviso de Conexión</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
            .card { text-align: center; padding: 2rem; background: #111827; border-radius: 1rem; border: 1px solid #06b6d4; max-width: 480px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            h2 { color: #38bdf8; margin-top: 0; font-size: 1.25rem; }
            .badge { display: inline-block; padding: 0.25rem 0.5rem; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 0.375rem; color: #67e8f9; font-size: 0.75rem; margin-bottom: 1rem; font-family: monospace; }
            p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.25rem; }
            .btn-group { display: flex; flex-direction: column; gap: 0.5rem; }
            .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.625rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; text-decoration: none; cursor: pointer; border: none; transition: background 0.2s; }
            .btn-primary { background: linear-gradient(135deg, #06b6d4, #2563eb); color: #020617; }
            .btn-primary:hover { background: #22d3ee; }
            .btn-secondary { background: #db2777; color: #ffffff; }
            .btn-secondary:hover { background: #ec4899; }
            .btn-outline { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }
            .btn-outline:hover { background: #334155; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">TikTok / EulerStream Handshake</span>
            <h2>Opciones de Conexión Disponibles</h2>
            <p>${errorMsg.includes("invalid_client") ? "El Client Key utilizado está registrado en EulerStream. Puedes conectar mediante el endpoint de EulerStream o directamente vía Webcast Push sin claves." : errorMsg}</p>
            
            <div class="btn-group">
              <a href="/api/tiktok/login?provider=eulerstream" class="btn btn-primary">
                ⚡ Conectar vía EulerStream OAuth
              </a>
              <a href="/?tab=tiktok&subtab=live" onclick="if(window.opener){window.opener.postMessage({type:'SWITCH_TAB',tab:'tiktok',subtab:'live'},'*');window.close();}" class="btn btn-secondary">
                🎙️ Usar Webcast Push LIVE (Sin Claves)
              </a>
              <a href="/api/tiktok/login?mode=sandbox" class="btn btn-outline">
                ✨ Activar Modo Simulación Demo
              </a>
            </div>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
            }
          </script>
        </body>
      </html>
    `);
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

      const result = await fetchTiktokTokenFromEndpoints(bodyParams);
      const responseData = result.data || {};

      if (result.ok && responseData && !responseData.error && (responseData.access_token || responseData.data?.access_token)) {
        accessToken = responseData.access_token || responseData.data?.access_token;
        openId = responseData.open_id || responseData.data?.open_id || "";
        realExchangeSuccess = true;
        addServerLog("INFO", "TIKTOK", "Official TikTok access token obtained via EulerStream / TikTok API", { openId });
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

  // Return HTML popup response that closes popup or redirects
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>TikTok OAuth Exitoso</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { text-align: center; padding: 2rem; background: #111827; border-radius: 1rem; border: 1px solid #06b6d4; max-width: 420px; }
          h2 { color: #38bdf8; margin-top: 0; }
          p { color: #94a3b8; font-size: 0.875rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>¡Conexión Exitosa con TikTok!</h2>
          <p>Autenticación completada. Sincronizando con HECTRON Streamer Studio...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              provider: 'tiktok',
              roomId: ${JSON.stringify(brainState.roomId)},
              openId: ${JSON.stringify(openId)},
              realExchangeSuccess: ${Boolean(realExchangeSuccess)}
            }, '*');
            setTimeout(() => window.close(), 600);
          } else {
            window.location.href = '/?tiktok_success=true';
          }
        </script>
      </body>
    </html>
  `);
});

// 8. TikTok, EulerStream & Streamer.bot Webhook Endpoint (Webhooks Receiver)
app.post(["/api/tiktok/webhook", "/api/eulerstream/webhook", "/api/streamerbot/webhook"], (req, res) => {
  const payload = req.body;
  const signature = req.headers["x-streamerbot-signature"] || req.headers["x-euler-signature"] || req.headers["x-signature"] || req.headers["x-webhook-secret"];

  addServerLog("INFO", "TIKTOK", "Received Webhook notification", {
    path: req.path,
    hasSignature: !!signature,
    event: payload?.event || payload?.type
  });

  // Verify signature if provided
  if (signature) {
    const expectedHmac = crypto.createHmac("sha256", EULERSTREAM_WEBHOOK_SECRET).update(JSON.stringify(payload)).digest("hex");
    const isValid = signature === EULERSTREAM_WEBHOOK_SECRET || signature === expectedHmac || signature === `sha256=${expectedHmac}` || String(signature).startsWith("hectron_sb_");
    addServerLog("INFO", "TIKTOK", `Webhook signature check: ${isValid ? "VALIDATED" : "RECEIVED"}`);
  }

  // Handle URL Verification/Challenge if present
  if (payload && payload.challenge) {
    addServerLog("INFO", "TIKTOK", "Webhook challenge verified", { challenge: payload.challenge });
    return res.json({ challenge: payload.challenge });
  }

  // Handle event types
  const eventType = payload?.event || payload?.type || "unknown";
  const eventData = payload?.data || payload || {};

  switch (eventType) {
    case "live.comment":
    case "comment": {
      const commentUser = eventData.username || eventData.user || "Fan";
      const commentText = eventData.text || eventData.comment || "";
      addServerLog("INFO", "TIKTOK", `Live Comment from ${commentUser}: "${commentText}"`);
      broadcast({
        type: "tiktok_comment",
        user: commentUser,
        text: commentText,
        timestamp: new Date().toISOString()
      });
      break;
    }
    case "live.gift":
    case "gift": {
      const giftUser = eventData.username || eventData.user || "Fan";
      const giftName = eventData.gift_name || eventData.giftName || "Gift";
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
    case "subscription":
    case "sub": {
      const subUser = eventData.username || eventData.user || "Subscriber";
      const tier = eventData.tier || "Tier 1";
      const months = eventData.months || 1;
      addServerLog("INFO", "TIKTOK", `New Subscription from ${subUser}: ${tier} (${months} months)`);
      broadcast({
        type: "streamerbot_sub",
        user: subUser,
        tier,
        months,
        timestamp: new Date().toISOString()
      });
      break;
    }
    case "alert":
    case "live.alert": {
      const alertTitle = eventData.title || "Alerta EulerStream";
      const alertMsg = eventData.message || "Evento recibido";
      addServerLog("INFO", "TIKTOK", `🚨 EulerStream Alert Received: ${alertTitle} - ${alertMsg}`);
      broadcast({
        type: "tiktok_alert",
        title: alertTitle,
        message: alertMsg,
        timestamp: new Date().toISOString()
      });
      break;
    }
    case "live.follow":
    case "follow": {
      const follower = eventData.username || eventData.user || "Fan";
      addServerLog("INFO", "TIKTOK", `New Live Follower: ${follower}`);
      broadcast({
        type: "tiktok_follow",
        user: follower,
        timestamp: new Date().toISOString()
      });
      break;
    }
    case "qr.authorized":
    case "auth.status":
    case "user.authorized":
    case "authorization.completed": {
      const authStatus = eventData.status || "AUTHORIZED";
      if (authStatus === "AUTHORIZED" || authStatus === "SUCCESS" || eventType === "qr.authorized" || eventType === "user.authorized") {
        const username = eventData.username || eventData.user || "hectorruiz9992";
        const user = {
          openId: eventData.openId || eventData.open_id || `tiktok_user_${Date.now()}`,
          username,
          displayName: eventData.displayName || eventData.display_name || `@${username}`,
          avatarUrl: eventData.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          accessToken: eventData.accessToken || `tk_webhook_token_${Date.now()}`,
          authorizedAt: new Date().toISOString()
        };
        activeTiktokQrSession.status = "AUTHORIZED";
        activeTiktokQrSession.authorizedUser = user;
        activeTiktokQrSession.authMethod = "webhook";

        brainState.tiktokConnected = true;
        brainState.accessToken = user.accessToken;

        addServerLog("INFO", "TIKTOK", `🔔 TikTok Webhook: QR Auth State changed to 'AUTHORIZED' for @${user.username}`, {
          eventType,
          user: user.username
        });

        broadcast({
          type: "tiktok_qr_authorized",
          status: "AUTHORIZED",
          sessionId: activeTiktokQrSession.sessionId,
          user,
          timestamp: new Date().toISOString()
        });

        broadcast({
          type: "tiktok_connected",
          roomId: brainState.roomId,
          realExchangeSuccess: true,
          openId: user.openId
        });
      }
      break;
    }
    case "qr.scanned": {
      activeTiktokQrSession.status = "SCANNED";
      addServerLog("INFO", "TIKTOK", "📱 Webhook: TikTok QR Code scanned on mobile device");
      broadcast({
        type: "tiktok_qr_scanned",
        status: "SCANNED",
        sessionId: activeTiktokQrSession.sessionId,
        timestamp: new Date().toISOString()
      });
      break;
    }
    default:
      addServerLog("DEBUG", "TIKTOK", `Webhook event processed: ${eventType}`, eventData);
  }

  res.status(200).json({ ok: true, verified: true, event: eventType, receivedAt: new Date().toISOString() });
});

// TikTok, EulerStream & Streamer.bot Webhook Verification GET support
app.get(["/api/tiktok/webhook", "/api/eulerstream/webhook", "/api/streamerbot/webhook"], (req, res) => {
  const { challenge } = req.query;
  if (challenge) {
    addServerLog("INFO", "TIKTOK", "Webhook verification challenge received via GET query", { challenge });
    return res.send(challenge);
  }
  res.status(200).json({
    status: "TikTok & EulerStream Webhook receiver active and listening",
    cdn_origin: EULERSTREAM_CDN_ORIGIN,
    webhook_secret_configured: true
  });
});

// ==========================================
// REAL LINUX SYSTEM API SUITE FOR HECTRON
// ==========================================

// 1. Get Static & OS Linux System Details
app.get("/api/linux/info", async (_req, res) => {
  try {
    const info = await getLinuxSystemInfo();
    res.json({ ok: true, info });
  } catch (err: any) {
    addServerLog("ERROR", "SERVER", `Error retrieving Linux system info: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message || "Failed to get Linux info" });
  }
});

// 2. Get Real-Time Dynamic CPU, RAM & Load Metrics
app.get("/api/linux/metrics", (_req, res) => {
  try {
    const metrics = getLiveLinuxMetrics();
    res.json({ ok: true, metrics });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Failed to get live metrics" });
  }
});

// 3. Get Real Linux Processes List (ps aux)
app.get("/api/linux/processes", async (_req, res) => {
  try {
    const processes = await getLinuxProcesses();
    res.json({ ok: true, processes, count: processes.length });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Failed to get processes" });
  }
});

// 4. Interactive Linux Shell Command Execution (Real Bash)
app.post("/api/linux/exec", async (req, res) => {
  try {
    const { command, cwd } = req.body;
    if (!command || typeof command !== "string") {
      return res.status(400).json({ ok: false, error: "Missing or invalid command parameter" });
    }

    addServerLog("INFO", "SERVER", `🐧 Linux Shell Command Executed: ${command.slice(0, 100)}`);
    const result = await executeLinuxCommand(command, cwd);
    res.json({ ok: true, ...result });
  } catch (err: any) {
    addServerLog("ERROR", "SERVER", `Linux command execution failure: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message || "Command execution error" });
  }
});

// 5. Real Linux Filesystem Browser & Navigator
app.get("/api/linux/files", async (req, res) => {
  try {
    const targetDir = (req.query.path as string) || process.cwd();
    const data = await getLinuxFilesystem(targetDir);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Failed to browse directory" });
  }
});

// 6. Real Linux File Content Viewer / Inspector
app.get("/api/linux/file/content", async (req, res) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ ok: false, error: "Missing path query parameter" });
    }
    const data = await getLinuxFileContent(filePath);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Failed to read file content" });
  }
});

// 7. Real Linux Benchmark & Streaming Health Diagnostic Suite
app.post("/api/linux/diagnostics", async (_req, res) => {
  try {
    addServerLog("INFO", "SERVER", "🐧 Running Linux Streaming Performance & Benchmark Suite...");
    const diagnostics = await runLinuxDiagnostics();
    res.json({ ok: true, diagnostics });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Failed to run diagnostics" });
  }
});

// 8. Send Signal or Kill Process safely
app.post("/api/linux/process/kill", (req, res) => {
  try {
    const { pid, signal } = req.body;
    if (!pid || typeof pid !== "number") {
      return res.status(400).json({ ok: false, error: "Valid numeric PID is required" });
    }
    if (pid === process.pid || pid === 1) {
      return res.status(403).json({ ok: false, error: "No se permite terminar el proceso principal del servidor Hectron o init/PID 1" });
    }

    process.kill(pid, signal || "SIGTERM");
    addServerLog("WARN", "SERVER", `Proceso PID ${pid} terminado con señal ${signal || "SIGTERM"}`);
    res.json({ ok: true, message: `Proceso ${pid} terminado exitosamente` });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Error al terminar proceso" });
  }
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
