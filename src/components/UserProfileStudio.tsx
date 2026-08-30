import React, { useState, useMemo } from "react";
import { useAuth } from "../AuthContext";
import { BrainContext } from "../BrainContext";
import {
  UserProfile,
  UserRole,
  ThemeColorPreset,
  Avatar3DModel,
  AuraEffect,
  GeminiVoiceName,
  TtsExpressiveness,
  SceneName,
} from "../types";
import {
  User,
  Shield,
  Palette,
  Mic,
  Sparkles,
  Download,
  Upload,
  Copy,
  Trash2,
  CheckCircle,
  Plus,
  RotateCcw,
  Edit3,
  Sliders,
  Volume2,
  Tv,
  Coins,
  Award,
  Flame,
  Check,
  X,
  RefreshCw,
  Eye,
  Settings,
  Smile,
  Zap,
} from "lucide-react";

export function UserProfileStudio() {
  const {
    profiles,
    activeProfile,
    selectProfile,
    createProfile,
    updateProfile,
    duplicateProfile,
    deleteProfile,
    exportProfileJSON,
    importProfileJSON,
    resetProfileToDefaults,
  } = useAuth();

  const { speakText, updateTtsVoiceSettings, scenes } = React.useContext(BrainContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState("");
  const [isImportModal, setIsImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copySuccessNotice, setCopySuccessNotice] = useState<string | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState<{
    name: string;
    handle: string;
    email: string;
    role: UserRole;
    avatarUrl: string;
    tier: "Free" | "Pro Streamer" | "Enterprise AI" | "Quantum Elite";
    bio: string;
    badge: string;
    cyberCoins: number;
    level: number;
    avatarModel: Avatar3DModel;
    avatarHue: number;
    glowIntensity: number;
    auraEffect: AuraEffect;
    theme: ThemeColorPreset;
    geminiVoice: GeminiVoiceName;
    voicePitch: number;
    voiceSpeed: number;
    expressiveness: TtsExpressiveness;
    voicePresetGreeting: string;
    responseStyle: "ENERGETIC" | "SARCASTIC" | "KAWAII" | "TECHNICAL" | "PHILOSOPHER";
    defaultScene: SceneName;
    soundEffectsEnabled: boolean;
    autoSaveMinutes: number;
  }>({
    name: "",
    handle: "",
    email: "",
    role: "creator",
    avatarUrl: "",
    tier: "Pro Streamer",
    bio: "",
    badge: "✨ Streamer",
    cyberCoins: 1000,
    level: 1,
    avatarModel: "hectron-miku",
    avatarHue: 180,
    glowIntensity: 1.5,
    auraEffect: "CYAN_NEON",
    theme: "cyber-dark",
    geminiVoice: "Kore",
    voicePitch: 1.05,
    voiceSpeed: 1.05,
    expressiveness: "cheerful",
    voicePresetGreeting: "¡Hola a todos en el stream!",
    responseStyle: "ENERGETIC",
    defaultScene: "DEFAULT",
    soundEffectsEnabled: true,
    autoSaveMinutes: 5,
  });

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bio.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "ALL" || p.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [profiles, searchQuery, roleFilter]);

  const openCreateModal = () => {
    setFormData({
      name: "Nuevo Streamer Virtual",
      handle: `@streamer_${Math.floor(Math.random() * 900 + 100)}`,
      email: "streamer@hectron.universe",
      role: "creator",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      tier: "Pro Streamer",
      bio: "Streamer personalizado de Hectron Universe con perfil y voz única.",
      badge: "✨ Streamer Pro",
      cyberCoins: 1200,
      level: 1,
      avatarModel: "hectron-miku",
      avatarHue: 180,
      glowIntensity: 1.5,
      auraEffect: "CYAN_NEON",
      theme: "cyber-dark",
      geminiVoice: "Kore",
      voicePitch: 1.05,
      voiceSpeed: 1.05,
      expressiveness: "cheerful",
      voicePresetGreeting: "¡Hola a toda la comunidad! Iniciando transmisión cuántica.",
      responseStyle: "ENERGETIC",
      defaultScene: "DEFAULT",
      soundEffectsEnabled: true,
      autoSaveMinutes: 5,
    });
    setIsCreatingModal(true);
  };

  const openEditModal = (profile: UserProfile) => {
    setEditingProfileId(profile.id);
    setFormData({
      name: profile.name,
      handle: profile.handle,
      email: profile.email,
      role: profile.role,
      avatarUrl: profile.avatarUrl,
      tier: profile.tier,
      bio: profile.bio,
      badge: profile.badge || "✨ Streamer",
      cyberCoins: profile.cyberCoins,
      level: profile.level,
      avatarModel: profile.customization.avatarModel,
      avatarHue: profile.customization.avatarHue,
      glowIntensity: profile.customization.glowIntensity,
      auraEffect: profile.customization.auraEffect,
      theme: profile.customization.theme,
      geminiVoice: profile.customization.geminiVoice,
      voicePitch: profile.customization.voicePitch,
      voiceSpeed: profile.customization.voiceSpeed,
      expressiveness: profile.customization.expressiveness,
      voicePresetGreeting: profile.customization.voicePresetGreeting,
      responseStyle: profile.customization.responseStyle,
      defaultScene: profile.customization.defaultScene,
      soundEffectsEnabled: profile.customization.soundEffectsEnabled,
      autoSaveMinutes: profile.customization.autoSaveMinutes,
    });
    setIsEditingModal(true);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const created = createProfile({
      name: formData.name,
      handle: formData.handle,
      email: formData.email,
      role: formData.role,
      avatarUrl: formData.avatarUrl,
      tier: formData.tier,
      bio: formData.bio,
      badge: formData.badge,
      cyberCoins: formData.cyberCoins,
      level: formData.level,
      customization: {
        avatarModel: formData.avatarModel,
        avatarHue: formData.avatarHue,
        glowIntensity: formData.glowIntensity,
        auraEffect: formData.auraEffect,
        theme: formData.theme,
        geminiVoice: formData.geminiVoice,
        voicePitch: formData.voicePitch,
        voiceSpeed: formData.voiceSpeed,
        expressiveness: formData.expressiveness,
        voicePresetGreeting: formData.voicePresetGreeting,
        responseStyle: formData.responseStyle,
        defaultScene: formData.defaultScene,
        soundEffectsEnabled: formData.soundEffectsEnabled,
        autoSaveMinutes: formData.autoSaveMinutes,
        streamTags: ["HectronLive", formData.role],
      },
    });

    // Update active TTS settings
    updateTtsVoiceSettings({
      voice: created.customization.geminiVoice,
      pitch: created.customization.voicePitch,
      speakingRate: created.customization.voiceSpeed,
      expressiveness: created.customization.expressiveness,
    });

    setIsCreatingModal(false);
    showNotice(`Perfil "${created.name}" creado y activado.`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfileId) return;

    updateProfile(editingProfileId, {
      name: formData.name,
      handle: formData.handle,
      email: formData.email,
      role: formData.role,
      avatarUrl: formData.avatarUrl,
      tier: formData.tier,
      bio: formData.bio,
      badge: formData.badge,
      cyberCoins: formData.cyberCoins,
      level: formData.level,
      customization: {
        avatarModel: formData.avatarModel,
        avatarHue: formData.avatarHue,
        glowIntensity: formData.glowIntensity,
        auraEffect: formData.auraEffect,
        theme: formData.theme,
        geminiVoice: formData.geminiVoice,
        voicePitch: formData.voicePitch,
        voiceSpeed: formData.voiceSpeed,
        expressiveness: formData.expressiveness,
        voicePresetGreeting: formData.voicePresetGreeting,
        responseStyle: formData.responseStyle,
        defaultScene: formData.defaultScene,
        soundEffectsEnabled: formData.soundEffectsEnabled,
        autoSaveMinutes: formData.autoSaveMinutes,
        streamTags: ["HectronLive", formData.role],
      },
    });

    if (activeProfile?.id === editingProfileId) {
      updateTtsVoiceSettings({
        voice: formData.geminiVoice,
        pitch: formData.voicePitch,
        speakingRate: formData.voiceSpeed,
        expressiveness: formData.expressiveness,
      });
    }

    setIsEditingModal(false);
    showNotice("Perfil actualizado con éxito.");
  };

  const testVoiceGreeting = async (voice: GeminiVoiceName, pitch: number, speed: number, text: string) => {
    await speakText(text || "Prueba de síntesis de voz del streamer.", "HAPPY", "happy", {
      voice,
      pitch,
      speakingRate: speed,
    });
  };

  const handleDownloadJSON = (profileId: string) => {
    const jsonStr = exportProfileJSON(profileId);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `perfil_hectron_${profileId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice("Archivo de perfil JSON descargado.");
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    const res = importProfileJSON(importJsonText);
    setImportStatus(res);
    if (res.success) {
      setTimeout(() => {
        setIsImportModal(false);
        setImportJsonText("");
        setImportStatus(null);
      }, 1500);
    }
  };

  const showNotice = (msg: string) => {
    setCopySuccessNotice(msg);
    setTimeout(() => setCopySuccessNotice(null), 3500);
  };

  const themeSwatches: Record<ThemeColorPreset, { label: string; bg: string; border: string; glow: string }> = {
    "cyber-dark": { label: "Cyber Dark Cian", bg: "bg-cyan-950", border: "border-cyan-500", glow: "shadow-cyan-500/30" },
    "matrix-green": { label: "Matrix Green", bg: "bg-emerald-950", border: "border-emerald-500", glow: "shadow-emerald-500/30" },
    "neon-violet": { label: "Neon Violeta", bg: "bg-purple-950", border: "border-purple-500", glow: "shadow-purple-500/30" },
    "solar-gold": { label: "Solar Gold", bg: "bg-amber-950", border: "border-amber-500", glow: "shadow-amber-500/30" },
    "midnight-void": { label: "Midnight Void", bg: "bg-slate-950", border: "border-indigo-500", glow: "shadow-indigo-500/30" },
    "sakura-cyber": { label: "Sakura Pink", bg: "bg-pink-950", border: "border-pink-500", glow: "shadow-pink-500/30" },
    "crimson-overclock": { label: "Crimson Red", bg: "bg-rose-950", border: "border-rose-500", glow: "shadow-rose-500/30" },
  };

  const auraLabels: Record<AuraEffect, string> = {
    CYAN_NEON: "⚡ Neón Cian",
    GOLDEN_GLOW: "✨ Resplandor Dorado",
    PRISMATIC_RAINBOW: "🌈 Halo Prismático",
    VOID_PULSE: "🔮 Pulso del Vacío",
    EMBER_FLAME: "🔥 Fuego Estelar",
    STARLIGHT_SPARKLES: "⭐ Destellos Cósmicos",
    NONE: "⚪ Sin Aura",
  };

  return (
    <div className="space-y-6">
      {/* Notice Notification */}
      {copySuccessNotice && (
        <div className="animate-fadeIn fixed bottom-6 right-6 z-50 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border border-cyan-400 text-cyan-200 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold">{copySuccessNotice}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/30 text-slate-950 font-black">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  CENTRO DE PERFILES & PERSONALIZACIÓN DE STREAMER
                </h1>
                <p className="text-xs text-cyan-300/80 font-mono">
                  Gestión Multi-Perfil, Avatares 3D, Voces Gemini TTS, Presets de Escenas y Temas
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Crea, personaliza, duplica y administra tus perfiles de streamer virtual con configuraciones dedicadas de
              apariencia 3D, síntesis de voz, rol de permisos, auras estelares y temas visuales persistentes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={openCreateModal}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Perfil</span>
            </button>

            <button
              onClick={() => setIsImportModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Importar JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Profile Highlight Card */}
      {activeProfile && (
        <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-lg shadow-cyan-500/30"
                />
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-950 shadow">
                  ACTIVO
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-black text-white">{activeProfile.name}</h2>
                  <span className="text-xs text-cyan-400 font-mono font-bold">{activeProfile.handle}</span>
                  <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold rounded-full border border-cyan-500/40">
                    {activeProfile.badge || activeProfile.role}
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold rounded-full border border-amber-500/40">
                    {activeProfile.tier}
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl">{activeProfile.bio}</p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap font-mono">
                  <span className="flex items-center gap-1 text-amber-300 font-bold">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    {activeProfile.cyberCoins} CyberCoins
                  </span>
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Nivel {activeProfile.level}
                  </span>
                  <span className="flex items-center gap-1 text-purple-300">
                    <Mic className="w-3.5 h-3.5 text-purple-400" />
                    Voz: {activeProfile.customization.geminiVoice}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Tv className="w-3.5 h-3.5 text-emerald-400" />
                    Tema: {activeProfile.customization.theme}
                  </span>
                  <span className="flex items-center gap-1 text-pink-300">
                    <Flame className="w-3.5 h-3.5 text-pink-400" />
                    Aura: {auraLabels[activeProfile.customization.auraEffect] || activeProfile.customization.auraEffect}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 flex-wrap">
              <button
                onClick={() =>
                  testVoiceGreeting(
                    activeProfile.customization.geminiVoice,
                    activeProfile.customization.voicePitch,
                    activeProfile.customization.voiceSpeed,
                    activeProfile.customization.voicePresetGreeting
                  )
                }
                className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                title="Escuchar saludo de voz con Gemini TTS"
              >
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Probar Voz</span>
              </button>

              <button
                onClick={() => openEditModal(activeProfile)}
                className="px-3.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Editar Perfil</span>
              </button>

              <button
                onClick={() => handleDownloadJSON(activeProfile.id)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
                title="Exportar como JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "creator", "lead_dev", "vip_moderator", "director", "guest"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                roleFilter === role
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {role === "ALL" ? "Todos los Roles" : role}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProfiles.map((p) => {
          const isActive = p.id === activeProfile?.id;
          return (
            <div
              key={p.id}
              className={`bg-slate-900/80 rounded-2xl p-5 border transition duration-200 flex flex-col justify-between gap-4 relative overflow-hidden ${
                isActive
                  ? "border-cyan-500 shadow-xl shadow-cyan-500/10 bg-gradient-to-b from-slate-900 to-cyan-950/20"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-13 h-13 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                        {p.name}
                        {isActive && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 inline" />}
                      </h3>
                      <p className="text-xs text-cyan-400 font-mono">{p.handle}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {p.role}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-950/50 px-2 py-1 rounded border border-amber-500/30">
                    {p.tier}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{p.bio}</p>

                <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] font-mono">
                  <div className="text-slate-400">
                    Voz: <strong className="text-purple-300">{p.customization.geminiVoice}</strong>
                  </div>
                  <div className="text-slate-400">
                    Tema: <strong className="text-cyan-300">{p.customization.theme}</strong>
                  </div>
                  <div className="text-slate-400">
                    Modelo: <strong className="text-emerald-300">{p.customization.avatarModel}</strong>
                  </div>
                  <div className="text-slate-400">
                    Coins: <strong className="text-amber-300">{p.cyberCoins}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                {isActive ? (
                  <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Seleccionado</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      selectProfile(p.id);
                      showNotice(`Perfil cambiado a "${p.name}".`);
                    }}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    Activar
                  </button>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const cloned = duplicateProfile(p.id);
                      showNotice(`Perfil duplicado como "${cloned.name}".`);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                    title="Duplicar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownloadJSON(p.id)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                    title="Exportar JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {profiles.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de eliminar el perfil "${p.name}"?`)) {
                          deleteProfile(p.id);
                          showNotice("Perfil eliminado.");
                        }
                      }}
                      className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800/40 transition cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Create/Edit Profile */}
      {(isCreatingModal || isEditingModal) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
                  {isCreatingModal ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {isCreatingModal ? "Crear Nuevo Perfil de Streamer" : "Editar Perfil de Streamer"}
                  </h3>
                  <p className="text-xs text-slate-400">Configuración personalizada de identidad, voz y gráficos 3D</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreatingModal(false);
                  setIsEditingModal(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isCreatingModal ? handleSaveCreate : handleSaveEdit} className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Identidad & Rol
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo / Alias</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Usuario / Handle (@)</label>
                    <input
                      type="text"
                      required
                      value={formData.handle}
                      onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Rol de Permisos</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="creator">Creador Principal</option>
                      <option value="lead_dev">Lead Developer (Arch)</option>
                      <option value="vip_moderator">VIP Moderator</option>
                      <option value="director">Director Ejecutivo</option>
                      <option value="guest">Invitado</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nivel Tier</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="Free">Free</option>
                      <option value="Pro Streamer">Pro Streamer</option>
                      <option value="Enterprise AI">Enterprise AI</option>
                      <option value="Quantum Elite">Quantum Elite</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">URL Avatar / Imagen</label>
                  <input
                    type="url"
                    required
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Biografía / Descripción</label>
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* 3D Model & Visual Effects */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Modelo 3D, Efecto Visual & Aura
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo de Avatar 3D</label>
                    <select
                      value={formData.avatarModel}
                      onChange={(e) => setFormData({ ...formData, avatarModel: e.target.value as Avatar3DModel })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="hectron-miku">Hectron Cloud Miku</option>
                      <option value="cyber-holo">Cyber Holo Prime</option>
                      <option value="mech-prime">Mech Vanguard</option>
                      <option value="chibi-core">Chibi Quantum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Aura de Energía Estelar</label>
                    <select
                      value={formData.auraEffect}
                      onChange={(e) => setFormData({ ...formData, auraEffect: e.target.value as AuraEffect })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="CYAN_NEON">⚡ Neón Cian</option>
                      <option value="GOLDEN_GLOW">✨ Resplandor Dorado</option>
                      <option value="PRISMATIC_RAINBOW">🌈 Halo Prismático</option>
                      <option value="VOID_PULSE">🔮 Pulso del Vacío</option>
                      <option value="EMBER_FLAME">🔥 Fuego Estelar</option>
                      <option value="STARLIGHT_SPARKLES">⭐ Destellos Cósmicos</option>
                      <option value="NONE">⚪ Sin Aura</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Intensidad Glow ({formData.glowIntensity}x)
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={formData.glowIntensity}
                      onChange={(e) => setFormData({ ...formData, glowIntensity: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Voice & Gemini TTS Settings */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voz & Síntesis Gemini TTS
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      testVoiceGreeting(
                        formData.geminiVoice,
                        formData.voicePitch,
                        formData.voiceSpeed,
                        formData.voicePresetGreeting
                      )
                    }
                    className="px-3 py-1 bg-purple-950 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-purple-900 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Probar Audio</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Voz Gemini</label>
                    <select
                      value={formData.geminiVoice}
                      onChange={(e) => setFormData({ ...formData, geminiVoice: e.target.value as GeminiVoiceName })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="Kore">Kore (Cálida y Femenina)</option>
                      <option value="Puck">Puck (Juvenil y Enérgico)</option>
                      <option value="Charon">Charon (Profunda y Solemne)</option>
                      <option value="Fenrir">Fenrir (Potente y Técnica)</option>
                      <option value="Aoede">Aoede (Melódica y Dulce)</option>
                      <option value="Zephyr">Zephyr (Serena y Fluida)</option>
                      <option value="Leda">Leda (Elegante y Ejecutiva)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tono / Pitch ({formData.voicePitch})
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={formData.voicePitch}
                      onChange={(e) => setFormData({ ...formData, voicePitch: parseFloat(e.target.value) })}
                      className="w-full accent-purple-400 mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Velocidad ({formData.voiceSpeed}x)
                    </label>
                    <input
                      type="range"
                      min="0.75"
                      max="1.5"
                      step="0.05"
                      value={formData.voiceSpeed}
                      onChange={(e) => setFormData({ ...formData, voiceSpeed: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Estilo de Respuesta</label>
                    <select
                      value={formData.responseStyle}
                      onChange={(e) => setFormData({ ...formData, responseStyle: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="ENERGETIC">⚡ Enérgico</option>
                      <option value="KAWAII">💖 Kawaii / Dulce</option>
                      <option value="SARCASTIC">😏 Sarcástico / Troll</option>
                      <option value="TECHNICAL">🛠️ Técnico / Preciso</option>
                      <option value="PHILOSOPHER">🌌 Filosófico</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Frase de Saludo Preestablecida</label>
                  <input
                    type="text"
                    value={formData.voicePresetGreeting}
                    onChange={(e) => setFormData({ ...formData, voicePresetGreeting: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Theme & Atmosphere */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Tema & Atmósfera Visual
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.keys(themeSwatches) as ThemeColorPreset[]).map((themeKey) => {
                    const swatch = themeSwatches[themeKey];
                    const isSelected = formData.theme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setFormData({ ...formData, theme: themeKey })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${swatch.bg} ${
                          isSelected ? `${swatch.border} ring-2 ring-cyan-400 ${swatch.glow}` : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{swatch.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{themeKey}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingModal(false);
                    setIsEditingModal(false);
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  {isCreatingModal ? "Crear y Guardar Perfil" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Import JSON */}
      {isImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                Importar Perfil desde Archivo JSON
              </h3>
              <button
                onClick={() => {
                  setIsImportModal(false);
                  setImportJsonText("");
                  setImportStatus(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Pega la estructura JSON exportada de un perfil de streamer para restaurar todas sus preferencias y configuraciones.
            </p>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Pega el contenido JSON aquí..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-cyan-300 font-mono placeholder-slate-600 outline-none"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  importStatus.success ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" : "bg-rose-950/80 text-rose-300 border border-rose-800"
                }`}
              >
                {importStatus.success ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>{importStatus.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsImportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importJsonText.trim()}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black shadow-lg transition cursor-pointer"
              >
                Procesar e Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
