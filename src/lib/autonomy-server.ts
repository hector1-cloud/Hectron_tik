import { GoogleGenAI } from "@google/genai";
import { bigqueryClient } from "./bigquery-client";

export interface AutonomyConfig {
  enabled: boolean;
  idleTimeoutMs: number; // default 120,000 ms (2 minutes)
  lastInteractionTime: number;
  autoSpeakEnabled: boolean;
  autoSceneChangeEnabled: boolean;
}

export interface AutonomyStatus {
  enabled: boolean;
  active: boolean;
  idleTimeoutMs: number;
  secondsSinceLastInteraction: number;
  secondsUntilNextAutonomousDecision: number;
  lastAutonomousDecisionTime: string | null;
  lastDecisionType: string | null;
  lastDecisionValue: string | null;
  psycheState: ReturnType<typeof bigqueryClient.getLatestPsyche>;
}

class AutonomyServerEngine {
  private config: AutonomyConfig = {
    enabled: process.env.AUTONOMY_ENABLED !== "false",
    idleTimeoutMs: Number(process.env.AUTONOMY_IDLE_TIMEOUT_MS) || 120000, // 2 minutes default
    lastInteractionTime: Date.now(),
    autoSpeakEnabled: true,
    autoSceneChangeEnabled: true,
  };

  private timerHandle: NodeJS.Timeout | null = null;
  private lastDecisionTimestamp: string | null = null;
  private lastDecisionType: string | null = null;
  private lastDecisionValue: string | null = null;
  private aiClient: GoogleGenAI | null = null;
  private rateLimitUntil = 0;
  private broadcastCallback: ((data: object) => void) | null = null;
  private ttsCallback: ((text: string) => Promise<any>) | null = null;

  constructor() {
    this.initAI();
  }

