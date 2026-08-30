import { useState, useEffect, useCallback, useRef } from "react";
import {
  Achievement,
  AvatarAnimationClass,
  AuraEffect,
} from "../types";
import { INITIAL_ACHIEVEMENTS } from "../lib/achievementsCatalog";
import { playSynthesizedSfx } from "../lib/gameAudio";

const ACHIEVEMENTS_STORAGE_KEY = "hectron_streamer_achievements_v1";
const EQUIPPED_REWARDS_KEY = "hectron_equipped_rewards_v1";

export function useAchievements(
  gainExperience?: (amount: number) => void,
  gainCoins?: (amount: number) => void,
  addLog?: (level: any, scope: any, message: string, details?: any) => void
) {
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (saved) {
        const parsed: Achievement[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_ACHIEVEMENTS to guarantee any newly added achievements are included
          return INITIAL_ACHIEVEMENTS.map((initial) => {
            const found = parsed.find((p) => p.id === initial.id);
            if (found) {
              return {
                ...initial,
                currentCount: typeof found.currentCount === "number" ? found.currentCount : initial.currentCount,
                unlocked: Boolean(found.unlocked),
                unlockedAt: found.unlockedAt || initial.unlockedAt,
                claimed: Boolean(found.claimed),
              };
            }
            return initial;
          });
        }
      }
    } catch (e) {
      console.warn("Could not load achievements from localStorage", e);
    }
    return INITIAL_ACHIEVEMENTS;
  });

  const [equippedRewards, setEquippedRewards] = useState<{
    activeAnimation?: AvatarAnimationClass | string;
    activeSpecialPhrase?: string;
    activeVisualEffect?: AuraEffect;
    activeTitle?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(EQUIPPED_REWARDS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      activeAnimation: "happy",
      activeSpecialPhrase: "¡Saludos a todos los ciber-viajeros! Gracias por la energía estelar. 💙✨",
      activeVisualEffect: "CYAN_NEON",
      activeTitle: "🌟 Streamer Holográfica Prime",
    };
  });

  const [latestUnlockedAchievement, setLatestUnlockedAchievement] = useState<Achievement | null>(null);
  const achievementsRef = useRef<Achievement[]>(achievements);
  achievementsRef.current = achievements;

  // Persist achievements to localStorage & server
  const persistAchievements = useCallback((updated: Achievement[]) => {
    try {
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Send to backend in background
    fetch("/api/streamer/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ achievements: updated }),
    }).catch(() => {});
  }, []);

  // Persist equipped rewards
  const persistEquippedRewards = useCallback((rewards: typeof equippedRewards) => {
    try {
      localStorage.setItem(EQUIPPED_REWARDS_KEY, JSON.stringify(rewards));
    } catch {}
  }, []);

  // Check and unlock achievements
  const checkAndUnlock = useCallback(
    (achievementId: string, currentCount: number) => {
      setAchievements((prev) => {
        let justUnlocked: Achievement | null = null;

        const updated = prev.map((ach) => {
          if (ach.id === achievementId) {
            const newCount = Math.max(ach.currentCount, currentCount);
            const shouldUnlock = newCount >= ach.targetCount && !ach.unlocked;

            if (shouldUnlock) {
              justUnlocked = {
                ...ach,
                currentCount: newCount,
                unlocked: true,
                unlockedAt: new Date().toISOString(),
              };
              return justUnlocked;
            }

            return {
              ...ach,
              currentCount: newCount,
            };
          }
          return ach;
        });

        if (justUnlocked) {
          const unlockedItem: Achievement = justUnlocked;
          setLatestUnlockedAchievement(unlockedItem);
          playSynthesizedSfx("level_up");
          if (addLog) {
            addLog(
              "INFO",
              "ACHIEVEMENT",
              `🏆 ¡LOGRO DESBLOQUEADO! [${unlockedItem.title}]: ${unlockedItem.description} (Recompensa: ${unlockedItem.reward.name})`
            );
          }
        }

        persistAchievements(updated);
        return updated;
      });
    },
    [addLog, persistAchievements]
  );

  // Trigger achievement events
  const triggerAchievementCheck = useCallback(
    (action: "chat_sent" | "gift_received" | "item_collected" | "stream_tick" | "ai_decision" | "tts_spoken", count = 1) => {
      const currentList = achievementsRef.current;

      currentList.forEach((ach) => {
        if (ach.unlocked) return;

        if (action === "chat_sent") {
          if (ach.id === "chat_first_message") {
            checkAndUnlock(ach.id, ach.currentCount + count);
          } else if (ach.id === "chat_conversationalist" || ach.id === "chat_dialogue_master") {
            checkAndUnlock(ach.id, ach.currentCount + count);
          }
        } else if (action === "gift_received") {
          if (ach.id === "gift_first_received" || ach.id === "gift_rose_cascade" || ach.id === "gift_galactic_chest" || ach.id === "gift_hype_overload") {
            checkAndUnlock(ach.id, ach.currentCount + count);
          }
        } else if (action === "item_collected") {
          if (ach.id === "collect_first_relic" || ach.id === "collect_ether_collector" || ach.id === "collect_quantum_archaeologist") {
            checkAndUnlock(ach.id, ach.currentCount + count);
          }
        } else if (action === "stream_tick") {
          if (ach.id === "stream_on_air_novice" || ach.id === "stream_continuous_flow" || ach.id === "stream_interdimensional_marathon") {
            checkAndUnlock(ach.id, ach.currentCount + count);
          }
        } else if (action === "ai_decision") {
          if (ach.id === "ai_autonomy_spark" || ach.id === "ai_full_harmony") {
            checkAndUnlock(ach.id, ach.currentCount + count);
          }
        } else if (action === "tts_spoken") {
          if (ach.id === "ai_voice_synthesis_pro") {
            checkAndUnlock(ach.id, ach.currentCount + count);
          }
        }
      });
    },
    [checkAndUnlock]
  );

  // Claim achievement reward
  const claimAchievementReward = useCallback(
    (achievementId: string): { success: boolean; message: string } => {
      let claimedAchievement: Achievement | null = null;

      setAchievements((prev) => {
        const updated = prev.map((ach) => {
          if (ach.id === achievementId && ach.unlocked && !ach.claimed) {
            claimedAchievement = ach;
            return {
              ...ach,
              claimed: true,
            };
          }
          return ach;
        });

        if (claimedAchievement) {
          persistAchievements(updated);
        }
        return updated;
      });

      if (claimedAchievement) {
        const target: Achievement = claimedAchievement;
        // Award XP & Coins
        if (gainExperience && target.xpReward) gainExperience(target.xpReward);
        if (gainCoins && target.coinsReward) gainCoins(target.coinsReward);

        // Auto-equip if it's a visual or title reward
        const r = target.reward;
        if (r.type === "ANIMATION" && r.animationClass) {
          setEquippedRewards((prev) => {
            const next = { ...prev, activeAnimation: r.animationClass };
            persistEquippedRewards(next);
            return next;
          });
        } else if (r.type === "VISUAL_EFFECT" && r.auraEffect) {
          setEquippedRewards((prev) => {
            const next = { ...prev, activeVisualEffect: r.auraEffect };
            persistEquippedRewards(next);
            return next;
          });
        } else if (r.type === "SPECIAL_PHRASE" && r.speechText) {
          setEquippedRewards((prev) => {
            const next = { ...prev, activeSpecialPhrase: r.speechText };
            persistEquippedRewards(next);
            return next;
          });
        } else if (r.type === "STREAMER_TITLE") {
          setEquippedRewards((prev) => {
            const next = { ...prev, activeTitle: r.value };
            persistEquippedRewards(next);
            return next;
          });
        }

        playSynthesizedSfx("equip");
        if (addLog) {
          addLog("INFO", "ACHIEVEMENT", `🎁 Recompensa reclamada: ${r.name} (+${target.xpReward} XP, +${target.coinsReward} Coins)`);
        }

        return {
          success: true,
          message: `¡Recompensa "${r.name}" desbloqueada y equipada (+${target.xpReward} XP, +${target.coinsReward} Coins)!`,
        };
      }

      return {
        success: false,
        message: "No se pudo reclamar la recompensa (o ya fue reclamada).",
      };
    },
    [gainExperience, gainCoins, addLog, persistAchievements, persistEquippedRewards]
  );

  // Equip specific rewards manually
  const equipRewardAnimation = useCallback(
    (animClass: AvatarAnimationClass) => {
      setEquippedRewards((prev) => {
        const next = { ...prev, activeAnimation: animClass };
        persistEquippedRewards(next);
        return next;
      });
      playSynthesizedSfx("equip");
    },
    [persistEquippedRewards]
  );

  const equipRewardVisualEffect = useCallback(
    (aura: AuraEffect) => {
      setEquippedRewards((prev) => {
        const next = { ...prev, activeVisualEffect: aura };
        persistEquippedRewards(next);
        return next;
      });
      playSynthesizedSfx("equip");
    },
    [persistEquippedRewards]
  );

  const equipRewardSpecialPhrase = useCallback(
    (phrase: string) => {
      setEquippedRewards((prev) => {
        const next = { ...prev, activeSpecialPhrase: phrase };
        persistEquippedRewards(next);
        return next;
      });
      playSynthesizedSfx("equip");
    },
    [persistEquippedRewards]
  );

  const equipRewardTitle = useCallback(
    (title: string) => {
      setEquippedRewards((prev) => {
        const next = { ...prev, activeTitle: title };
        persistEquippedRewards(next);
        return next;
      });
      playSynthesizedSfx("equip");
    },
    [persistEquippedRewards]
  );

  const dismissUnlockedAchievementToast = useCallback(() => {
    setLatestUnlockedAchievement(null);
  }, []);

  return {
    achievements,
    setAchievements,
    equippedRewards,
    triggerAchievementCheck,
    claimAchievementReward,
    equipRewardAnimation,
    equipRewardVisualEffect,
    equipRewardSpecialPhrase,
    equipRewardTitle,
    latestUnlockedAchievement,
    dismissUnlockedAchievementToast,
  };
}
