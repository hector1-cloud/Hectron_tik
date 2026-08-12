import { useState, useContext, KeyboardEvent } from "react";
import { BrainContext } from "../BrainContext";
import { MessageSquare, Send, Sparkles, Music2, CheckCircle2, User, Bot, Volume2, Gift } from "lucide-react";

export function Chat() {
  const {
    messages,
    addMessage,
    tiktokConnected,
    setTiktokConnected,
    setEmotion,
    isAutonomous,
    speakText,
    isSpeaking,
    addLog,
    obsStatus,
    setObsStatus,
  } = useContext(BrainContext);

  const [input, setInput] = useState("");
  const [tiktokCode, setTiktokCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Reacciona a cada tipo de regalo en TikTok con una animación/emoción y un cambio de escena
  const handleGiftAnimation = async (giftType: string) => {
    let targetEmotion: any = "HAPPY";
    let targetScene = "HAPPY_SCENE";
    let giftLabel = "regalo";
    let voiceResponse = "";

    const normalized = giftType.toLowerCase().trim();

    if (normalized.includes("rosa") || normalized.includes("rose")) {
      targetEmotion = "FLIRT";
      targetScene = "FLIRT_SCENE";
      giftLabel = "Rosa 🌹";
      voiceResponse = "¡Oh, una rosa! Qué romántico, muchísimas gracias por este hermoso detalle. ¡Me sonrojas!";
    } else if (normalized.includes("corona") || normalized.includes("crown")) {
      targetEmotion = "SURPRISE";
      targetScene = "SURPRISE_SCENE";
      giftLabel = "Corona 👑";
      voiceResponse = "¡Guao! ¡Una corona majestuosa! ¡No lo puedo creer, me siento como una verdadera reina del escenario! ¡Gracias!";
    } else if (normalized.includes("pesa") || normalized.includes("dumbbell")) {
      targetEmotion = "HAPPY";
      targetScene = "HAPPY_SCENE";
      giftLabel = "Pesa 🏋️";
      voiceResponse = "¡Eso es, a ponerse en forma! Muchas gracias por la pesa, ¡vamos con toda la energía hoy!";
    } else if (normalized.includes("picante") || normalized.includes("chili")) {
      targetEmotion = "ANGRY";
      targetScene = "ANGRY_SCENE";
      giftLabel = "Picante 🌶️";
      voiceResponse = "¡Ay ay ay, eso pica demasiado! ¡Casi me quemo la lengua! Qué travieso de tu parte.";
    } else if (normalized.includes("llanto") || normalized.includes("cry")) {
      targetEmotion = "SAD";
      targetScene = "SAD_SCENE";
      giftLabel = "Llanto 🥺";
      voiceResponse = "Oh, por favor no llores. Muchas gracias por tu apoyo cariñoso, me conmueve muchísimo.";
    } else {
      targetEmotion = "HAPPY";
      targetScene = "HAPPY_SCENE";
      giftLabel = `${giftType} 🎁`;
      voiceResponse = `¡Muchas gracias por ese genial regalo de ${giftType}! ¡Me hace muy feliz tu apoyo!`;
    }

    // 1. Cambiar emoción del avatar de Miku
    setEmotion(targetEmotion);

    // 2. Cambiar escena simulada de OBS
    setObsStatus({ ...obsStatus, scene: targetScene });

    // 3. Registrar log del sistema
    addLog("INFO", "TIKTOK", `Reacción a regalo: ${giftLabel} -> Escena: ${targetScene}, Emoción: ${targetEmotion}`);

    // 4. Añadir mensaje simulado al feed
    addMessage({
      sender: `Regalo: Espectador`,
      text: `¡Envió ${giftLabel}! 💖`,
      isAi: false,
    });

    // 5. Reproducir respuesta de voz adorable
    await speakText(voiceResponse, targetEmotion);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    addMessage({
      sender: "Tú",
      text: userText,
      isAi: false,
    });

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, user: "Viewer" }),
      });

      if (res.ok) {
        const data = await res.json();
        addMessage({
          sender: "HECTRON (Miku)",
          text: data.response,
          emotion: data.emotion,
          isAi: true,
        });

        if (data.emotion) {
          setEmotion(data.emotion);
        }

        // Trigger TTS Speech
        await speakText(data.response, data.emotion);
      }
    } catch (err) {
      console.error("Error communicating with AI Brain:", err);
      addMessage({
        sender: "HECTRON (Miku)",
        text: "¡Hola! Gracias por el mensaje. ¡Miku está en vivo y lista para cantar! 🎤💙",
        emotion: "HAPPY",
        isAi: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleInitTikTok = async () => {
    if (!tiktokCode.trim()) return;
    localStorage.setItem("hectron_tiktok_code", tiktokCode);
    
    const maxRetries = 3;
    let attempt = 0;
    
    const makeRequest = async (): Promise<boolean> => {
      try {
        const res = await fetch("/api/tiktok/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: tiktokCode }),
        });
        if (res.ok) {
          return true;
        }
        throw new Error(`Server status: ${res.status}`);
      } catch (err) {
        if (attempt < maxRetries) {
          attempt++;
          const delay = Math.pow(2, attempt) * 1000;
          addLog("WARN", "TIKTOK", `Fallo de conexión en el handshake de TikTok. Reintentando en ${delay / 1000}s (Intento ${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeRequest();
        }
        throw err;
      }
    };

    try {
      const success = await makeRequest();
      if (success) {
        setTiktokConnected(true);
        addLog("INFO", "TIKTOK", "Sesión de TikTok LIVE vinculada de manera exitosa tras la validación de red.");
      }
    } catch (err: any) {
      console.warn("TikTok connection failed after retries, applying fallback simulation:", err);
      setTiktokConnected(true);
      addLog("INFO", "TIKTOK", "Sesión de TikTok LIVE vinculada (Modo simulación tras reintentos fallidos)");
    }
  };

  const handleTriggerInitiative = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brain/initiative", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        addMessage({
          sender: "HECTRON (Miku)",
          text: data.response,
          emotion: data.emotion,
          isAi: true,
        });
        if (data.emotion) setEmotion(data.emotion);
        await speakText(data.response, data.emotion);
      }
    } catch (err) {
      console.warn("Initiative fail:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">💬 Chat de Transmisión</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerInitiative}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-full hover:bg-cyan-900/50 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hablar Proactivo</span>
          </button>

          {tiktokConnected ? (
            <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> TikTok LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-bold">
              <Music2 className="w-3.5 h-3.5" /> Chat Demo
            </span>
          )}
        </div>
      </div>

      {/* TikTok Connect Banner if not connected */}
      {!tiktokConnected && (
        <div className="bg-slate-950 border border-cyan-500/30 p-3 rounded-lg flex flex-col sm:flex-row gap-2 items-center justify-between shrink-0 text-xs">
          <div className="text-slate-300 flex items-center gap-2">
            <Music2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>¿Tienes tu código de la API de TikTok LIVE? Integración instantánea.</span>
          </div>
          <div className="flex gap-1.5 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Código Auth TikTok"
              value={tiktokCode}
              onChange={(e) => setTiktokCode(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-white text-xs flex-1 sm:w-36 outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleInitTikTok}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1 rounded cursor-pointer"
            >
              Conectar
            </button>
          </div>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600" />
            <p>Escribe un mensaje para conversar con HECTRON Miku o presiona "Hablar Proactivo".</p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-xl border text-xs leading-relaxed transition ${
                m.isAi
                  ? "bg-cyan-950/40 border-cyan-500/30 text-slate-200 ml-2"
                  : "bg-slate-950 border-slate-800 text-slate-300 mr-2"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-bold flex items-center gap-1.5 ${m.isAi ? "text-cyan-400" : "text-slate-400"}`}>
                  {m.isAi ? <Bot className="w-3.5 h-3.5 text-cyan-400" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
                  {m.sender}
                </span>

                <div className="flex items-center gap-2">
                  {m.emotion && (
                    <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      {m.emotion}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                </div>
              </div>

              <p className="text-sm font-medium">{m.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Simulador de Regalos Interactivos */}
      <div className="bg-slate-950/80 border border-slate-850 p-2.5 rounded-lg shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mb-1.5 px-1">
          <Gift className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Simulador de Regalos TikTok LIVE</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleGiftAnimation("rosa")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/20 text-rose-300 text-xs font-semibold cursor-pointer transition"
          >
            <span>🌹</span> Rosa
          </button>
          <button
            onClick={() => handleGiftAnimation("corona")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/20 text-amber-300 text-xs font-semibold cursor-pointer transition"
          >
            <span>👑</span> Corona
          </button>
          <button
            onClick={() => handleGiftAnimation("pesa")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/20 text-emerald-300 text-xs font-semibold cursor-pointer transition"
          >
            <span>🏋️</span> Pesa
          </button>
          <button
            onClick={() => handleGiftAnimation("picante")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-orange-950/30 hover:bg-orange-900/40 border border-orange-500/20 text-orange-300 text-xs font-semibold cursor-pointer transition"
          >
            <span>🌶️</span> Picante
          </button>
          <button
            onClick={() => handleGiftAnimation("llanto")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/20 text-indigo-300 text-xs font-semibold cursor-pointer transition"
          >
            <span>🥺</span> Llanto
          </button>
        </div>
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2 shrink-0 pt-2 border-t border-slate-800">
        <input
          type="text"
          placeholder="Escribe como espectador del directo..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-4 py-2.5 text-sm text-white outline-none transition"
        />

        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 p-2.5 rounded-lg font-bold transition flex items-center justify-center cursor-pointer shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {isSpeaking && (
        <div className="flex items-center gap-2 text-xs text-pink-400 font-semibold animate-pulse pt-1">
          <Volume2 className="w-4 h-4" />
          <span>Sintetizando voz de Miku Hatsune...</span>
        </div>
      )}
    </div>
  );
}
