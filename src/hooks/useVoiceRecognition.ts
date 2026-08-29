import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { BrainContext } from "../BrainContext";
import { Emotion, AvatarAnimationClass, VoiceCommandItem, VoiceRecognitionState } from "../types";

// Standard list of voice commands with triggers and variations
export const VOICE_COMMANDS: VoiceCommandItem[] = [
  {
    id: "scene_happy",
    title: "Escena Feliz",
    phrase: "Cambiar a escena feliz",
    category: "scene",
    description: "Cambia la escena de OBS a HAPPY_SCENE y sincroniza la emoción del avatar a HAPPY",
    aliases: [
      "cambiar a escena feliz",
      "cambiar escena feliz",
      "escena feliz",
      "pon escena feliz",
      "poner escena feliz",
      "activar escena feliz",
      "cambiar a la escena feliz",
    ],
  },
  {
    id: "scene_sad",
    title: "Escena Triste",
    phrase: "Cambiar a escena triste",
    category: "scene",
    description: "Cambia la escena de OBS a SAD_SCENE y sincroniza la emoción a SAD",
    aliases: [
      "cambiar a escena triste",
      "cambiar escena triste",
      "escena triste",
      "pon escena triste",
      "poner escena triste",
      "activar escena triste",
      "cambiar a la escena triste",
    ],
  },
  {
    id: "scene_angry",
    title: "Escena Enojada",
    phrase: "Cambiar a escena enojada",
    category: "scene",
    description: "Cambia la escena de OBS a ANGRY_SCENE y sincroniza la emoción a ANGRY",
    aliases: [
      "cambiar a escena enojada",
      "cambiar escena enojada",
      "escena enojada",
      "pon escena enojada",
      "poner escena enojada",
      "activar escena enojada",
      "cambiar a la escena enojada",
      "escena furiosa",
    ],
  },
  {
    id: "scene_flirt",
    title: "Escena Coqueta",
    phrase: "Cambiar a escena coqueta",
    category: "scene",
    description: "Cambia la escena de OBS a FLIRT_SCENE y sincroniza la emoción a FLIRT",
    aliases: [
      "cambiar a escena coqueta",
      "cambiar escena coqueta",
      "escena coqueta",
      "pon escena coqueta",
      "poner escena coqueta",
      "activar escena coqueta",
      "cambiar a la escena coqueta",
      "escena amorosa",
    ],
  },
  {
    id: "scene_default",
    title: "Escena Principal / Default",
    phrase: "Cambiar a escena por defecto",
    category: "scene",
    description: "Restaura la escena estándar de OBS y la emoción a IDLE",
    aliases: [
      "cambiar a escena por defecto",
      "cambiar a escena default",
      "escena por defecto",
      "escena default",
      "escena principal",
      "cambiar a escena principal",
      "restaurar escena",
      "volver a escena principal",
    ],
  },
  {
    id: "stream_start",
    title: "Iniciar Transmisión",
    phrase: "Iniciar transmisión",
    category: "stream",
    description: "Arranca la emisión en directo en OBS Studio y notifica al sistema",
    aliases: [
      "iniciar transmision",
      "iniciar directo",
      "iniciar stream",
      "empezar transmision",
      "empezar directo",
      "empezar stream",
      "comenzar transmision",
      "comenzar directo",
      "comenzar stream",
      "start stream",
      "arrancar stream",
    ],
  },
  {
    id: "stream_stop",
    title: "Detener Transmisión",
    phrase: "Detener transmisión",
    category: "stream",
    description: "Finaliza la emisión en directo en OBS Studio y guarda estadísticas",
    aliases: [
      "detener transmision",
      "detener directo",
      "detener stream",
      "parar transmision",
      "parar directo",
      "parar stream",
      "terminar transmision",
      "terminar directo",
      "terminar stream",
      "finalizar transmision",
      "finalizar directo",
      "finalizar stream",
      "stop stream",
      "cortar stream",
    ],
  },
  {
    id: "emotion_surprise",
    title: "Emoción Sorpresa",
    phrase: "Activar emoción sorpresa",
    category: "emotion",
    description: "Activa la emoción SURPRISE en el avatar 3D y ejecuta animación de sorpresa",
    aliases: [
      "activar emocion sorpresa",
      "emocion sorpresa",
      "ponte sorprendida",
      "ponte sorprendido",
      "modo sorpresa",
      "activa sorpresa",
      "cara de sorpresa",
      "sorpresa",
    ],
  },
  {
    id: "emotion_happy",
    title: "Emoción Feliz",
    phrase: "Activar emoción feliz",
    category: "emotion",
    description: "Activa la emoción HAPPY en el avatar 3D con animación alegre",
    aliases: [
      "activar emocion feliz",
      "emocion feliz",
      "ponte feliz",
      "ponte alegre",
      "modo feliz",
      "activa feliz",
      "cara feliz",
      "sonrie",
    ],
  },
  {
    id: "emotion_sad",
    title: "Emoción Triste",
    phrase: "Activar emoción triste",
    category: "emotion",
    description: "Activa la emoción SAD en el avatar 3D con animación melancólica",
    aliases: [
      "activar emocion triste",
      "emocion triste",
      "ponte triste",
      "modo triste",
      "activa triste",
      "cara triste",
      "llorar",
    ],
  },
  {
    id: "emotion_angry",
    title: "Emoción Enojada",
    phrase: "Activar emoción enojada",
    category: "emotion",
    description: "Activa la emoción ANGRY en el avatar 3D con animación enojada",
    aliases: [
      "activar emocion enojada",
      "emocion enojada",
      "ponte enojada",
      "ponte furiosa",
      "modo enojado",
      "activa enojo",
      "cara enojada",
    ],
  },
  {
    id: "emotion_flirt",
    title: "Emoción Coqueta",
    phrase: "Activar emoción coqueta",
    category: "emotion",
    description: "Activa la emoción FLIRT en el avatar 3D con corazones y guiño",
    aliases: [
      "activar emocion coqueta",
      "emocion coqueta",
      "ponte coqueta",
      "modo coqueta",
      "activa coqueta",
      "manda un beso",
      "guino",
    ],
  },
  {
    id: "emotion_idle",
    title: "Emoción Reposo",
    phrase: "Activar emoción reposo",
    category: "emotion",
    description: "Restablece la emoción neutral / IDLE en el avatar 3D",
    aliases: [
      "activar emocion reposo",
      "emocion reposo",
      "emocion neutral",
      "ponte normal",
      "modo reposo",
      "modo idle",
      "descanso",
    ],
  },
  {
    id: "game_save",
    title: "Guardar Partida",
    phrase: "Guardar partida",
    category: "game",
    description: "Ejecuta un guardado rápido automático del estado del mundo y la experiencia",
    aliases: [
      "guardar partida",
      "guardar juego",
      "salvar partida",
      "guardado rapido",
      "grabar juego",
    ],
  },
  {
    id: "game_spawn_relic",
    title: "Generar Reliquia 3D",
    phrase: "Generar reliquia",
    category: "game",
    description: "Invoca un nuevo coleccionable o cristal cósmico en el mundo virtual 3D",
    aliases: [
      "generar reliquia",
      "aparecer reliquia",
      "spawn reliquia",
      "spawn item",
      "crear objeto",
      "aparecer objeto",
      "soltar reliquia",
    ],
  },
  {
    id: "nav_live_studio",
    title: "Ir a Live Studio",
    phrase: "Abrir Live Studio",
    category: "navigation",
    description: "Navega directamente a la pestaña Live Studio & AI Host",
    aliases: [
      "abrir live studio",
      "ir a live studio",
      "mostrar live studio",
      "pantalla live studio",
      "ir al estudio",
    ],
  },
  {
    id: "nav_dashboard",
    title: "Ir a Dashboard",
    phrase: "Abrir Dashboard",
    category: "navigation",
    description: "Navega a la vista principal de control y métricas",
    aliases: [
      "abrir dashboard",
      "ir a dashboard",
      "mostrar dashboard",
      "panel principal",
      "ir al panel",
    ],
  },
  {
    id: "nav_inventory",
    title: "Ir a Inventario",
    phrase: "Abrir Inventario",
    category: "navigation",
    description: "Abre la mochila e inventario de ítems del streamer",
    aliases: [
      "abrir inventario",
      "ir a inventario",
      "mostrar inventario",
      "ver mochila",
      "abrir mochila",
    ],
  },
  {
    id: "nav_linux",
    title: "Ir a Sistema Linux",
    phrase: "Abrir sistema Linux",
    category: "navigation",
    description: "Abre el terminal interactivo Bash y monitor del sistema Linux real",
    aliases: [
      "abrir sistema linux",
      "ir a sistema linux",
      "sistema linux",
      "abrir linux",
      "ver linux",
      "terminal linux",
      "abrir terminal",
      "consola linux",
      "abrir consola",
      "terminal bash",
    ],
  },
];

