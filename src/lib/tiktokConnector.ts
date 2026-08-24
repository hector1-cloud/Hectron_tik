import { TikTokLiveConnection, WebcastEvent, ControlEvent } from "tiktok-live-connector";

interface ConnectOptions {
  signApiKey?: string;
  customRoomId?: string;
  enableSimulationIfOffline?: boolean;
}

type BroadcastFn = (msg: any) => void;
type AddLogFn = (level: "INFO" | "WARN" | "ERROR" | "DEBUG", scope: string, message: string, details?: any) => void;

function isOfflineMessage(msg: string): boolean {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes("failed to retrieve room id") ||
    lower.includes("offline") ||
    lower.includes("isn't online") ||
    lower.includes("is not online") ||
    lower.includes("not online") ||
    lower.includes("userofflineerror") ||
    lower.includes("room_id") ||
    lower.includes("no live") ||
    lower.includes("not live")
  );
}

class TikTokLiveConnectorManager {
  private activeConnection: TikTokLiveConnection | null = null;
  private activeUsername: string | null = null;
  private lastRoomInfo: any = null;
  private broadcast: BroadcastFn | null = null;
  private addLog: AddLogFn | null = null;
  private isSimulating: boolean = false;
  private simulationTimer: any = null;
  private currentSimRoomId: string | null = null;

  public setCallbacks(broadcast: BroadcastFn, addLog: AddLogFn) {
    this.broadcast = broadcast;
    this.addLog = addLog;
  }

  public sanitizeUsername(rawInput: string): string {
    let clean = rawInput.trim();
    // Strip full URL like https://www.tiktok.com/@officialgeilegisela/live
    if (clean.includes("tiktok.com/")) {
      const match = clean.match(/@([a-zA-Z0-9_.-]+)/);
      if (match && match[1]) {
        clean = match[1];
      } else {
        const parts = clean.split("/").filter(Boolean);
        clean = parts[parts.length - 1].replace("live", "").replace("@", "");
      }
    }
    // Remove leading @
    if (clean.startsWith("@")) {
      clean = clean.substring(1);
    }
    return clean;
  }

  public getStatus() {
    return {
      isConnected: this.isSimulating || (this.activeConnection ? this.activeConnection.isConnected : false),
      isConnecting: this.activeConnection ? this.activeConnection.isConnecting : false,
      isSimulated: this.isSimulating,
      username: this.activeUsername,
      roomId: this.isSimulating ? this.currentSimRoomId : (this.activeConnection ? this.activeConnection.roomId : null),
      roomInfo: this.lastRoomInfo,
    };
  }

