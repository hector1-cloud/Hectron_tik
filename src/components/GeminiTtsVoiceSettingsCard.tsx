import React, { useState, useContext } from "react";
import { BrainContext } from "../BrainContext";
import { GeminiVoiceName, TtsExpressiveness } from "../types";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  Check,
  Radio,
  Zap,
  Music,
  Smile,
  Flame,
  Moon,
  Heart,
  Bot,
  RefreshCw,
} from "lucide-react";

interface VoiceProfile {
  name: GeminiVoiceName;
  label: string;
  tag: string;
  gender: "Femenina" | "Masculina" | "Neutra";
  description: string;
  recommendedRole: string;
  avatarColor: string;
  defaultPitch: number;
  defaultSpeed: number;
}

const VOICE_PROFILES: VoiceProfile[] = [
  {
    name: "Kore",
    label: "Kore (Miku Idol)",
    tag: "Alegre & Juvenil",
    gender: "Femenina",
    description: "Voz femenina clara, juvenil y llena de vitalidad. Ideal para streams de videojuegos y animación VTuber.",
    recommendedRole: "Voz Principal Oficial de Miku",
    avatarColor: "from-pink-500 to-cyan-400",
    defaultPitch: 1.15,
    defaultSpeed: 1.05,
  },
  {
    name: "Aoede",
    label: "Aoede (Melódica)",
    tag: "Dulce & Emotiva",
    gender: "Femenina",
    description: "Tono cálido, musical y expresivo. Excelente para momentos de agradecimiento a suscriptores y charla relajada.",
    recommendedRole: "Just Chatting & Música",
    avatarColor: "from-purple-500 to-pink-500",
    defaultPitch: 1.2,
    defaultSpeed: 1.0,
  },
  {
    name: "Leda",
    label: "Leda (Serena)",
    tag: "Suave & Elegante",
    gender: "Femenina",
    description: "Voz tierna, tranquila y delicada con entonación pausada y relajante.",
    recommendedRole: "Streams Nocturnos & ASMR",
    avatarColor: "from-amber-400 to-rose-400",
    defaultPitch: 1.05,
    defaultSpeed: 0.95,
  },
  {
    name: "Puck",
    label: "Puck (Gamer)",
    tag: "Pícaro & Rápido",
    gender: "Masculina",
    description: "Tono jovial, dinámico y competitivo con rápida velocidad de respuesta para acción continua.",
    recommendedRole: "Speedruns & Torneos Esports",
    avatarColor: "from-emerald-400 to-cyan-500",
    defaultPitch: 1.0,
    defaultSpeed: 1.15,
  },
  {
    name: "Zephyr",
    label: "Zephyr (Neutra)",
    tag: "Equilibrada & Clara",
    gender: "Neutra",
    description: "Voz neutra, fluida y con articulación perfecta. Óptima para resúmenes y anuncios de sistema.",
    recommendedRole: "Narrador de Sistema & Tutoriales",
    avatarColor: "from-cyan-400 to-blue-500",
    defaultPitch: 1.0,
    defaultSpeed: 1.0,
  },
  {
    name: "Charon",
    label: "Charon (Épica)",
    tag: "Profunda & Resonante",
    gender: "Masculina",
    description: "Timbre grave, sabio y cinematográfico con gran presencia sonora.",
    recommendedRole: "Historias RPG & Lore",
    avatarColor: "from-indigo-600 to-purple-800",
    defaultPitch: 0.85,
    defaultSpeed: 0.95,
  },
  {
    name: "Fenrir",
    label: "Fenrir (Audaz)",
    tag: "Potente & Imponente",
    gender: "Masculina",
    description: "Voz robusta y decidida, con entonación segura y firme.",
    recommendedRole: "Batallas PvP & Jefes de Juego",
    avatarColor: "from-red-500 to-amber-600",
    defaultPitch: 0.9,
    defaultSpeed: 1.05,
  },
  {
    name: "Orus",
    label: "Orus (Carismático)",
    tag: "Firme & Seguro",
    gender: "Masculina",
    description: "Locutor carismático y seguro, excelente para presentar eventos y dinámicas con la comunidad.",
    recommendedRole: "Presentador de Eventos",
    avatarColor: "from-blue-600 to-teal-400",
    defaultPitch: 0.95,
    defaultSpeed: 1.05,
  },
];

