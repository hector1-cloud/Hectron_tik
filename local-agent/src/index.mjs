import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.AGENT_TOKEN || "default_token";
const BRAIN_URL = process.env.APP_URL || "http://127.0.0.1:3000";

app.use(cors({ origin: "*" }));
app.use(express.json());

function agentLog(level, message, details) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] [AGENT] ${message}`, details || "");

  // Asynchronously attempt forwarding log to Brain Server
  fetch(`${BRAIN_URL}/api/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      level,
      scope: "AGENT",
      message: `[PC Local Agent] ${message}`,
      details,
    }),
  }).catch(() => {});
}

agentLog("INFO", "HECTRON Local Agent service initialized");

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "hectron-local-agent", obsConnected: true });
});

app.get("/status", (_req, res) => {
  res.json({
    online: true,
    obs: true,
    streaming: false,
    scene: "DEFAULT",
    obsVersion: "30.0.0",
    websocketVersion: "5.0.0",
  });
});

app.get("/scenes", (_req, res) => {
  res.json({
    ok: true,
    scenes: ["DEFAULT", "HAPPY_SCENE", "FLIRT_SCENE", "SURPRISE_SCENE", "SAD_SCENE", "ANGRY_SCENE"],
  });
});

app.post("/scene", (req, res) => {
  const scene = req.body?.scene || "DEFAULT";
  agentLog("INFO", `OBS Scene switched to: ${scene}`);
  res.json({ ok: true, scene });
});

app.post("/live/start", (_req, res) => {
  agentLog("WARN", "OBS Stream started - Live on TikTok");
  res.json({ ok: true, streaming: true });
});

app.post("/live/stop", (_req, res) => {
  agentLog("INFO", "OBS Stream stopped");
  res.json({ ok: true, streaming: false });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 HECTRON Local Agent listening on port ${PORT}`);
});

