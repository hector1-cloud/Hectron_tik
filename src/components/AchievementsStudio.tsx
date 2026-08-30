import { useState, useContext, useMemo } from "react";
import { BrainContext } from "../BrainContext";
import {
  Achievement,
  AchievementCategory,
  AchievementRarity,
  AvatarAnimationClass,
  AuraEffect,
} from "../types";
import {
  Trophy,
  Award,
  Sparkles,
  MessageSquare,
  Gift,
  Clock,
  Compass,
  Bot,
  Zap,
  CheckCircle2,
  Lock,
  Gift as GiftIcon,
  Flame,
  Volume2,
  Eye,
  Save,
  RotateCcw,
  Download,
  Upload,
  RefreshCw,
  Star,
  Check,
  Shield,
  Layers,
} from "lucide-react";

export function AchievementsStudio() {
  const {
    achievements,
    claimAchievementReward,
    equipRewardAnimation,
    equipRewardVisualEffect,
    equipRewardSpecialPhrase,
    equipRewardTitle,
    equippedRewards,
    speakText,
    setEmotion,
    setAnimationClass,
    saveStreamerFullState,
    loadStreamerFullState,
    resetStreamerFullState,
    exportStreamerStateJSON,
    importStreamerStateJSON,
    emotion,
    obsStatus,
    messages,
    gameState,
  } = useContext(BrainContext);

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "ALL">("ALL");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.unlocked).length;
    const claimed = achievements.filter((a) => a.claimed).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    const totalXpEarned = achievements
      .filter((a) => a.claimed)
      .reduce((sum, a) => sum + (a.xpReward || 0), 0);
    const totalCoinsEarned = achievements
      .filter((a) => a.claimed)
      .reduce((sum, a) => sum + (a.coinsReward || 0), 0);

    return { total, unlocked, claimed, percentage, totalXpEarned, totalCoinsEarned };
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === "ALL") return achievements;
    return achievements.filter((a) => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const handleClaim = (ach: Achievement) => {
    const res = claimAchievementReward(ach.id);
    setActionFeedback(res.message);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handlePreviewPhrase = async (phrase: string) => {
    setActionFeedback(`Reproduciendo frase: "${phrase}"`);
    await speakText(phrase, "HAPPY");
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handlePreviewAnimation = (anim: AvatarAnimationClass) => {
    setAnimationClass(anim);
    setActionFeedback(`Animación activada: ${anim}`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleSaveState = async () => {
    setActionFeedback("Guardando estado en archivo local y base de datos...");
    const res = await saveStreamerFullState();
    setActionFeedback(res.message);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleLoadState = async () => {
    setActionFeedback("Restaurando estado del streamer...");
    const res = await loadStreamerFullState();
    setActionFeedback(res.message);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleResetState = async () => {
    if (window.confirm("¿Seguro que deseas restablecer el estado del streamer a los valores iniciales?")) {
      const res = await resetStreamerFullState();
      setActionFeedback(res.message);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportStreamerStateJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streamer_state_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActionFeedback("Archivo de estado descargado correctamente.");
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleImportJson = async () => {
    if (!importJsonText.trim()) return;
    const res = await importStreamerStateJSON(importJsonText.trim());
    setActionFeedback(res.message);
    setShowImportModal(false);
    setImportJsonText("");
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const getRarityBadge = (rarity: AchievementRarity) => {
    switch (rarity) {
      case "BRONZE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/40 text-amber-300 border border-amber-600/30">Bronce</span>;
      case "SILVER":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-400/20 text-slate-200 border border-slate-400/40">Plata</span>;
      case "GOLD":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">Oro</span>;
      case "DIAMOND":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]">Diamante</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-tr from-amber-500 to-cyan-500 rounded-xl text-slate-950 shadow-lg">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  🏆 Sistema de Logros & Recompensas
                </h1>
                <p className="text-sm text-slate-400">
                  Desbloquea nuevas animaciones 3D, frases de voz especiales, auras cósmicas y guarda el estado del streamer.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Persistence Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveState}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Estado</span>
            </button>

            <button
              onClick={handleLoadState}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Restaurar</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              title="Descargar JSON de respaldo"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              title="Importar JSON"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Importar</span>
            </button>

            <button
              onClick={handleResetState}
              className="flex items-center gap-1 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs rounded-xl border border-rose-500/30 transition cursor-pointer"
              title="Restablecer valores iniciales"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Progreso de Logros</span>
            <div className="flex items-center justify-between mt-1 mb-1.5">
              <span className="text-lg font-bold text-cyan-400">
                {stats.unlocked} / {stats.total}
              </span>
              <span className="text-xs font-bold text-slate-400">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Recompensas Reclamadas</span>
              <p className="text-lg font-bold text-amber-400 mt-1">
                {stats.claimed} <span className="text-xs text-slate-500 font-normal">reclamadas</span>
              </p>
            </div>
            <GiftIcon className="w-8 h-8 text-amber-400/50" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">XP Total por Logros</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">+{stats.totalXpEarned} XP</p>
            </div>
            <Zap className="w-8 h-8 text-emerald-400/50" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Estado del Streamer</span>
              <p className="text-xs font-bold text-cyan-300 mt-1 truncate">
                Emoción: {emotion} | Escena: {obsStatus.scene}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{messages.length} mensajes en historial</p>
            </div>
            <Shield className="w-8 h-8 text-cyan-400/50" />
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="mt-4 p-3 bg-cyan-950/90 border border-cyan-500/50 rounded-xl text-cyan-200 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-lg">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {actionFeedback}
            </span>
          </div>
        )}
      </div>

      {/* Equipped Rewards Active Loadout */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Equipamiento Activo de Recompensas</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Active Title */}
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Título de Streamer</span>
            <div className="text-xs font-bold text-amber-300 mt-1 truncate flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{equippedRewards?.activeTitle || "🌟 Streamer Holográfica Prime"}</span>
            </div>
          </div>

          {/* Active Aura / Visual Effect */}
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Efecto Visual / Aura</span>
            <div className="text-xs font-bold text-cyan-300 mt-1 truncate flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{equippedRewards?.activeVisualEffect || "CYAN_NEON"}</span>
            </div>
          </div>

          {/* Active Animation */}
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Animación 3D Activa</span>
            <div className="text-xs font-bold text-purple-300 mt-1 truncate flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">{equippedRewards?.activeAnimation || "happy"}</span>
            </div>
          </div>

          {/* Active Special Phrase */}
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Frase Especial TTS</span>
            <button
              onClick={() => handlePreviewPhrase(equippedRewards?.activeSpecialPhrase || "¡Saludos a todos!")}
              className="text-[11px] font-bold text-emerald-300 mt-1 truncate flex items-center gap-1 text-left hover:text-emerald-200 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">"{equippedRewards?.activeSpecialPhrase || "¡Saludos!"}"</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "ALL", label: "Todos los Logros", icon: Trophy },
          { id: "CHAT", label: "Chat & Interacción", icon: MessageSquare },
          { id: "GIFTS", label: "Regalos TikTok LIVE", icon: Gift },
          { id: "STREAM_TIME", label: "Tiempo en Vivo", icon: Clock },
          { id: "EXPLORATION", label: "Exploración & Reliquias", icon: Compass },
          { id: "AI_AUTONOMY", label: "Inteligencia & Voz", icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((ach) => {
          const progressPercent = Math.min(100, Math.round((ach.currentCount / ach.targetCount) * 100));
          const r = ach.reward;

          return (
            <div
              key={ach.id}
              className={`rounded-2xl border p-5 transition flex flex-col justify-between relative overflow-hidden ${
                ach.unlocked
                  ? ach.claimed
                    ? "bg-slate-900/90 border-cyan-500/40 shadow-lg"
                    : "bg-gradient-to-b from-slate-900 to-amber-950/20 border-amber-500/50 shadow-amber-500/10 shadow-xl"
                  : "bg-slate-900/50 border-slate-800/80 opacity-80"
              }`}
            >
              <div>
                {/* Card Top: Icon & Rarity */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      ach.unlocked
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    {ach.unlocked ? <Trophy className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>

                  <div className="flex items-center gap-2">
                    {getRarityBadge(ach.rarity)}
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-semibold">
                      +{ach.xpReward} XP
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h4 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                  {ach.title}
                  {ach.unlocked && <CheckCircle2 className="w-4 h-4 text-cyan-400 inline" />}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{ach.description}</p>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Progreso</span>
                    <span className="font-bold text-white">
                      {ach.currentCount} / {ach.targetCount}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        ach.unlocked ? "bg-cyan-400" : "bg-cyan-600/70"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Reward Card Box */}
                <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-xl mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <GiftIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                      Recompensa: {r.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{r.description}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                {!ach.unlocked ? (
                  <div className="w-full py-2 bg-slate-800/50 text-slate-500 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Bloqueado</span>
                  </div>
                ) : !ach.claimed ? (
                  <button
                    onClick={() => handleClaim(ach)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <GiftIcon className="w-4 h-4" />
                    <span>Reclamar Recompensa</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    {r.type === "ANIMATION" && r.animationClass && (
                      <button
                        onClick={() => {
                          equipRewardAnimation(r.animationClass!);
                          handlePreviewAnimation(r.animationClass!);
                        }}
                        className="flex-1 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        {equippedRewards?.activeAnimation === r.animationClass ? "✓ Animación Activa" : "Equipar Animación"}
                      </button>
                    )}

                    {r.type === "VISUAL_EFFECT" && r.auraEffect && (
                      <button
                        onClick={() => {
                          equipRewardVisualEffect(r.auraEffect!);
                          setActionFeedback(`Efecto Visual "${r.auraEffect}" equipado.`);
                        }}
                        className="flex-1 py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        {equippedRewards?.activeVisualEffect === r.auraEffect ? "✓ Aura Activa" : "Equipar Aura"}
                      </button>
                    )}

                    {r.type === "SPECIAL_PHRASE" && r.speechText && (
                      <button
                        onClick={() => {
                          equipRewardSpecialPhrase(r.speechText!);
                          handlePreviewPhrase(r.speechText!);
                        }}
                        className="flex-1 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        Decir Frase 🎤
                      </button>
                    )}

                    {r.type === "STREAMER_TITLE" && (
                      <button
                        onClick={() => {
                          equipRewardTitle(r.value);
                          setActionFeedback(`Título "${r.value}" equipado.`);
                        }}
                        className="flex-1 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        {equippedRewards?.activeTitle === r.value ? "✓ Título Activo" : "Equipar Título"}
                      </button>
                    )}

                    <span className="text-[11px] text-slate-500 font-semibold px-2 py-1 bg-slate-800 rounded">
                      Reclamado
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              <span>Importar Estado del Streamer (.json)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Pega aquí el contenido JSON exportado previamente para restaurar instantáneamente la emoción, escena, historial de chat y recompensas del streamer.
            </p>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{"version": 1, "emotion": "HAPPY", "activeScene": "DEFAULT", ...}'
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono outline-none focus:border-cyan-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl shadow-lg cursor-pointer"
              >
                Importar & Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
