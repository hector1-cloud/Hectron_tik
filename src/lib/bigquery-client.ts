import { BigQuery } from "@google-cloud/bigquery";

export interface ChatLogRecord {
  id: string;
  timestamp: string;
  user_id: string;
  message: string;
  emotion: string;
  scene: string;
  tokens_used: number;
}

export interface PsycheStateRecord {
  id: string;
  timestamp: string;
  machiavellianism: number; // 0 - 10
  stoicism: number; // 0 - 10
  creative_drive: number; // 0 - 10
  dominant_trait: string;
}

export interface AutonomousDecisionRecord {
  id: string;
  timestamp: string;
  decision_type: "scene-change" | "speak" | "emotion-shift" | "stream-action" | "tiktok-interaction";
  decision_value: string;
  confidence: number; // 0 - 1
  success: boolean;
}

export interface UserMetricRecord {
  id: string;
  timestamp: string;
  user_id: string;
  message_count: number;
  last_active: string;
  favorite_gift?: string;
}

// In-Memory Storage for High-Speed Queries & Resilient Offline Fallback
const inMemoryStore = {
  chatLogs: [] as ChatLogRecord[],
  psycheStates: [
    {
      id: "init_psyche",
      timestamp: new Date().toISOString(),
      machiavellianism: 3.5,
      stoicism: 7.2,
      creative_drive: 8.8,
      dominant_trait: "creative_drive",
    },
  ] as PsycheStateRecord[],
  autonomousDecisions: [] as AutonomousDecisionRecord[],
  userMetrics: new Map<string, UserMetricRecord>(),
};

// Seed initial demo records so the dashboard has rich data out of the box
(function seedDemoData() {
  const now = Date.now();
  const emotions = ["HAPPY", "FLIRT", "SURPRISE", "IDLE", "ANGRY", "SAD"];
  const scenes = ["HAPPY_SCENE", "FLIRT_SCENE", "SURPRISE_SCENE", "DEFAULT", "ANGRY_SCENE", "SAD_SCENE"];
  const users = ["MikuFan99", "StreamLover", "TikTokGamer", "CyberOtaku", "HectronVIP"];

  for (let i = 20; i >= 1; i--) {
    const ts = new Date(now - i * 15 * 60 * 1000).toISOString();
    const emotion = emotions[i % emotions.length];
    const scene = scenes[i % scenes.length];
    const user = users[i % users.length];

    inMemoryStore.chatLogs.push({
      id: `seed_chat_${i}`,
      timestamp: ts,
      user_id: user,
      message: `¡Hola HECTRON Miku! Saludos desde la transmisión #${i} ✨💙`,
      emotion,
      scene,
      tokens_used: Math.floor(Math.random() * 25) + 12,
    });

    if (i % 3 === 0) {
      inMemoryStore.autonomousDecisions.push({
        id: `seed_auto_${i}`,
        timestamp: ts,
        decision_type: i % 2 === 0 ? "scene-change" : "speak",
        decision_value: i % 2 === 0 ? scene : `¡Muchas gracias a todos por acompañarme! Miku está cantando para ustedes. 💙🎤`,
        confidence: Number((0.82 + (i % 15) * 0.01).toFixed(2)),
        success: true,
      });

      inMemoryStore.psycheStates.push({
        id: `seed_psyche_${i}`,
        timestamp: ts,
        machiavellianism: Number((2.5 + (i % 4) * 0.5).toFixed(1)),
        stoicism: Number((6.0 + (i % 3) * 0.8).toFixed(1)),
        creative_drive: Number((7.5 + (i % 5) * 0.4).toFixed(1)),
        dominant_trait: i % 2 === 0 ? "creative_drive" : "stoicism",
      });
    }
  }
})();

class BigQueryClient {
  private client: BigQuery | null = null;
  private datasetId = "hectron_autonomo";
  public isInitialized = false;

  constructor() {
    this.initGCP();
  }

