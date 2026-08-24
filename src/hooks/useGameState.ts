import { useState, useEffect, useCallback, useRef } from "react";
import {
  GameStatePayload,
  GameItem,
  SpawnedWorldItem,
  SaveSlotMetadata,
  Emotion,
  AuraEffect,
} from "../types";
import { ITEM_CATALOG, INITIAL_INVENTORY, getRandomCatalogItemId } from "../lib/gameCatalog";
import { playSynthesizedSfx } from "../lib/gameAudio";
import { saveGameToFirestore, loadGameFromFirestore, listSavedGamesFromFirestore } from "../lib/firebase";

const SAVE_INDEX_KEY = "hectron_game_saves_index_v1";
const SAVE_SLOT_PREFIX = "hectron_game_slot_v1_";
const AUTOSAVE_SLOT_ID = "autosave";

const DEFAULT_INITIAL_STATE: GameStatePayload = {
  version: 1,
  timestamp: new Date().toISOString(),
  player: {
    name: "Hectron Commander",
    level: 1,
    xp: 45,
    xpToNextLevel: 100,
    cyberCoins: 250,
    energy: 100,
    maxEnergy: 100,
    reputation: 10,
  },
  inventory: INITIAL_INVENTORY,
  equippedItems: ["badge_founder", "quantum_core"],
  activeAura: "CYAN_NEON",
  discoveredItemIds: ["badge_founder", "quantum_core", "energy_elixir", "cyber_rose"],
  worldSpawnedItems: [
    {
      id: "spawn_1",
      itemId: "neon_crystal",
      name: "Cristal Neón de Éter",
      position: [-1.8, 0.4, 0.5],
      rarity: "EPIC",
      iconName: "Gem",
      collected: false,
      spawnTime: Date.now(),
    },
    {
      id: "spawn_2",
      itemId: "cyber_rose",
      name: "Rosa Holográfica",
      position: [1.9, 0.2, 0.8],
      rarity: "RARE",
      iconName: "Sparkles",
      collected: false,
      spawnTime: Date.now(),
    },
    {
      id: "spawn_3",
      itemId: "energy_elixir",
      name: "Bebida Energética",
      position: [0.9, -0.4, 1.4],
      rarity: "COMMON",
      iconName: "Zap",
      collected: false,
      spawnTime: Date.now(),
    }
  ],
  streamStats: {
    totalViewersServed: 1240,
    giftsReceivedCount: 18,
    itemsCollectedCount: 4,
    questsCompletedCount: 2,
  },
  settings: {
    autoSaveIntervalSeconds: 60,
    soundEffectsEnabled: true,
    bgmVolume: 0.7,
    sfxVolume: 0.8,
    particleDensity: "HIGH",
  },
  activeScene: "DEFAULT",
  activeEmotion: "HAPPY",
  playtimeSeconds: 120,
};