  public async connect(usernameInput: string, options?: ConnectOptions) {
    const username = this.sanitizeUsername(usernameInput);

    if (!username) {
      throw new Error("Se requiere un nombre de usuario de TikTok válido (@username)");
    }

    // Clean up active sessions or simulation timers
    await this.disconnect();

    this.activeUsername = username;
    const enableSim = options?.enableSimulationIfOffline !== false; // default true

    if (this.addLog) {
      this.addLog("INFO", "TIKTOK", `Iniciando solicitud de conexión a TikTok LIVE para @${username}...`);
    }

    const signApiKey =
      options?.signApiKey ||
      process.env.EULERSTREAM_API_KEY ||
      process.env.EULER_SIGN_API_KEY ||
      process.env.SIGN_API_KEY ||
      "euler_OTVjZTVkZTkwZjhlY2FhZjJmODEzYzY5ZGFiMTBjZTQxNzUyNzBjZjliMWFmZmQ5Njc5MzRm";

    const connection = new TikTokLiveConnection(username, {
      ...(signApiKey ? { signApiKey } : {}),
      processInitialData: true,
      enableExtendedGiftInfo: true,
    });

    this.activeConnection = connection;

    // Attach Event Listeners
    connection.on(ControlEvent.CONNECTED, (state: any) => {
      this.lastRoomInfo = state.roomInfo || null;
      if (this.addLog) {
        this.addLog("INFO", "TIKTOK", `¡Conectado exitosamente al chat LIVE de @${username}! Room ID: ${state.roomId}`);
      }
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_connected",
          username,
          roomId: state.roomId,
          roomInfo: state.roomInfo,
          isSimulated: false,
        });
      }
    });

    connection.on(ControlEvent.DISCONNECTED, (evt: any) => {
      const code = evt?.code;
      const reason = evt?.reason;
      if (this.addLog) {
        this.addLog("WARN", "TIKTOK", `Desconectado de TikTok LIVE (@${username}): ${reason || code || "Conexión cerrada"}`);
      }
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_disconnected",
          username,
          reason,
          code,
        });
      }
      this.activeConnection = null;
    });

    connection.on(ControlEvent.ERROR, (evt: any) => {
      const info = String(evt?.info || "");
      const exception = String(evt?.exception?.message || evt?.exception || "");
      const isOfflineError = isOfflineMessage(info) || isOfflineMessage(exception);

      if (isOfflineError) {
        if (this.addLog) {
          this.addLog("WARN", "TIKTOK", `El usuario @${username} no está transmitiendo en vivo actualmente en TikTok.`);
        }
      } else {
        if (this.addLog) {
          this.addLog("ERROR", "TIKTOK", `Error en conexión TikTok Webcast (@${username}): ${info}`, {
            exception,
          });
        }
      }
    });

    // Chat Comments
    connection.on(WebcastEvent.CHAT, (data: any) => {
      const user = data.user?.uniqueId || data.user?.nickname || data.user?.displayId || "TikTok User";
      const comment = data.comment || data.content || "";

      if (this.addLog) {
        this.addLog("INFO", "TIKTOK", `Comentario de @${user}: "${comment}"`);
      }
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_comment",
          user,
          uniqueId: data.user?.uniqueId,
          text: comment,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Gifts
    connection.on(WebcastEvent.GIFT, (data: any) => {
      const user = data.user?.uniqueId || data.user?.nickname || "Fan";
      const giftName = data.giftDetails?.giftName || data.giftName || data.gift?.name || `Regalo #${data.giftId}`;
      const count = data.repeatCount || 1;
      const repeatEnd = data.repeatEnd !== undefined ? data.repeatEnd : true;

      if (this.addLog) {
        this.addLog("INFO", "TIKTOK", `🎁 Regalo recibido de @${user}: ${count}x ${giftName}`);
      }
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_gift",
          user,
          giftName,
          count,
          repeatEnd,
          giftId: data.giftId,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Likes
    connection.on(WebcastEvent.LIKE, (data: any) => {
      const user = data.user?.uniqueId || "Fan";
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_like",
          user,
          count: data.likeCount || data.count || 1,
          totalLikes: data.totalLikeCount || data.totalLikes,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Follows & Shares
    connection.on(WebcastEvent.SOCIAL, (data: any) => {
      const user = data.user?.uniqueId || "Fan";
      if (this.addLog) {
        this.addLog("INFO", "TIKTOK", `Acción Social de @${user}: ${data.action || "Interacción"}`);
      }
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_follow",
          user,
          action: data.action,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Member Joined
    connection.on(WebcastEvent.MEMBER, (data: any) => {
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_member",
          user: data.user?.uniqueId,
          memberCount: data.memberCount,
        });
      }
    });

    // Room User / Viewer Count Update
    connection.on(WebcastEvent.ROOM_USER, (data: any) => {
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_room_user",
          viewerCount: data.viewerCount,
        });
      }
    });

    // Stream Ended
    connection.on(WebcastEvent.STREAM_END, () => {
      if (this.addLog) {
        this.addLog("WARN", "TIKTOK", `La transmisión LIVE de @${username} ha finalizado.`);
      }
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_stream_end",
          username,
        });
      }
      this.activeConnection = null;
    });

    // Attempt real connection
    try {
      const customRoomId = options?.customRoomId?.trim();
      const state = customRoomId ? await connection.connect(customRoomId) : await connection.connect();
      return {
        ok: true,
        roomId: state.roomId,
        username,
        isConnected: true,
        isSimulated: false,
      };
    } catch (err: any) {
      const errMsg = String(err?.message || err?.exception || err);
      const isOfflineErr = isOfflineMessage(errMsg);

      if (isOfflineErr) {
        if (this.addLog) {
          this.addLog("WARN", "TIKTOK", `El usuario @${username} no está transmitiendo en vivo en TikTok en este momento.`);
        }

        if (enableSim) {
          return this.startSimulation(username);
        }

        return {
          ok: false,
          isOffline: true,
          error: `El usuario @${username} no está transmitiendo EN VIVO en este momento.`,
          message: "Asegúrate de que el usuario esté transmitiendo o activa el modo simulación.",
        };
      }

      // Other connection error
      if (enableSim) {
        if (this.addLog) {
          this.addLog("WARN", "TIKTOK", `No se pudo conectar directamente con TikTok LIVE (${errMsg}). Activando modo simulación para desarrollo.`);
        }
        return this.startSimulation(username);
      }

      throw err;
    }
  }

  public startSimulation(username: string) {
    this.activeConnection = null;
    this.isSimulating = true;
    this.activeUsername = username;
    this.currentSimRoomId = `sim_room_${Math.floor(Math.random() * 899999 + 100000)}`;

    if (this.addLog) {
      this.addLog("INFO", "TIKTOK", `🎬 MODO SIMULACIÓN ACTIVO: Transmisión simulada iniciada para @${username} (Room ID: ${this.currentSimRoomId}).`);
    }

    if (this.broadcast) {
      this.broadcast({
        type: "tiktok_connected",
        username,
        roomId: this.currentSimRoomId,
        isSimulated: true,
      });
    }

    // Start auto-simulated events every 4-7 seconds
    const simUsers = ["Carlos_Gamer", "Maria_Stream", "DevFan2026", "GiselaFan99", "Hector_Studio", "Lucia_Vlog"];
    const simComments = [
      "¡Hola! Saludos desde la comunidad 🚀",
      "¡Qué increíble transmisión!",
      "Mándame un saludo por favor 🔥",
      "Sigue así, excelente contenido",
      "¡APOYO TOTAL AL STREAM!",
    ];
    const simGifts = ["Rosa 🌹", "TikTok Logo 🎵", "Gorra 🧢", "Corazón 💖", "Fuego 🔥"];

    this.simulationTimer = setInterval(() => {
      if (!this.isSimulating) return;

      const randomType = Math.random();
      const randomUser = simUsers[Math.floor(Math.random() * simUsers.length)];

      if (randomType < 0.5) {
        // Comment
        const text = simComments[Math.floor(Math.random() * simComments.length)];
        if (this.addLog) this.addLog("INFO", "TIKTOK", `[SIM] Comentario de @${randomUser}: "${text}"`);
        if (this.broadcast) {
          this.broadcast({
            type: "tiktok_comment",
            user: randomUser,
            text,
            isSimulated: true,
            timestamp: new Date().toISOString(),
          });
        }
      } else if (randomType < 0.8) {
        // Gift
        const giftName = simGifts[Math.floor(Math.random() * simGifts.length)];
        const count = Math.floor(Math.random() * 5) + 1;
        if (this.addLog) this.addLog("INFO", "TIKTOK", `[SIM] 🎁 Regalo de @${randomUser}: ${count}x ${giftName}`);
        if (this.broadcast) {
          this.broadcast({
            type: "tiktok_gift",
            user: randomUser,
            giftName,
            count,
            isSimulated: true,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Like or Follow
        if (this.addLog) this.addLog("INFO", "TIKTOK", `[SIM] @${randomUser} le dio me gusta a la transmisión.`);
        if (this.broadcast) {
          this.broadcast({
            type: "tiktok_like",
            user: randomUser,
            count: Math.floor(Math.random() * 10) + 1,
            isSimulated: true,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }, 5000);

    return {
      ok: true,
      roomId: this.currentSimRoomId,
      username,
      isConnected: true,
      isSimulated: true,
      message: `Modo simulación activo para @${username}. Se enviarán eventos de prueba automáticamente.`,
    };
  }

  public emitManualEvent(eventType: "comment" | "gift" | "like", data: { user?: string; text?: string; giftName?: string; count?: number }) {
    const user = data.user || "UsuarioPrueba";
    const timestamp = new Date().toISOString();

    if (eventType === "comment") {
      const text = data.text || "Prueba manual de chat";
      if (this.addLog) this.addLog("INFO", "TIKTOK", `[MANUAL] Comentario de @${user}: "${text}"`);
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_comment",
          user,
          text,
          timestamp,
        });
      }
    } else if (eventType === "gift") {
      const giftName = data.giftName || "Rosa 🌹";
      const count = data.count || 1;
      if (this.addLog) this.addLog("INFO", "TIKTOK", `[MANUAL] 🎁 Regalo de @${user}: ${count}x ${giftName}`);
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_gift",
          user,
          giftName,
          count,
          timestamp,
        });
      }
    } else if (eventType === "like") {
      if (this.addLog) this.addLog("INFO", "TIKTOK", `[MANUAL] @${user} envió me gusta`);
      if (this.broadcast) {
        this.broadcast({
          type: "tiktok_like",
          user,
          count: data.count || 5,
          timestamp,
        });
      }
    }
    return { ok: true };
  }

  public async disconnect() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    this.isSimulating = false;
    this.currentSimRoomId = null;

    if (this.activeConnection) {
      try {
        await this.activeConnection.disconnect();
      } catch (e) {
        console.warn("[TikTok Connector] Error disconnecting active session:", e);
      }
      this.activeConnection = null;
    }

    this.activeUsername = null;
    if (this.addLog) {
      this.addLog("INFO", "TIKTOK", "Sesión de TikTok LIVE desconectada.");
    }
    if (this.broadcast) {
      this.broadcast({ type: "tiktok_disconnected" });
    }
    return { ok: true, message: "Desconectado" };
  }

  public async fetchRoomInfo(usernameInput: string) {
    const username = this.sanitizeUsername(usernameInput);
    try {
      const conn = new TikTokLiveConnection(username, {});
      const isLive = await (conn as any).fetchIsLive(username);
      let roomInfo = null;
      if (isLive) {
        roomInfo = await (conn as any).fetchRoomInfo();
      }
      return {
        username,
        isLive,
        roomInfo,
      };
    } catch (err: any) {
      return {
        username,
        isLive: false,
        error: String(err?.message || err),
      };
    }
  }
}

export const tiktokLiveConnector = new TikTokLiveConnectorManager();