// Helper to normalize strings for comparison (removes accents, punctuation, lowercase)
export function normalizeVoiceText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics / accents
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'¡!¿]/g, "") // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

// Audio Chime synthesizer using Web Audio API
function playChime(success: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (success) {
      // Pleasant rising arpeggio chord
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else {
      // Low double beep
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  } catch (err) {
    console.debug("Audio chime not supported or muted", err);
  }
}

export function useVoiceRecognition() {
  const {
    obsStatus,
    setObsStatus,
    setEmotion,
    setAnimationClass,
    agentUrl,
    agentStatus,
    addLog,
    speakText,
    triggerAutoSave,
    spawnRandomWorldItem,
    setActiveTab,
  } = useContext(BrainContext);

  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    transcript: "",
    interimTranscript: "",
    lastCommand: null,
    lastExecutionTime: null,
    lastStatus: "idle",
    statusMessage: "Reconocimiento de voz listo.",
    isSupported: true,
    permissionGranted: false,
    language: "es-ES",
    continuous: true,
    audioFeedback: true,
    voiceAck: true,
  });

  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldListenRef = useRef<boolean>(false);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setState((prev) => ({
        ...prev,
        isSupported: false,
        statusMessage:
          "Web Speech API no disponible en este navegador. Puedes usar los botones de simulación.",
      }));
    }
  }, []);

  // Execute a matched command
  const executeCommand = useCallback(
    async (cmd: VoiceCommandItem, rawSpoken: string) => {
      const timeStr = new Date().toLocaleTimeString();

      setState((prev) => ({
        ...prev,
        lastCommand: cmd,
        lastExecutionTime: timeStr,
        lastStatus: "matched",
        statusMessage: `Comando ejecutado: "${cmd.title}"`,
      }));

      addLog("INFO", "FRONTEND", `🎤 Comando de voz ejecutado: "${cmd.title}" (Reconocido: "${rawSpoken}")`);

      if (state.audioFeedback) {
        playChime(true);
      }

      // Execute based on ID
      switch (cmd.id) {
        // --- SCENES ---
        case "scene_happy":
          setObsStatus({ ...obsStatus, scene: "HAPPY_SCENE" });
          setEmotion("HAPPY");
          setAnimationClass("happy");
          if (agentUrl && agentStatus === "ONLINE") {
            fetch(`${agentUrl}/scene`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Agent-Token": "default_token" },
              body: JSON.stringify({ scene: "HAPPY_SCENE" }),
            }).catch(() => {});
          }
          if (state.voiceAck) {
            speakText("¡Cambiando a escena feliz!", "HAPPY", "happy");
          }
          break;

        case "scene_sad":
          setObsStatus({ ...obsStatus, scene: "SAD_SCENE" });
          setEmotion("SAD");
          setAnimationClass("sad");
          if (agentUrl && agentStatus === "ONLINE") {
            fetch(`${agentUrl}/scene`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Agent-Token": "default_token" },
              body: JSON.stringify({ scene: "SAD_SCENE" }),
            }).catch(() => {});
          }
          if (state.voiceAck) {
            speakText("Cambiando a escena triste.", "SAD", "sad");
          }
          break;

        case "scene_angry":
          setObsStatus({ ...obsStatus, scene: "ANGRY_SCENE" });
          setEmotion("ANGRY");
          setAnimationClass("angry");
          if (agentUrl && agentStatus === "ONLINE") {
            fetch(`${agentUrl}/scene`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Agent-Token": "default_token" },
              body: JSON.stringify({ scene: "ANGRY_SCENE" }),
            }).catch(() => {});
          }
          if (state.voiceAck) {
            speakText("¡Cambiando a escena de combate y enojo!", "ANGRY", "angry");
          }
          break;

        case "scene_flirt":
          setObsStatus({ ...obsStatus, scene: "FLIRT_SCENE" });
          setEmotion("FLIRT");
          setAnimationClass("flirt");
          if (agentUrl && agentStatus === "ONLINE") {
            fetch(`${agentUrl}/scene`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Agent-Token": "default_token" },
              body: JSON.stringify({ scene: "FLIRT_SCENE" }),
            }).catch(() => {});
          }
          if (state.voiceAck) {
            speakText("¡Cambiando a escena coqueta! Jeje.", "FLIRT", "flirt");
          }
          break;

        case "scene_default":
          setObsStatus({ ...obsStatus, scene: "DEFAULT" });
          setEmotion("IDLE");
          setAnimationClass("idle");
          if (agentUrl && agentStatus === "ONLINE") {
            fetch(`${agentUrl}/scene`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Agent-Token": "default_token" },
              body: JSON.stringify({ scene: "DEFAULT" }),
            }).catch(() => {});
          }
          if (state.voiceAck) {
            speakText("Volviendo a la escena principal.", "IDLE", "idle");
          }
          break;

        // --- STREAM START / STOP ---
        case "stream_start":
          setObsStatus({ ...obsStatus, streaming: true });
          if (agentUrl && agentStatus === "ONLINE") {
            fetch(`${agentUrl}/live/start`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Agent-Token": "default_token" },
            }).catch(() => {});
          }
          if (state.voiceAck) {
            speakText("¡Transmisión iniciada en directo! ¡Estamos en vivo!", "HAPPY", "excited");
          }
          break;

        case "stream_stop":
          setObsStatus({ ...obsStatus, streaming: false });
          if (agentUrl && agentStatus === "ONLINE") {
            fetch(`${agentUrl}/live/stop`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Agent-Token": "default_token" },
            }).catch(() => {});
          }
          if (state.voiceAck) {
            speakText("Transmisión finalizada. ¡Gracias a todos los espectadores!", "IDLE", "idle");
          }
          break;

        // --- EMOTIONS ---
        case "emotion_surprise":
          setEmotion("SURPRISE");
          setAnimationClass("surprised");
          if (state.voiceAck) {
            speakText("¡Waaah! ¡Qué sorpresa tan grande!", "SURPRISE", "surprised");
          }
          break;

        case "emotion_happy":
          setEmotion("HAPPY");
          setAnimationClass("happy");
          if (state.voiceAck) {
            speakText("¡Estoy súper feliz y lista para el stream!", "HAPPY", "happy");
          }
          break;

        case "emotion_sad":
          setEmotion("SAD");
          setAnimationClass("sad");
          if (state.voiceAck) {
            speakText("Me siento un poco melancólica...", "SAD", "sad");
          }
          break;

        case "emotion_angry":
          setEmotion("ANGRY");
          setAnimationClass("angry");
          if (state.voiceAck) {
            speakText("¡Grrr! ¡No me hagan enojar!", "ANGRY", "angry");
          }
          break;

        case "emotion_flirt":
          setEmotion("FLIRT");
          setAnimationClass("flirt");
          if (state.voiceAck) {
            speakText("¡Un saludo muy especial con mucho cariño!", "FLIRT", "flirt");
          }
          break;

        case "emotion_idle":
          setEmotion("IDLE");
          setAnimationClass("idle");
          if (state.voiceAck) {
            speakText("Modo reposo activado.", "IDLE", "idle");
          }
          break;

        // --- GAME & WORLD ---
        case "game_save":
          triggerAutoSave("Guardado por comando de voz");
          if (state.voiceAck) {
            speakText("¡Partida y progreso guardados exitosamente!", "HAPPY", "happy");
          }
          break;

        case "game_spawn_relic": {
          const spawned = spawnRandomWorldItem();
          if (state.voiceAck) {
            speakText(`¡Nueva reliquia cósmica ${spawned.name} invocada en el escenario!`, "HAPPY", "excited");
          }
          break;
        }

        // --- NAVIGATION ---
        case "nav_live_studio":
          setActiveTab("livestudio");
          if (state.voiceAck) {
            speakText("Abriendo Live Studio y anfitrión autónomo.", "IDLE", "idle");
          }
          break;

        case "nav_dashboard":
          setActiveTab("dashboard");
          if (state.voiceAck) {
            speakText("Mostrando panel de control.", "IDLE", "idle");
          }
          break;

        case "nav_inventory":
          setActiveTab("inventory");
          if (state.voiceAck) {
            speakText("Abriendo inventario de reliquias.", "IDLE", "idle");
          }
          break;

        case "nav_linux":
          setActiveTab("linux");
          if (state.voiceAck) {
            speakText("Abriendo terminal y sistema Linux real.", "IDLE", "idle");
          }
          break;
      }
    },
    [
      obsStatus,
      setObsStatus,
      setEmotion,
      setAnimationClass,
      agentUrl,
      agentStatus,
      addLog,
      speakText,
      triggerAutoSave,
      spawnRandomWorldItem,
      setActiveTab,
      state.audioFeedback,
      state.voiceAck,
    ]
  );

  // Match text against commands
  const processSpokenPhrase = useCallback(
    (spokenText: string) => {
      if (!spokenText || !spokenText.trim()) return;

      const normalized = normalizeVoiceText(spokenText);

      // Find matching command
      let matchedCmd: VoiceCommandItem | null = null;

      for (const cmd of VOICE_COMMANDS) {
        // Exact alias check or substring match
        const hasAlias = cmd.aliases.some((alias) => {
          const normAlias = normalizeVoiceText(alias);
          return normalized === normAlias || normalized.includes(normAlias) || normAlias.includes(normalized);
        });

        if (hasAlias) {
          matchedCmd = cmd;
          break;
        }
      }

      if (matchedCmd) {
        executeCommand(matchedCmd, spokenText);
      } else {
        setState((prev) => ({
          ...prev,
          lastStatus: "unrecognized",
          statusMessage: `No se reconoció el comando: "${spokenText}". Di por ejemplo "Cambiar a escena feliz" o "Iniciar transmisión".`,
        }));
        if (state.audioFeedback) {
          playChime(false);
        }
      }
    },
    [executeCommand, state.audioFeedback]
  );

  // Manual execution (for UI buttons or test inputs)
  const executeCommandById = useCallback(
    (commandId: string) => {
      const cmd = VOICE_COMMANDS.find((c) => c.id === commandId);
      if (cmd) {
        executeCommand(cmd, cmd.phrase);
      }
    },
    [executeCommand]
  );

  const executeCustomText = useCallback(
    (text: string) => {
      setState((prev) => ({ ...prev, transcript: text, interimTranscript: "" }));
      processSpokenPhrase(text);
    },
    [processSpokenPhrase]
  );

  // Start Voice Recognition
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState((prev) => ({
        ...prev,
        isSupported: false,
        statusMessage: "Navegador no soporta Web Speech API. Usa los comandos de prueba.",
      }));
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = state.language;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        shouldListenRef.current = true;
        setState((prev) => ({
          ...prev,
          isListening: true,
          permissionGranted: true,
          statusMessage: "🎤 Micrófono activo. Di un comando como 'Cambiar a escena feliz'...",
          lastStatus: "idle",
        }));
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptSegment;
          } else {
            interim += transcriptSegment;
          }
        }

        if (interim) {
          setState((prev) => ({ ...prev, interimTranscript: interim }));
        }

        if (final) {
          const cleanedFinal = final.trim();
          setState((prev) => ({
            ...prev,
            transcript: cleanedFinal,
            interimTranscript: "",
          }));
          processSpokenPhrase(cleanedFinal);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          shouldListenRef.current = false;
          setState((prev) => ({
            ...prev,
            isListening: false,
            permissionGranted: false,
            lastStatus: "error",
            statusMessage: "Permiso de micrófono denegado en el navegador.",
          }));
        } else if (event.error !== "no-speech") {
          setState((prev) => ({
            ...prev,
            lastStatus: "error",
            statusMessage: `Error de audio: ${event.error}`,
          }));
        }
      };

      recognition.onend = () => {
        // Automatically restart if continuous listening is enabled and desired
        if (shouldListenRef.current && state.continuous) {
          restartTimerRef.current = setTimeout(() => {
            try {
              if (shouldListenRef.current) {
                recognition.start();
              }
            } catch {}
          }, 300);
        } else {
          setState((prev) => ({
            ...prev,
            isListening: false,
            interimTranscript: "",
          }));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn("Failed to start speech recognition:", err);
      setState((prev) => ({
        ...prev,
        isListening: false,
        lastStatus: "error",
        statusMessage: `No se pudo iniciar el micrófono: ${err.message || String(err)}`,
      }));
    }
  }, [state.language, state.continuous, processSpokenPhrase]);

  // Stop Voice Recognition
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    }
    setState((prev) => ({
      ...prev,
      isListening: false,
      interimTranscript: "",
      statusMessage: "Reconocimiento de voz pausado.",
    }));
  }, []);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  return {
    state,
    setState,
    commands: VOICE_COMMANDS,
    startListening,
    stopListening,
    toggleListening,
    executeCommandById,
    executeCustomText,
  };
}
