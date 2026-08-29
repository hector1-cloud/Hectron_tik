import React, { useState } from "react";
import { useVoiceRecognition, VOICE_COMMANDS } from "../hooks/useVoiceRecognition";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Layers,
  Smile,
  Sparkles,
  Play,
  Square,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Send,
  HelpCircle,
  Volume1,
  Activity,
  Zap,
} from "lucide-react";

export function VoiceCommanderCard({ className = "" }: { className?: string }) {
  const {
    state,
    setState,
    commands,
    toggleListening,
    executeCommandById,
    executeCustomText,
  } = useVoiceRecognition();

  const [testInput, setTestInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "Todos", icon: Sparkles },
    { id: "scene", label: "Escenas OBS", icon: Layers },
    { id: "stream", label: "Transmisión", icon: Radio },
    { id: "emotion", label: "Emociones 3D", icon: Smile },
    { id: "game", label: "Mundo & Juego", icon: Zap },
  ];

  const filteredCommands =
    selectedCategory === "all"
      ? commands
      : commands.filter((c) => c.category === selectedCategory);

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    executeCustomText(testInput.trim());
    setTestInput("");
  };

  return (
    <div
      id="voice-commander-card"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6 ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl transition-all duration-300 ${
              state.isListening
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/20"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            <Mic className={`w-6 h-6 ${state.isListening ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Control por Reconocimiento de Voz
              </h2>
              {state.isListening ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 border border-rose-500/50 text-rose-300 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  ESCUCHANDO EN VIVO
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  MICRÓFONO EN ESPERA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Di comandos en voz alta como <span className="text-cyan-300 font-semibold">"Cambiar a escena feliz"</span> o{" "}
              <span className="text-rose-300 font-semibold">"Iniciar transmisión"</span>.
            </p>
          </div>
        </div>

        {/* Mic Main Toggle Button */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            id="btn-toggle-voice-listening"
            onClick={toggleListening}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-lg ${
              state.isListening
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20 border border-rose-400/40"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 border border-indigo-400/40"
            }`}
          >
            {state.isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Pausar Micrófono</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Activar Reconocimiento</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Audio Waveform & Transcript Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Status & Waveform */}
        <div className="md:col-span-7 bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Transcripción en Tiempo Real
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setState((p) => ({ ...p, audioFeedback: !p.audioFeedback }))}
                title="Efecto de sonido al ejecutar comando"
                className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                  state.audioFeedback
                    ? "bg-cyan-950 border-cyan-500/40 text-cyan-300"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}
              >
                {state.audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setState((p) => ({ ...p, voiceAck: !p.voiceAck }))}
                title="Respuesta hablada del Avatar Gemini TTS"
                className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                  state.voiceAck
                    ? "bg-indigo-950 border-indigo-500/40 text-indigo-300"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}
              >
                <span className="text-[10px] font-bold px-0.5">TTS</span>
              </button>
            </div>
          </div>

          {/* Realtime Spoken Text Area */}
          <div className="min-h-[56px] flex items-center bg-[#0B0F19] rounded-lg p-3 border border-slate-850">
            {state.isListening ? (
              <div className="w-full">
                {state.interimTranscript ? (
                  <p className="text-xs text-cyan-300 font-mono italic animate-pulse">
                    "...{state.interimTranscript}"
                  </p>
                ) : state.transcript ? (
                  <p className="text-xs text-white font-mono font-medium">
                    "{state.transcript}"
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <span className="flex gap-1 items-center">
                      {[30, 70, 45, 90, 60, 30, 80, 50].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-rose-500 rounded-full animate-pulse"
                          style={{
                            height: `${h * 0.2}px`,
                            animationDelay: `${i * 0.12}s`,
                          }}
                        />
                      ))}
                    </span>
                    <span>Escuchando tu voz... Habla claro al micrófono.</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                El micrófono está en pausa. Haz clic en "Activar Reconocimiento" o usa el simulador inferior.
              </p>
            )}
          </div>

          {/* Status Message Footer */}
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400 truncate">
              {state.lastStatus === "matched" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : state.lastStatus === "unrecognized" ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span className="truncate">{state.statusMessage}</span>
            </div>
            <span className="text-[10px] text-slate-600 font-mono shrink-0 ml-2">
              Idioma: {state.language}
            </span>
          </div>
        </div>

        {/* Right Last Executed Command Card */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-950 to-[#0F1424] border border-indigo-500/20 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                Último Comando Ejecutado
              </span>
              {state.lastExecutionTime && (
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {state.lastExecutionTime}
                </span>
              )}
            </div>

            {state.lastCommand ? (
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {state.lastCommand.title}
                  </span>
                  <span className="text-[9px] uppercase px-2 py-0.5 rounded font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-400/30">
                    {state.lastCommand.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{state.lastCommand.description}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-indigo-500/20">
                  Frase clave: <span className="text-cyan-300">"{state.lastCommand.phrase}"</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-xs text-slate-500">
                Ningún comando ejecutado todavía en esta sesión.
              </div>
            )}
          </div>

          {/* Quick Manual Speech Simulator input */}
          <form onSubmit={handleTestSubmit} className="flex gap-1.5 pt-2 border-t border-slate-800/80">
            <input
              id="voice-command-simulator-input"
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Simular comando (ej: Iniciar transmisión)..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
            />
            <button
              id="btn-voice-command-simulate"
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Simular</span>
            </button>
          </form>
        </div>
      </div>

      {/* Directory of Voice Commands with Quick-Test Chips */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Directorio de Comandos Disponibles
            </h3>
          </div>

          {/* Filter Categories */}
          <div className="flex items-center gap-1 flex-wrap">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 shadow-sm"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Command Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
          {filteredCommands.map((cmd) => {
            const isLast = state.lastCommand?.id === cmd.id;
            return (
              <div
                key={cmd.id}
                className={`bg-slate-950/70 border rounded-xl p-3 flex flex-col justify-between transition-all duration-200 ${
                  isLast
                    ? "border-emerald-500/50 bg-emerald-950/20 shadow-md shadow-emerald-500/10"
                    : "border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white truncate">{cmd.title}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono bg-slate-900 text-slate-400 border border-slate-800">
                      {cmd.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-300 font-mono font-semibold mb-1">
                    "{cmd.phrase}"
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                    {cmd.description}
                  </p>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-850 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500">
                    {cmd.aliases.length} variaciones
                  </span>
                  <button
                    id={`btn-test-cmd-${cmd.id}`}
                    onClick={() => executeCommandById(cmd.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 hover:border-cyan-500/40 hover:text-cyan-300 transition cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Probar Comando</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