  private initGCP() {
    try {
      const projectId = process.env.GCP_PROJECT_ID;
      const credentialsJson = process.env.GCP_CREDENTIALS_JSON;

      if (projectId) {
        let credentials;
        if (credentialsJson) {
          try {
            credentials = JSON.parse(credentialsJson);
          } catch (e) {
            console.warn("[BigQuery] Failed to parse GCP_CREDENTIALS_JSON, using default auth");
          }
        }

        this.client = new BigQuery({
          projectId,
          ...(credentials ? { credentials } : {}),
        });

        this.isInitialized = true;
        console.log(`[BigQuery] Google Cloud BigQuery client initialized for project: ${projectId}`);
        this.ensureDatasetAndTables();
      } else {
        console.log("[BigQuery] GCP_PROJECT_ID not provided. Operating in High-Speed Local Persistent Mode.");
      }
    } catch (err: any) {
      console.warn("[BigQuery] Could not initialize GCP BigQuery SDK, using local engine fallback:", err?.message);
    }
  }

  private async ensureDatasetAndTables() {
    if (!this.client) return;
    try {
      const [dataset] = await this.client.dataset(this.datasetId).get({ autoCreate: true });
      console.log(`[BigQuery] Dataset verified/created: ${dataset.id}`);

      // Ensure partitioned tables exist
      const tables = [
        {
          id: "chat_logs",
          schema: "id:STRING, timestamp:TIMESTAMP, user_id:STRING, message:STRING, emotion:STRING, scene:STRING, tokens_used:INTEGER",
        },
        {
          id: "psyche_state",
          schema: "id:STRING, timestamp:TIMESTAMP, machiavellianism:FLOAT, stoicism:FLOAT, creative_drive:FLOAT, dominant_trait:STRING",
        },
        {
          id: "autonomous_decisions",
          schema: "id:STRING, timestamp:TIMESTAMP, decision_type:STRING, decision_value:STRING, confidence:FLOAT, success:BOOLEAN",
        },
        {
          id: "user_metrics",
          schema: "id:STRING, timestamp:TIMESTAMP, user_id:STRING, message_count:INTEGER, last_active:TIMESTAMP, favorite_gift:STRING",
        },
      ];

      for (const t of tables) {
        try {
          const table = this.client.dataset(this.datasetId).table(t.id);
          const [exists] = await table.exists();
          if (!exists) {
            await table.create({ schema: t.schema });
          }
        } catch (tableErr: any) {
          console.warn(`[BigQuery] Table check notice for ${t.id}:`, tableErr?.message);
        }
      }
    } catch (err: any) {
      console.warn("[BigQuery] Dataset setup notice:", err?.message);
    }
  }

  // 1. Save Chat Log
  public async saveChatLog(record: Omit<ChatLogRecord, "id" | "timestamp">): Promise<ChatLogRecord> {
    const fullRecord: ChatLogRecord = {
      id: `chat_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      ...record,
    };

    inMemoryStore.chatLogs.push(fullRecord);
    if (inMemoryStore.chatLogs.length > 1000) {
      inMemoryStore.chatLogs.shift();
    }

    // Update user metric
    const userKey = record.user_id || "Anónimo";
    const existingUser = inMemoryStore.userMetrics.get(userKey) || {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      user_id: userKey,
      message_count: 0,
      last_active: new Date().toISOString(),
    };
    existingUser.message_count += 1;
    existingUser.last_active = new Date().toISOString();
    inMemoryStore.userMetrics.set(userKey, existingUser);

    if (this.client) {
      try {
        await this.client.dataset(this.datasetId).table("chat_logs").insert([fullRecord]);
      } catch (err: any) {
        console.warn("[BigQuery] Asynchronous stream insert to GCP skipped:", err?.message);
      }
    }

    return fullRecord;
  }

  // 2. Save Psyche State (Ω)
  public async savePsycheState(record: Omit<PsycheStateRecord, "id" | "timestamp">): Promise<PsycheStateRecord> {
    const fullRecord: PsycheStateRecord = {
      id: `psyche_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      ...record,
    };

    inMemoryStore.psycheStates.push(fullRecord);
    if (inMemoryStore.psycheStates.length > 500) {
      inMemoryStore.psycheStates.shift();
    }

    if (this.client) {
      try {
        await this.client.dataset(this.datasetId).table("psyche_state").insert([fullRecord]);
      } catch (err: any) {
        console.warn("[BigQuery] Asynchronous psyche insert skipped:", err?.message);
      }
    }

    return fullRecord;
  }