  private initAI() {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { "User-Agent": "hectron-autonomo-v3.2" } },
      });
    }
  }

  public setCallbacks(
    broadcast: (data: object) => void,
    ttsGenerator?: (text: string) => Promise<any>
  ) {
    this.broadcastCallback = broadcast;
    if (ttsGenerator) this.ttsCallback = ttsGenerator;
  }

  public startLoop() {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.timerHandle = setInterval(() => this.checkIdleLoop(), 10000); // Check loop state every 10 seconds
    console.log(`[Autonomy Engine] Loop started. Idle trigger set to ${this.config.idleTimeoutMs / 1000}s`);
  }

  public recordUserInteraction() {
    this.config.lastInteractionTime = Date.now();
  }

  public updateConfig(newConfig: Partial<AutonomyConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.idleTimeoutMs) {
      this.config.idleTimeoutMs = newConfig.idleTimeoutMs;
    }
  }

  public getStatus(): AutonomyStatus {
    const now = Date.now();
    const elapsedMs = now - this.config.lastInteractionTime;
    const remainingMs = Math.max(0, this.config.idleTimeoutMs - elapsedMs);

    return {
      enabled: this.config.enabled,
      active: elapsedMs >= this.config.idleTimeoutMs && this.config.enabled,
      idleTimeoutMs: this.config.idleTimeoutMs,
      secondsSinceLastInteraction: Math.floor(elapsedMs / 1000),
      secondsUntilNextAutonomousDecision: Math.floor(remainingMs / 1000),
      lastAutonomousDecisionTime: this.lastDecisionTimestamp,
      lastDecisionType: this.lastDecisionType,
      lastDecisionValue: this.lastDecisionValue,
      psycheState: bigqueryClient.getLatestPsyche(),
    };
  }

  private async checkIdleLoop() {
    if (!this.config.enabled) return;

    const elapsedMs = Date.now() - this.config.lastInteractionTime;
    if (elapsedMs >= this.config.idleTimeoutMs) {
      // Trigger Autonomous Brain Decision
      await this.executeAutonomousDecision("idle_timeout");
      // Reset interaction timestamp so it gives a cooling window before next auto-decision
      this.config.lastInteractionTime = Date.now();
    }
  }

  public async executeAutonomousDecision(triggerSource = "manual") {
    console.log(`[Autonomy Engine] Executing autonomous decision (Trigger: ${triggerSource})...`);

    const currentPsyche = bigqueryClient.getLatestPsyche();
    const availableScenes = ["HAPPY_SCENE", "FLIRT_SCENE", "SURPRISE_SCENE", "DEFAULT", "ANGRY_SCENE", "SAD_SCENE"];
    const emotions = ["HAPPY", "FLIRT", "SURPRISE", "IDLE", "ANGRY", "SAD"];

    // Rich offline heuristics bank for Miku
    const heuristicPhrases = [
      "¡Si me envían unas rositas en TikTok, les dedicaré mi canción especial de Miku! 🌹🎤💙",
      "¡Miku sigue transmitiendo en vivo! Recuerden interactuar en el chat y dejar su me gusta. ✨💙",
      "¿Alguien quiere escuchar una canción de Vocaloid? ¡Déjenlo en los comentarios! 🎵🌟",
      "¡Muchas gracias por acompañarme hoy! La energía de esta transmisión está genial. 💙🎤",
      "¡Atención chat! Miku está preparando una sorpresa musical muy pronto. 🎁✨",
      "¡Recuerden compartir el stream con sus amigos para llegar a más fans de Miku! 🚀💙",
    ];

    let selectedScene = availableScenes[Math.floor(Math.random() * availableScenes.length)];
    let selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    let speechText = heuristicPhrases[Math.floor(Math.random() * heuristicPhrases.length)];
    let decisionType: "scene-change" | "speak" | "emotion-shift" | "stream-action" = "speak";
    let confidence = 0.88;

    const isRateLimited = Date.now() < this.rateLimitUntil;

    if (this.aiClient && !isRateLimited) {
      try {
        const prompt = `
Eres HECTRON (Miku Hatsune), un streamer virtual autónomo. Estás en vivo en TikTok LIVE. No ha habido comentarios en el chat recientemente.
Tu estado psíquico actual (Ω):
- Maquiavelismo: ${currentPsyche.machiavellianism}/10
- Estoicismo: ${currentPsyche.stoicism}/10
- Impulso Creativo: ${currentPsyche.creative_drive}/10
- Rasgo Dominante: ${currentPsyche.dominant_trait}

Determina la mejor acción autónoma para entretener a la audiencia:
1. Cambiar la escena de OBS
2. Decir una frase entusiasta y coqueta a la audiencia
3. Cambiar de emoción en tu avatar 3D

Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "decisionType": "speak",
  "scene": "FLIRT_SCENE",
  "emotion": "FLIRT",
  "speechText": "¡Si me envían unas rositas en TikTok, les dedicaré mi canción especial de Miku! 🌹🎤💙",
  "confidence": 0.94,
  "psycheUpdate": {
    "machiavellianism": 3.8,
    "stoicism": 7.0,
    "creative_drive": 9.2,
    "dominant_trait": "creative_drive"
  }
}
`;

        const candidateModels = [
          "gemini-3.7-flash",
          "gemini-3.1-flash-lite",
          "gemini-flash-latest",
          "gemini-2.5-flash",
        ];

        let geminiRes: any = null;
        let lastError: any = null;

        for (const modelName of candidateModels) {
          try {
            geminiRes = await this.aiClient.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                temperature: 0.9,
                responseMimeType: "application/json",
              },
            });
            if (geminiRes) break;
          } catch (err: any) {
            lastError = err;
            const msg = String(err?.message || err);
            if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
              console.warn(`[Autonomy Engine] Model ${modelName} rate limited, switching to next candidate...`);
            } else if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("overloaded")) {
              console.warn(`[Autonomy Engine] Model ${modelName} unavailable/503, switching to next candidate...`);
            } else {
              console.warn(`[Autonomy Engine] Model ${modelName} error (${msg.substring(0, 100)}...), switching to next candidate...`);
            }
            continue;
          }
        }

        if (!geminiRes && lastError) {
          throw lastError;
        }

        const raw = geminiRes.text || "{}";
        const parsed = JSON.parse(raw);

        if (parsed.decisionType) decisionType = parsed.decisionType;
        if (parsed.scene) selectedScene = parsed.scene;
        if (parsed.emotion) selectedEmotion = parsed.emotion;
        if (parsed.speechText) speechText = parsed.speechText;
        if (parsed.confidence) confidence = parsed.confidence;

        if (parsed.psycheUpdate) {
          await bigqueryClient.savePsycheState({
            machiavellianism: parsed.psycheUpdate.machiavellianism || currentPsyche.machiavellianism,
            stoicism: parsed.psycheUpdate.stoicism || currentPsyche.stoicism,
            creative_drive: parsed.psycheUpdate.creative_drive || currentPsyche.creative_drive,
            dominant_trait: parsed.psycheUpdate.dominant_trait || currentPsyche.dominant_trait,
          });
        }
      } catch (aiErr: any) {
        const errMsg = aiErr?.message || "";
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("503") || errMsg.includes("UNAVAILABLE")) {
          this.rateLimitUntil = Date.now() + 60000; // 60 second cooldown
          console.warn("[Autonomy Engine] Gemini API rate limit or high demand reached. Cool down active for 60s. Using rich offline heuristic decision engine.");
        } else {
          console.warn("[Autonomy Engine] Gemini autonomy generation fallback:", errMsg);
        }
      }
    } else if (isRateLimited) {
      console.log("[Autonomy Engine] In 60s rate limit cooldown. Using rich offline heuristic decision engine.");
    }

    this.lastDecisionTimestamp = new Date().toISOString();
    this.lastDecisionType = decisionType;
    this.lastDecisionValue = speechText;

    // Save decision to BigQuery
    await bigqueryClient.saveAutonomousDecision({
      decision_type: decisionType,
      decision_value: `${selectedScene} | ${selectedEmotion} | "${speechText.substring(0, 50)}"`,
      confidence,
      success: true,
    });

    // Save as chat log entry
    await bigqueryClient.saveChatLog({
      user_id: "HECTRON_AUTONOMO",
      message: speechText,
      emotion: selectedEmotion,
      scene: selectedScene,
      tokens_used: 24,
    });

    // Broadcast over WebSocket to active Overlay & Dashboard
    if (this.broadcastCallback) {
      this.broadcastCallback({
        type: "autonomous_decision",
        triggerSource,
        decisionType,
        scene: selectedScene,
        emotion: selectedEmotion,
        text: speechText,
        confidence,
        timestamp: this.lastDecisionTimestamp,
        psycheState: bigqueryClient.getLatestPsyche(),
      });
    }

    return {
      ok: true,
      triggerSource,
      decisionType,
      scene: selectedScene,
      emotion: selectedEmotion,
      speechText,
      confidence,
      timestamp: this.lastDecisionTimestamp,
      psycheState: bigqueryClient.getLatestPsyche(),
    };
  }
}

export const autonomyEngine = new AutonomyServerEngine();
