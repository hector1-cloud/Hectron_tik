import { useState, useEffect, useCallback, useRef } from "react";
import {
  Emotion,
  ChatMessage,
  TtsVoiceSettings,
  VirtualStreamerState,
} from "../types";
import { playSynthesizedSfx } from "../lib/gameAudio";

const LOCAL_STORAGE_STATE_KEY = "hectron_virtual_streamer_state_v1";

export function useStreamerStatePersistence(
  emotion: Emotion,
  setEmotion: (e: Emotion) => void,
  activeScene: string,
  setScene: (scene: string) => void,
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  isAutonomous: boolean,
  setIsAutonomous: (v: boolean) => void,
  ttsVoiceSettings: TtsVoiceSettings,
  setTtsVoiceSettings: React.Dispatch<React.SetStateAction<TtsVoiceSettings>>,
  equippedRewards: any,
  addLog?: (level: any, scope: any, message: string, details?: any) => void
) {
  const [streamerStateRestoredNotice, setStreamerStateRestoredNotice] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(true);
  const hasRestoredRef = useRef<boolean>(false);

  // Dismiss notification helper
  const dismissStreamerRestoredNotice = useCallback(() => {
    setStreamerStateRestoredNotice(null);
  }, []);

  // 1. Initial State Restoration on Boot (Server DB + LocalStorage fallback)
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restoreStreamerStateOnBoot = async () => {
      try {
        let stateToRestore: VirtualStreamerState | null = null;

        // Try 1: Fetch from server filesystem/database endpoint
        try {
          const res = await fetch("/api/streamer/state");
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.state && data.source !== "default") {
              stateToRestore = data.state;
            }
          }
        } catch {
          // Network fetch ignored
        }

        // Try 2: LocalStorage fallback if server had default
        if (!stateToRestore) {
          const localRaw = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
          if (localRaw) {
            stateToRestore = JSON.parse(localRaw);
          }
        }

        // If we found a valid previous state, restore everything
        if (stateToRestore) {
          if (stateToRestore.emotion) {
            setEmotion(stateToRestore.emotion);
          }
          if (stateToRestore.activeScene) {
            setScene(stateToRestore.activeScene);
          }
          if (Array.isArray(stateToRestore.chatHistory) && stateToRestore.chatHistory.length > 0) {
            setMessages(stateToRestore.chatHistory);
          }
          if (typeof stateToRestore.isAutonomous === "boolean") {
            setIsAutonomous(stateToRestore.isAutonomous);
          }
          if (stateToRestore.ttsVoiceSettings) {
            setTtsVoiceSettings((prev) => ({ ...prev, ...stateToRestore!.ttsVoiceSettings }));
          }

          const notice = `✨ Estado restaurado con éxito: Emoción ${stateToRestore.emotion || 'HAPPY'}, Escena ${stateToRestore.activeScene || 'DEFAULT'}, ${stateToRestore.chatHistory?.length || 0} mensajes de chat recuperados.`;
          setStreamerStateRestoredNotice(notice);

          if (addLog) {
            addLog(
              "INFO",
              "SERVER",
              `Estado del streamer virtual restaurado: Emoción [${stateToRestore.emotion}], Escena [${stateToRestore.activeScene}], ${stateToRestore.chatHistory?.length || 0} mensajes.`
            );
          }

          // Auto-hide notice after 6 seconds
          setTimeout(() => {
            setStreamerStateRestoredNotice(null);
          }, 6000);
        }
      } catch (err: any) {
        console.warn("Could not restore streamer state on boot:", err);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreStreamerStateOnBoot();
  }, [setEmotion, setScene, setMessages, setIsAutonomous, setTtsVoiceSettings, addLog]);

  // Current full state snapshot generator
  const buildCurrentStatePayload = useCallback((): VirtualStreamerState => {
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      emotion,
      activeScene,
      chatHistory: messages.slice(-50), // keep latest 50 messages
      isAutonomous,
      isStreaming: false,
      tiktokConnected: false,
      ttsVoiceSettings,
      streamStats: {
        totalViewersServed: 1240,
        giftsReceivedCount: 18,
        itemsCollectedCount: 4,
        questsCompletedCount: 2,
        totalChatMessages: messages.length,
        minutesStreamed: 15,
        totalLikes: 420,
        hypeMultiplier: 1.25,
      },
      equippedRewards: equippedRewards || {
        activeAnimation: "happy",
        activeSpecialPhrase: "¡Saludos a todos los ciber-viajeros! Gracias por la energía estelar. 💙✨",
        activeVisualEffect: "CYAN_NEON",
        activeTitle: "🌟 Streamer Holográfica Prime",
      },
      unlockedAchievementIds: ["chat_first_message"],
      claimedRewardIds: ["phrase_greeting_legend"],
    };
  }, [emotion, activeScene, messages, isAutonomous, ttsVoiceSettings, equippedRewards]);

  // 2. Save state to LocalStorage and Server Endpoint
  const saveStreamerFullState = useCallback(
    async (slotId?: string): Promise<{ success: boolean; message: string }> => {
      try {
        const payload = buildCurrentStatePayload();

        // Save to localStorage
        localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(payload));
        if (slotId) {
          localStorage.setItem(`hectron_streamer_slot_${slotId}`, JSON.stringify(payload));
        }

        // Save to Server filesystem / DB
        const serverRes = await fetch("/api/streamer/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: payload, slotId }),
        });

        playSynthesizedSfx("save");
        if (addLog) {
          addLog("INFO", "FRONTEND", "Estado completo del streamer guardado en archivo local y base de datos.");
        }

        return {
          success: true,
          message: "Estado del streamer virtual (emoción, escena, chat e inventario) guardado exitosamente.",
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Error al guardar estado: ${err?.message || String(err)}`,
        };
      }
    },
    [buildCurrentStatePayload, addLog]
  );

  // 3. Load state from specific slot or server
  const loadStreamerFullState = useCallback(
    async (slotId?: string): Promise<{ success: boolean; message: string }> => {
      try {
        let loaded: VirtualStreamerState | null = null;

        if (slotId) {
          const raw = localStorage.getItem(`hectron_streamer_slot_${slotId}`);
          if (raw) loaded = JSON.parse(raw);
        }

        if (!loaded) {
          const res = await fetch("/api/streamer/state");
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.state) {
              loaded = data.state;
            }
          }
        }

        if (!loaded) {
          const localRaw = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
          if (localRaw) loaded = JSON.parse(localRaw);
        }

        if (loaded) {
          if (loaded.emotion) setEmotion(loaded.emotion);
          if (loaded.activeScene) setScene(loaded.activeScene);
          if (Array.isArray(loaded.chatHistory)) setMessages(loaded.chatHistory);
          if (typeof loaded.isAutonomous === "boolean") setIsAutonomous(loaded.isAutonomous);
          if (loaded.ttsVoiceSettings) setTtsVoiceSettings(loaded.ttsVoiceSettings);

          playSynthesizedSfx("load");
          if (addLog) {
            addLog("INFO", "FRONTEND", `Estado del streamer cargado: ${loaded.emotion} (${loaded.activeScene})`);
          }

          return {
            success: true,
            message: `Estado restaurado: Emoción [${loaded.emotion}], Escena [${loaded.activeScene}], ${loaded.chatHistory?.length || 0} mensajes de chat.`,
          };
        }

        return {
          success: false,
          message: "No se encontró ningún estado previo guardado.",
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Error al cargar estado: ${err?.message || String(err)}`,
        };
      }
    },
    [setEmotion, setScene, setMessages, setIsAutonomous, setTtsVoiceSettings, addLog]
  );

  // 4. Reset state
  const resetStreamerFullState = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_STATE_KEY);
      await fetch("/api/streamer/state/reset", { method: "POST" });
      setEmotion("HAPPY");
      setScene("DEFAULT");
      setMessages([
        {
          id: "miku_reset_1",
          sender: "HECTRON (Miku)",
          text: "¡Hola a todos! Bienvenidos al directo. Soy Miku y estoy lista para platicar con ustedes. 🎤💙",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          emotion: "HAPPY",
          isAi: true,
        },
      ]);
      return { success: true, message: "Estado del streamer virtual restablecido con éxito." };
    } catch (err: any) {
      return { success: false, message: `Error al restablecer: ${err?.message || String(err)}` };
    }
  }, [setEmotion, setScene, setMessages]);

  // 5. Export JSON
  const exportStreamerStateJSON = useCallback((): string => {
    const payload = buildCurrentStatePayload();
    return JSON.stringify(payload, null, 2);
  }, [buildCurrentStatePayload]);

  // 6. Import JSON
  const importStreamerStateJSON = useCallback(
    async (jsonStr: string): Promise<{ success: boolean; message: string }> => {
      try {
        const parsed: VirtualStreamerState = JSON.parse(jsonStr);
        if (!parsed || typeof parsed !== "object" || !parsed.emotion) {
          throw new Error("El archivo no contiene un formato de estado de streamer válido.");
        }

        setEmotion(parsed.emotion);
        if (parsed.activeScene) setScene(parsed.activeScene);
        if (Array.isArray(parsed.chatHistory)) setMessages(parsed.chatHistory);
        if (typeof parsed.isAutonomous === "boolean") setIsAutonomous(parsed.isAutonomous);
        if (parsed.ttsVoiceSettings) setTtsVoiceSettings(parsed.ttsVoiceSettings);

        localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(parsed));
        await fetch("/api/streamer/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: parsed }),
        });

        playSynthesizedSfx("load");
        return {
          success: true,
          message: `¡Estado importado con éxito! Emoción: ${parsed.emotion}, Escena: ${parsed.activeScene}`,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Error al importar estado: ${err?.message || "JSON corrupto"}`,
        };
      }
    },
    [setEmotion, setScene, setMessages, setIsAutonomous, setTtsVoiceSettings]
  );

  // 7. Auto-save periodically every 45 seconds if not restoring
  useEffect(() => {
    if (isRestoring) return;
    const timer = setInterval(() => {
      try {
        const payload = buildCurrentStatePayload();
        localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(payload));
      } catch {}
    }, 45000);
    return () => clearInterval(timer);
  }, [isRestoring, buildCurrentStatePayload]);

  return {
    saveStreamerFullState,
    loadStreamerFullState,
    resetStreamerFullState,
    exportStreamerStateJSON,
    importStreamerStateJSON,
    streamerStateRestoredNotice,
    dismissStreamerRestoredNotice,
  };
}