  // 3. Save Autonomous Decision
  public async saveAutonomousDecision(
    record: Omit<AutonomousDecisionRecord, "id" | "timestamp">
  ): Promise<AutonomousDecisionRecord> {
    const fullRecord: AutonomousDecisionRecord = {
      id: `auto_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      ...record,
    };

    inMemoryStore.autonomousDecisions.push(fullRecord);
    if (inMemoryStore.autonomousDecisions.length > 500) {
      inMemoryStore.autonomousDecisions.shift();
    }

    if (this.client) {
      try {
        await this.client.dataset(this.datasetId).table("autonomous_decisions").insert([fullRecord]);
      } catch (err: any) {
        console.warn("[BigQuery] Asynchronous decision insert skipped:", err?.message);
      }
    }

    return fullRecord;
  }

  // Query Data
  public getChatLogs(limit = 100): ChatLogRecord[] {
    return inMemoryStore.chatLogs.slice(-limit);
  }

  public getPsycheHistory(limit = 50): PsycheStateRecord[] {
    return inMemoryStore.psycheStates.slice(-limit);
  }

  public getLatestPsyche(): PsycheStateRecord {
    return (
      inMemoryStore.psycheStates[inMemoryStore.psycheStates.length - 1] || {
        id: "default",
        timestamp: new Date().toISOString(),
        machiavellianism: 3.2,
        stoicism: 7.5,
        creative_drive: 8.5,
        dominant_trait: "creative_drive",
      }
    );
  }

  public getAutonomousDecisions(limit = 50): AutonomousDecisionRecord[] {
    return inMemoryStore.autonomousDecisions.slice(-limit);
  }

  public getAllMetrics(days = 7) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const filteredChats = inMemoryStore.chatLogs.filter((c) => new Date(c.timestamp).getTime() >= cutoff);
    const filteredDecisions = inMemoryStore.autonomousDecisions.filter(
      (d) => new Date(d.timestamp).getTime() >= cutoff
    );

    const totalTokens = filteredChats.reduce((acc, c) => acc + (c.tokens_used || 0), 0);
    const successfulDecisions = filteredDecisions.filter((d) => d.success).length;

    // Dominant emotion count
    const emotionCounts: Record<string, number> = {};
    filteredChats.forEach((c) => {
      emotionCounts[c.emotion] = (emotionCounts[c.emotion] || 0) + 1;
    });
    let mostCommonEmotion = "HAPPY";
    let maxEmotionCount = 0;
    Object.entries(emotionCounts).forEach(([emo, count]) => {
      if (count > maxEmotionCount) {
        maxEmotionCount = count;
        mostCommonEmotion = emo;
      }
    });

    const latestPsyche = this.getLatestPsyche();

    return {
      timeframeDays: days,
      chatMetrics: {
        totalMessages: filteredChats.length,
        totalTokensUsed: totalTokens,
        mostCommonEmotion,
        activeUsersCount: inMemoryStore.userMetrics.size,
      },
      autonomyMetrics: {
        totalDecisions: filteredDecisions.length,
        successfulDecisions,
        autonomySuccessRate: filteredDecisions.length
          ? Number(((successfulDecisions / filteredDecisions.length) * 100).toFixed(1))
          : 100,
        avgConfidence: filteredDecisions.length
          ? Number((filteredDecisions.reduce((acc, d) => acc + d.confidence, 0) / filteredDecisions.length).toFixed(2))
          : 0.92,
      },
      psycheMetrics: latestPsyche,
    };
  }

  public getDashboardData() {
    const metrics = this.getAllMetrics(7);
    return {
      ok: true,
      service: "hectron-bigquery-analytics",
      gcpConnected: this.isInitialized,
      dataset: this.datasetId,
      summary: metrics,
      recentChats: this.getChatLogs(15),
      recentDecisions: this.getAutonomousDecisions(15),
      psycheTimeline: this.getPsycheHistory(15),
    };
  }
}

export const bigqueryClient = new BigQueryClient();