export function useGameState(
  currentScene: string,
  currentEmotion: Emotion,
  setEmotion?: (e: Emotion) => void,
  addLog?: (level: any, scope: any, message: string, details?: any) => void
) {
  // Load saved state or default
  const [gameState, setGameState] = useState<GameStatePayload>(() => {
    try {
      const savedAuto = localStorage.getItem(`${SAVE_SLOT_PREFIX}${AUTOSAVE_SLOT_ID}`);
      if (savedAuto) {
        const parsed = JSON.parse(savedAuto);
        if (parsed && parsed.player && Array.isArray(parsed.inventory)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load initial autosave:", e);
    }
    return DEFAULT_INITIAL_STATE;
  });

  const [saveSlots, setSaveSlots] = useState<SaveSlotMetadata[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);

  const gameStateRef = useRef<GameStatePayload>(gameState);
  gameStateRef.current = gameState;

  // Sound helper
  const soundEffect = useCallback((type: "pickup" | "save" | "load" | "equip" | "use" | "level_up" | "error") => {
    if (gameStateRef.current.settings.soundEffectsEnabled) {
      playSynthesizedSfx(type);
    }
  }, []);

  // Refresh list of save slots from localStorage and cloud
  const refreshSaveSlots = useCallback(async () => {
    const slots: SaveSlotMetadata[] = [];
    try {
      // 1. Read index from localStorage
      const indexRaw = localStorage.getItem(SAVE_INDEX_KEY);
      const indexList: string[] = indexRaw ? JSON.parse(indexRaw) : [];
      
      // Ensure autosave, slot_1, slot_2, slot_3 are present in check list
      const candidateSlots = Array.from(new Set([AUTOSAVE_SLOT_ID, "slot_1", "slot_2", "slot_3", ...indexList]));

      for (const slotId of candidateSlots) {
        const raw = localStorage.getItem(`${SAVE_SLOT_PREFIX}${slotId}`);
        if (raw) {
          try {
            const data: GameStatePayload = JSON.parse(raw);
            slots.push({
              slotId,
              slotName: slotId === AUTOSAVE_SLOT_ID ? "Guardado Automático (Auto-Save)" : `Ranura ${slotId.replace("slot_", "")}`,
              timestamp: data.timestamp || new Date().toISOString(),
              isAutoSave: slotId === AUTOSAVE_SLOT_ID,
              playtimeSeconds: data.playtimeSeconds || 0,
              playerLevel: data.player?.level || 1,
              cyberCoins: data.player?.cyberCoins || 0,
              activeScene: data.activeScene || "DEFAULT",
              activeEmotion: data.activeEmotion || "HAPPY",
              inventoryCount: (data.inventory || []).reduce((acc, it) => acc + (it.quantity || 1), 0),
              completionPercentage: Math.min(100, Math.round(((data.discoveredItemIds?.length || 1) / Object.keys(ITEM_CATALOG).length) * 100)),
            });
          } catch {}
        }
      }

      // 2. Fetch cloud save previews if available
      try {
        const cloudSaves = await listSavedGamesFromFirestore();
        if (Array.isArray(cloudSaves) && cloudSaves.length > 0) {
          cloudSaves.forEach((cs) => {
            if (!slots.some((s) => s.slotId === cs.slotId || s.slotId === cs.id)) {
              slots.push({
                slotId: cs.slotId || cs.id,
                slotName: `${cs.slotName || cs.id} (Nube Firestore)`,
                timestamp: cs.timestamp || cs.updatedAt || new Date().toISOString(),
                playtimeSeconds: cs.playtimeSeconds || 0,
                playerLevel: cs.playerLevel || 1,
                cyberCoins: cs.cyberCoins || 0,
                activeScene: cs.activeScene || "DEFAULT",
                activeEmotion: (cs.activeEmotion as Emotion) || "HAPPY",
                inventoryCount: cs.inventoryItemsCount || 0,
                completionPercentage: 50,
              });
            }
          });
        }
      } catch {}

      setSaveSlots(slots);
    } catch (e) {
      console.warn("Failed reading save slots:", e);
    }
  }, []);

  // Playtime tick counter
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        playtimeSeconds: prev.playtimeSeconds + 1,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Periodic random world item spawner (1 item every 45-60 seconds if less than 5 items in world)
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState((prev) => {
        const uncollected = prev.worldSpawnedItems.filter((i) => !i.collected);
        if (uncollected.length >= 6) return prev;

        const randomItemId = getRandomCatalogItemId();
        const catalogItem = ITEM_CATALOG[randomItemId];
        if (!catalogItem) return prev;

        const angle = Math.random() * Math.PI * 2;
        const radius = 1.4 + Math.random() * 1.5;
        const posX = Math.cos(angle) * radius;
        const posZ = Math.sin(angle) * radius * 0.7;
        const posY = -0.4 + Math.random() * 1.2;

        const newItem: SpawnedWorldItem = {
          id: `spawn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          itemId: randomItemId,
          name: catalogItem.name,
          position: [posX, posY, posZ],
          rarity: catalogItem.rarity,
          iconName: catalogItem.iconName,
          collected: false,
          spawnTime: Date.now(),
        };

        if (addLog) {
          addLog("INFO", "3D", `¡Nuevo objeto descubierto en el escenario: ${catalogItem.name} (${catalogItem.rarity})!`);
        }

        return {
          ...prev,
          worldSpawnedItems: [...prev.worldSpawnedItems.slice(-8), newItem],
        };
      });
    }, 45000);
    return () => clearInterval(timer);
  }, [addLog]);

  // Initial load of slots
  useEffect(() => {
    refreshSaveSlots();
  }, [refreshSaveSlots]);

  // Save Game function
  const saveGame = useCallback(
    async (slotId: string, customSlotName?: string): Promise<{ success: boolean; message: string }> => {
      try {
        const current = gameStateRef.current;
        const payload: GameStatePayload = {
          ...current,
          activeScene: currentScene || current.activeScene,
          activeEmotion: currentEmotion || current.activeEmotion,
          timestamp: new Date().toISOString(),
        };

        // 1. Save to LocalStorage
        localStorage.setItem(`${SAVE_SLOT_PREFIX}${slotId}`, JSON.stringify(payload));

        // Update index list in localStorage
        try {
          const indexRaw = localStorage.getItem(SAVE_INDEX_KEY);
          const indexList: string[] = indexRaw ? JSON.parse(indexRaw) : [];
          if (!indexList.includes(slotId)) {
            indexList.push(slotId);
            localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(indexList));
          }
        } catch {}

        // 2. Cloud Firestore Save
        const slotDisplayName = customSlotName || (slotId === AUTOSAVE_SLOT_ID ? "Guardado Automático" : `Ranura ${slotId}`);
        saveGameToFirestore(slotId, {
          slotId,
          slotName: slotDisplayName,
          timestamp: payload.timestamp,
          playtimeSeconds: payload.playtimeSeconds,
          playerLevel: payload.player.level,
          cyberCoins: payload.player.cyberCoins,
          activeScene: payload.activeScene,
          activeEmotion: payload.activeEmotion,
          inventoryItemsCount: payload.inventory.reduce((acc, it) => acc + it.quantity, 0),
          statePayload: JSON.stringify(payload),
        }).catch(() => {});

        soundEffect("save");
        if (addLog) {
          addLog("INFO", "FRONTEND", `Partida guardada exitosamente en [${slotDisplayName}]`);
        }

        await refreshSaveSlots();
        return { success: true, message: `Partida guardada correctamente en ${slotDisplayName}` };
      } catch (err: any) {
        soundEffect("error");
        return { success: false, message: `Error al guardar: ${err?.message || String(err)}` };
      }
    },
    [currentScene, currentEmotion, soundEffect, addLog, refreshSaveSlots]
  );

  // Auto-Save Trigger function with debounce indicator
  const triggerAutoSave = useCallback(
    async (reason?: string) => {
      setIsAutoSaving(true);
      setLastAutoSaveTime(new Date().toLocaleTimeString());
      try {
        await saveGame(AUTOSAVE_SLOT_ID, "Auto-Guardado del Sistema");
        if (reason && addLog) {
          addLog("DEBUG", "FRONTEND", `Auto-guardado completado (${reason})`);
        }
      } finally {
        setTimeout(() => setIsAutoSaving(false), 1200);
      }
    },
    [saveGame, addLog]
  );

  // Load Game function
  const loadGame = useCallback(
    async (slotId: string): Promise<{ success: boolean; message: string }> => {
      try {
        // 1. Try local storage first
        let loadedData: GameStatePayload | null = null;
        const raw = localStorage.getItem(`${SAVE_SLOT_PREFIX}${slotId}`);
        if (raw) {
          loadedData = JSON.parse(raw);
        } else {
          // 2. Try Firestore cloud backup
          const cloudDoc = await loadGameFromFirestore(slotId);
          if (cloudDoc && cloudDoc.statePayload) {
            loadedData = JSON.parse(cloudDoc.statePayload);
          }
        }

        if (!loadedData || !loadedData.player || !Array.isArray(loadedData.inventory)) {
          soundEffect("error");
          return { success: false, message: "No se encontraron datos válidos en esta ranura." };
        }

        // Restore game state
        setGameState(loadedData);
        if (setEmotion && loadedData.activeEmotion) {
          setEmotion(loadedData.activeEmotion);
        }

        soundEffect("load");
        if (addLog) {
          addLog("INFO", "FRONTEND", `Partida cargada exitosamente: Nivel ${loadedData.player.level}, ${loadedData.inventory.length} objetos en inventario.`);
        }

        return {
          success: true,
          message: `Partida cargada: Nivel ${loadedData.player.level} (${loadedData.player.cyberCoins} CyberCoins)`,
        };
      } catch (err: any) {
        soundEffect("error");
        return { success: false, message: `Error al cargar partida: ${err?.message || String(err)}` };
      }
    },
    [soundEffect, setEmotion, addLog]
  );

  // Delete Save function
  const deleteSave = useCallback(
    async (slotId: string): Promise<{ success: boolean; message: string }> => {
      try {
        localStorage.removeItem(`${SAVE_SLOT_PREFIX}${slotId}`);
        try {
          const indexRaw = localStorage.getItem(SAVE_INDEX_KEY);
          if (indexRaw) {
            const indexList: string[] = JSON.parse(indexRaw);
            const filtered = indexList.filter((s) => s !== slotId);
            localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(filtered));
          }
        } catch {}
        await refreshSaveSlots();
        return { success: true, message: "Ranura de guardado eliminada correctamente." };
      } catch (err: any) {
        return { success: false, message: `Error al eliminar: ${err?.message || String(err)}` };
      }
    },
    [refreshSaveSlots]
  );

  // Export Save JSON
  const exportSaveData = useCallback((slotId = AUTOSAVE_SLOT_ID): string => {
    const raw = localStorage.getItem(`${SAVE_SLOT_PREFIX}${slotId}`);
    if (raw) return raw;
    return JSON.stringify(gameStateRef.current, null, 2);
  }, []);

  // Import Save JSON
  const importSaveData = useCallback(
    async (jsonData: string): Promise<{ success: boolean; message: string }> => {
      try {
        const parsed: GameStatePayload = JSON.parse(jsonData);
        if (!parsed || !parsed.player || !Array.isArray(parsed.inventory)) {
          throw new Error("El archivo no tiene el formato de guardado de HECTRON Studio.");
        }
        setGameState(parsed);
        localStorage.setItem(`${SAVE_SLOT_PREFIX}imported_${Date.now()}`, JSON.stringify(parsed));
        soundEffect("load");
        await refreshSaveSlots();
        return { success: true, message: `¡Partida importada con éxito! Nivel: ${parsed.player.level}` };
      } catch (err: any) {
        soundEffect("error");
        return { success: false, message: `Error al importar: ${err?.message || "JSON corrupto"}` };
      }
    },
    [soundEffect, refreshSaveSlots]
  );

  // Add Experience and handle level-ups
  const gainExperience = useCallback(
    (amount: number) => {
      setGameState((prev) => {
        let newXp = prev.player.xp + amount;
        let newLevel = prev.player.level;
        let newXpNext = prev.player.xpToNextLevel;
        let leveledUp = false;

        while (newXp >= newXpNext) {
          newXp -= newXpNext;
          newLevel += 1;
          newXpNext = Math.round(newXpNext * 1.4);
          leveledUp = true;
        }

        if (leveledUp) {
          soundEffect("level_up");
          if (addLog) {
            addLog("INFO", "FRONTEND", `🎉 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${newLevel}! Recompensas desbloqueadas.`);
          }
        }

        return {
          ...prev,
          player: {
            ...prev.player,
            xp: newXp,
            level: newLevel,
            xpToNextLevel: newXpNext,
            maxEnergy: 100 + (newLevel - 1) * 15,
            energy: Math.min(prev.player.energy + 25, 100 + (newLevel - 1) * 15),
          },
        };
      });
    },
    [soundEffect, addLog]
  );

  // Add CyberCoins
  const gainCoins = useCallback(
    (amount: number) => {
      setGameState((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          cyberCoins: Math.max(0, prev.player.cyberCoins + amount),
        },
      }));
    },
    []
  );

  // Collect item into inventory
  const collectItem = useCallback(
    (itemId: string, quantity = 1): { success: boolean; item?: GameItem; message: string } => {
      const template = ITEM_CATALOG[itemId];
      if (!template) {
        return { success: false, message: "Objeto desconocido en el catálogo." };
      }

      let collectedItem: GameItem | undefined;

      setGameState((prev) => {
        const inventory = [...prev.inventory];
        const existingIdx = inventory.findIndex((i) => i.id === itemId);

        if (existingIdx >= 0) {
          const existing = inventory[existingIdx];
          const newQty = existing.quantity + quantity;
          inventory[existingIdx] = {
            ...existing,
            quantity: newQty,
          };
          collectedItem = inventory[existingIdx];
        } else {
          const newItem: GameItem = {
            ...template,
            quantity,
            discoveredAt: new Date().toISOString(),
            equipped: false,
          };
          inventory.push(newItem);
          collectedItem = newItem;
        }

        const discovered = Array.from(new Set([...prev.discoveredItemIds, itemId]));
        const xpGained = template.rarity === "LEGENDARY" ? 60 : template.rarity === "EPIC" ? 35 : template.rarity === "RARE" ? 20 : 10;
        const coinsGained = Math.round(template.valueCoins * 0.2);

        return {
          ...prev,
          inventory,
          discoveredItemIds: discovered,
          player: {
            ...prev.player,
            xp: prev.player.xp + xpGained,
            cyberCoins: prev.player.cyberCoins + coinsGained,
          },
          streamStats: {
            ...prev.streamStats,
            itemsCollectedCount: prev.streamStats.itemsCollectedCount + quantity,
          },
        };
      });

      soundEffect("pickup");
      if (addLog) {
        addLog("INFO", "FRONTEND", `Objeto recolectado: ${template.name} x${quantity} (+XP, +CyberCoins)`);
      }

      // Auto-save on key event (Item discovery)
      triggerAutoSave("Objeto recolectado");

      return {
        success: true,
        item: collectedItem,
        message: `¡Has obtenido ${template.name} x${quantity}!`,
      };
    },
    [soundEffect, addLog, triggerAutoSave]
  );

  // Pickup 3D world spawned item
  const pickupWorldItem = useCallback(
    (spawnedId: string) => {
      const current = gameStateRef.current;
      const target = current.worldSpawnedItems.find((i) => i.id === spawnedId && !i.collected);
      if (!target) return;

      setGameState((prev) => ({
        ...prev,
        worldSpawnedItems: prev.worldSpawnedItems.map((i) =>
          i.id === spawnedId ? { ...i, collected: true } : i
        ),
      }));

      collectItem(target.itemId, 1);
    },
    [collectItem]
  );

  // Use consumable item
  const useItem = useCallback(
    (itemId: string): { success: boolean; message: string } => {
      const current = gameStateRef.current;
      const item = current.inventory.find((i) => i.id === itemId);
      if (!item) {
        soundEffect("error");
        return { success: false, message: "El objeto no está en tu inventario." };
      }

      if (!item.isConsumable) {
        soundEffect("error");
        return { success: false, message: "Este objeto no es consumible; debes equiparlo." };
      }

      const bonus = item.statBonus || {};
      const restoreEnergy = bonus.energyRestore || 25;

      setGameState((prev) => {
        const inventory = prev.inventory
          .map((i) => {
            if (i.id === itemId) {
              return { ...i, quantity: i.quantity - 1 };
            }
            return i;
          })
          .filter((i) => i.quantity > 0);

        return {
          ...prev,
          inventory,
          player: {
            ...prev.player,
            energy: Math.min(prev.player.maxEnergy, prev.player.energy + restoreEnergy),
          },
        };
      });

      soundEffect("use");
      if (addLog) {
        addLog("INFO", "FRONTEND", `Usaste ${item.name}. Energía restaurada: +${restoreEnergy}`);
      }

      triggerAutoSave("Objeto utilizado");
      return { success: true, message: `Usaste ${item.name}. +${restoreEnergy} Energía` };
    },
    [soundEffect, addLog, triggerAutoSave]
  );

  // Equip / Unequip gear item
  const equipItem = useCallback(
    (itemId: string): { success: boolean; message: string } => {
      const current = gameStateRef.current;
      const item = current.inventory.find((i) => i.id === itemId);
      if (!item) {
        soundEffect("error");
        return { success: false, message: "Objeto no encontrado." };
      }

      const isEquipping = !item.equipped;

      setGameState((prev) => {
        const inventory = prev.inventory.map((i) => {
          if (i.id === itemId) {
            return { ...i, equipped: isEquipping };
          }
          return i;
        });

        let equippedItems = prev.equippedItems || [];
        if (isEquipping) {
          equippedItems = Array.from(new Set([...equippedItems, itemId]));
        } else {
          equippedItems = equippedItems.filter((id) => id !== itemId);
        }

        const newAura: AuraEffect = isEquipping && item.auraEffect && item.auraEffect !== "NONE"
          ? item.auraEffect
          : prev.activeAura;

        return {
          ...prev,
          inventory,
          equippedItems,
          activeAura: newAura,
        };
      });

      soundEffect("equip");
      const actionLabel = isEquipping ? "equipado" : "desequipado";
      if (addLog) {
        addLog("INFO", "FRONTEND", `Objeto ${actionLabel}: ${item.name}`);
      }

      triggerAutoSave(`Objeto ${actionLabel}`);
      return { success: true, message: `Has ${actionLabel} ${item.name}` };
    },
    [soundEffect, addLog, triggerAutoSave]
  );

  // Discard / Sell item
  const discardItem = useCallback(
    (itemId: string, quantity = 1): { success: boolean; message: string } => {
      const current = gameStateRef.current;
      const item = current.inventory.find((i) => i.id === itemId);
      if (!item) return { success: false, message: "Objeto no encontrado." };

      const coinsEarned = Math.round((item.valueCoins || 10) * 0.5) * quantity;

      setGameState((prev) => {
        const inventory = prev.inventory
          .map((i) => {
            if (i.id === itemId) {
              return { ...i, quantity: i.quantity - quantity };
            }
            return i;
          })
          .filter((i) => i.quantity > 0);

        return {
          ...prev,
          inventory,
          player: {
            ...prev.player,
            cyberCoins: prev.player.cyberCoins + coinsEarned,
          },
        };
      });

      if (addLog) {
        addLog("INFO", "FRONTEND", `Vendiste ${item.name} x${quantity} por +${coinsEarned} CyberCoins.`);
      }

      return { success: true, message: `Vendido por +${coinsEarned} CyberCoins` };
    },
    [addLog]
  );

  return {
    gameState,
    collectItem,
    useItem,
    equipItem,
    discardItem,
    spawnRandomWorldItem: () => {
      const randomItemId = getRandomCatalogItemId();
      const catalogItem = ITEM_CATALOG[randomItemId];
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.4 + Math.random() * 1.5;
      const newItem: SpawnedWorldItem = {
        id: `manual_spawn_${Date.now()}`,
        itemId: randomItemId,
        name: catalogItem.name,
        position: [Math.cos(angle) * radius, -0.3 + Math.random() * 1.2, Math.sin(angle) * radius * 0.7],
        rarity: catalogItem.rarity,
        iconName: catalogItem.iconName,
        collected: false,
        spawnTime: Date.now(),
      };
      setGameState((prev) => ({
        ...prev,
        worldSpawnedItems: [...prev.worldSpawnedItems, newItem],
      }));
      return newItem;
    },
    pickupWorldItem,
    saveGame,
    loadGame,
    deleteSave,
    exportSaveData,
    importSaveData,
    saveSlots,
    isAutoSaving,
    lastAutoSaveTime,
    triggerAutoSave,
    gainExperience,
    gainCoins,
    soundEffect,
  };
}