const SAMPLE_PHRASES = [
  "¡Hola a todos en el chat de TikTok! Bienvenidos al stream de Hectron Universe con Gemini AI.",
  "¡Muchísimas gracias por ese regalo genial! ¡Vamos con todo el ánimo a ganar esta partida!",
  "¡Guao, nivel subido con éxito! Nuestro avatar autónomo está listo para el siguiente reto.",
  "¡Atención chat, prepárense para la misión en vivo! ¿Qué decisión quieren que tome ahora?",
  "¡Qué energía tan increíble hoy! Me alegra muchísimo tenerlos aquí a todos compartiendo.",
];

export const GeminiTtsVoiceSettingsCard: React.FC = () => {
  const {
    ttsVoiceSettings,
    updateTtsVoiceSettings,
    resetTtsVoiceSettings,
    speakText,
    isSpeaking,
    latestSpeechText,
  } = useContext(BrainContext);

  const [testText, setTestText] = useState<string>(
    "¡Hola a todos! Soy Miku y esta es mi voz configurada con Gemini 3.1 TTS."
  );
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  const handleTestVoice = async () => {
    if (!testText.trim() || isPlayingPreview) return;
    setIsPlayingPreview(true);
    try {
      await speakText(testText.trim(), "HAPPY", "happy", {
        voice: ttsVoiceSettings.voice,
        speakingRate: ttsVoiceSettings.speakingRate,
        pitch: ttsVoiceSettings.pitch,
        expressiveness: ttsVoiceSettings.expressiveness,
        autoSpeechEnabled: true,
      });
    } finally {
      setIsPlayingPreview(false);
    }
  };

  const handleRandomizePhrase = () => {
    const random = SAMPLE_PHRASES[Math.floor(Math.random() * SAMPLE_PHRASES.length)];
    setTestText(random);
  };

  const applyPersonalityKit = (kit: {
    voice: GeminiVoiceName;
    speakingRate: number;
    pitch: number;
    expressiveness: TtsExpressiveness;
  }) => {
    updateTtsVoiceSettings(kit);
  };

  return (
    <div
      id="gemini-tts-settings-card"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6 relative overflow-hidden"
    >
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-pink-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-pink-500/20">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Ajustes de Voz Gemini TTS
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold">
                Gemini 3.1 Audio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personaliza el perfil de voz neuronal del avatar, velocidad de locución y modulación de tono.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto Speech Toggle */}
          <button
            id="tts-toggle-auto-speech"
            onClick={() =>
              updateTtsVoiceSettings({ autoSpeechEnabled: !ttsVoiceSettings.autoSpeechEnabled })
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
              ttsVoiceSettings.autoSpeechEnabled
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
            }`}
            title="Activa o desactiva la lectura por voz automática de eventos del stream"
          >
            {ttsVoiceSettings.autoSpeechEnabled ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Voz Automática: Activa</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Voz Automática: Silenciada</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            id="tts-reset-settings-btn"
            onClick={resetTtsVoiceSettings}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer transition"
            title="Restablecer valores por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Quick Personality Kits */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Kits de Personalidad Rápida:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            onClick={() =>
              applyPersonalityKit({
                voice: "Kore",
                speakingRate: 1.05,
                pitch: 1.15,
                expressiveness: "anime",
              })
            }
            className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-pink-500/50 hover:bg-pink-950/20 text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-300 group-hover:text-pink-200 flex items-center gap-1">
                🌸 Miku Idol
              </span>
              <span className="text-[9px] text-slate-500">Kore</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Agudo, alegre y dulce</p>
          </button>

          <button
            onClick={() =>
              applyPersonalityKit({
                voice: "Puck",
                speakingRate: 1.2,
                pitch: 1.0,
                expressiveness: "energetic",
              })
            }
            className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200 flex items-center gap-1">
                ⚡ Gamer Hype
              </span>
              <span className="text-[9px] text-slate-500">Puck</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Rápido, enérgico y cómico</p>
          </button>

          <button
            onClick={() =>
              applyPersonalityKit({
                voice: "Aoede",
                speakingRate: 1.0,
                pitch: 1.2,
                expressiveness: "cheerful",
              })
            }
            className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/20 text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 group-hover:text-purple-200 flex items-center gap-1">
                🎵 Melódica
              </span>
              <span className="text-[9px] text-slate-500">Aoede</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Expresivo y musical</p>
          </button>

          <button
            onClick={() =>
              applyPersonalityKit({
                voice: "Leda",
                speakingRate: 0.9,
                pitch: 0.95,
                expressiveness: "calm",
              })
            }
            className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200 flex items-center gap-1">
                🌙 Chill & ASMR
              </span>
              <span className="text-[9px] text-slate-500">Leda</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Pausado y relajante</p>
          </button>

          <button
            onClick={() =>
              applyPersonalityKit({
                voice: "Charon",
                speakingRate: 0.95,
                pitch: 0.85,
                expressiveness: "natural",
              })
            }
            className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-left transition cursor-pointer group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200 flex items-center gap-1">
                🌌 Narrador Épico
              </span>
              <span className="text-[9px] text-slate-500">Charon</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Grave y resonante</p>
          </button>
        </div>
      </div>

      {/* Voice Profiles Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            Perfil de Voz Gemini ({VOICE_PROFILES.length} Modelos Disponibles):
          </label>
          <span className="text-[11px] text-slate-400">
            Seleccionada: <strong className="text-cyan-300">{ttsVoiceSettings.voice}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {VOICE_PROFILES.map((prof) => {
            const isSelected = ttsVoiceSettings.voice === prof.name;
            return (
              <div
                key={prof.name}
                id={`tts-voice-profile-${prof.name.toLowerCase()}`}
                onClick={() => updateTtsVoiceSettings({ voice: prof.name })}
                className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 select-none ${
                  isSelected
                    ? "bg-slate-850/90 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${prof.avatarColor} flex items-center justify-center text-slate-950 font-black text-xs shadow`}
                    >
                      {prof.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1">
                        {prof.name}
                        {prof.name === "Kore" && (
                          <span className="text-[9px] text-pink-400">★</span>
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-400">{prof.gender}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-tight">
                  {prof.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className="text-cyan-300 font-medium bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
                    {prof.tag}
                  </span>
                  <span className="text-slate-400 truncate max-w-[100px]" title={prof.recommendedRole}>
                    {prof.recommendedRole}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sliders Grid: Speaking Rate & Pitch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
        {/* Speaking Rate Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Velocidad de Habla (Rate):
            </label>
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <span className="text-xs font-mono font-bold text-amber-300">
                {ttsVoiceSettings.speakingRate.toFixed(2)}x
              </span>
            </div>
          </div>

          <input
            id="tts-slider-speaking-rate"
            type="range"
            min="0.6"
            max="1.8"
            step="0.05"
            value={ttsVoiceSettings.speakingRate}
            onChange={(e) =>
              updateTtsVoiceSettings({ speakingRate: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>0.6x (Pausado)</span>
            <span>1.0x (Normal)</span>
            <span>1.4x (Rápido)</span>
            <span>1.8x (Turbo)</span>
          </div>

          {/* Quick Rate Presets */}
          <div className="flex gap-1.5 flex-wrap pt-1">
            {[0.8, 1.0, 1.15, 1.35].map((rate) => (
              <button
                key={rate}
                onClick={() => updateTtsVoiceSettings({ speakingRate: rate })}
                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                  Math.abs(ttsVoiceSettings.speakingRate - rate) < 0.03
                    ? "bg-amber-400 text-slate-950 shadow"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {rate.toFixed(2)}x
              </button>
            ))}
          </div>
        </div>

        {/* Pitch Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Tono de Voz & Modulación (Pitch):
            </label>
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <span className="text-xs font-mono font-bold text-cyan-300">
                {ttsVoiceSettings.pitch.toFixed(2)}x
              </span>
            </div>
          </div>

          <input
            id="tts-slider-pitch"
            type="range"
            min="0.6"
            max="1.6"
            step="0.05"
            value={ttsVoiceSettings.pitch}
            onChange={(e) =>
              updateTtsVoiceSettings({ pitch: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>0.6x (Grave)</span>
            <span>1.0x (Estándar)</span>
            <span>1.3x (Idol/Agudo)</span>
            <span>1.6x (Chibi)</span>
          </div>

          {/* Quick Pitch Presets */}
          <div className="flex gap-1.5 flex-wrap pt-1">
            {[0.85, 1.0, 1.15, 1.35].map((pitch) => (
              <button
                key={pitch}
                onClick={() => updateTtsVoiceSettings({ pitch: pitch })}
                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                  Math.abs(ttsVoiceSettings.pitch - pitch) < 0.03
                    ? "bg-cyan-400 text-slate-950 shadow"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {pitch.toFixed(2)}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expressiveness Styles */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-pink-400" />
          Estilo de Expresión & Actitud del Streamer:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: "cheerful", label: "Alegre (Cheerful)", icon: Smile, color: "text-amber-300" },
            { id: "energetic", label: "Enérgica (Hype)", icon: Flame, color: "text-red-400" },
            { id: "anime", label: "Anime Idol (Cute)", icon: Heart, color: "text-pink-400" },
            { id: "calm", label: "Serena (Calm)", icon: Moon, color: "text-blue-300" },
            { id: "natural", label: "Natural (Warm)", icon: Sparkles, color: "text-emerald-300" },
          ].map((style) => {
            const isSelected = ttsVoiceSettings.expressiveness === style.id;
            const Icon = style.icon;
            return (
              <button
                key={style.id}
                onClick={() =>
                  updateTtsVoiceSettings({ expressiveness: style.id as TtsExpressiveness })
                }
                className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? "bg-slate-800 text-white border-cyan-400 shadow"
                    : "bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${style.color}`} />
                <span className="truncate">{style.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Audio Test Bench */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${isSpeaking ? "text-pink-400 animate-ping" : "text-slate-500"}`} />
            Banco de Prueba de Voz en Tiempo Real:
          </span>
          <button
            onClick={handleRandomizePhrase}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Frase Aleatoria
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="tts-test-phrase-input"
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Escribe un mensaje para que el avatar lo reproduzca..."
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg px-3.5 py-2.5 text-xs text-white outline-none"
          />

          <button
            id="tts-trigger-test-btn"
            onClick={handleTestVoice}
            disabled={isPlayingPreview || isSpeaking}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              isPlayingPreview || isSpeaking
                ? "bg-pink-500 text-white animate-pulse"
                : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
            }`}
          >
            {isPlayingPreview || isSpeaking ? (
              <>
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>Hablando ({ttsVoiceSettings.voice})...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Probar Voz Gemini</span>
              </>
            )}
          </button>
        </div>

        {/* Current Active Playback Stats */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
          <div className="flex items-center gap-3">
            <span>
              Modelo: <strong className="text-slate-200">gemini-3.1-flash-tts-preview</strong>
            </span>
            <span>
              Voz: <strong className="text-cyan-300">{ttsVoiceSettings.voice}</strong>
            </span>
            <span>
              Velocidad: <strong className="text-amber-300">{ttsVoiceSettings.speakingRate}x</strong>
            </span>
            <span>
              Tono: <strong className="text-pink-300">{ttsVoiceSettings.pitch}x</strong>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PCM 24kHz Direct Stream</span>
          </div>
        </div>
      </div>
    </div>
  );
};
