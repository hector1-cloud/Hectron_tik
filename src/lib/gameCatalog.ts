import { GameItem, ItemRarity, ItemCategory } from "../types";

export const ITEM_CATALOG: Record<string, Omit<GameItem, "quantity" | "discoveredAt" | "equipped">> = {
  quantum_core: {
    id: "quantum_core",
    name: "Núcleo Cuántico Omega",
    description: "Generador de energía de punto cero que amplifica la autonomía de Miku.",
    lore: "Forjado en las profundidades del mainframe de Abadalabs, este núcleo resuena con frecuencias subatómicas.",
    rarity: "LEGENDARY",
    category: "QUANTUM_CORE",
    iconName: "Cpu",
    maxStack: 5,
    isConsumable: false,
    valueCoins: 500,
    statBonus: {
      hypeMultiplier: 1.5,
      ttsResonance: 1.3,
      specialAbility: "Aura de Pulso Cuántico Holográfico",
    },
    auraEffect: "PRISMATIC_RAINBOW",
  },
  neon_crystal: {
    id: "neon_crystal",
    name: "Cristal Neón de Éter",
    description: "Gema brillante extraída de las auroras digitales de TikTok LIVE.",
    lore: "Los streamers veteranos afirman que concentra el cariño y los 'Likes' de la audiencia.",
    rarity: "EPIC",
    category: "RELIC",
    iconName: "Gem",
    maxStack: 20,
    isConsumable: false,
    valueCoins: 250,
    statBonus: {
      streamKarma: 25,
      hypeMultiplier: 1.25,
    },
    auraEffect: "CYAN_NEON",
  },
  golden_microphone: {
    id: "golden_microphone",
    name: "Micrófono de Oro Vocaloid",
    description: "Micrófono bañado en oro con filtro anti-pop de diamante sintético.",
    lore: "Utilizado en los legendarios conciertos holográficos de 2026.",
    rarity: "LEGENDARY",
    category: "STREAM_GEAR",
    iconName: "Mic",
    maxStack: 1,
    isConsumable: false,
    valueCoins: 1000,
    statBonus: {
      ttsResonance: 1.6,
      hypeMultiplier: 1.4,
      specialAbility: "Voz Ultranítida de Alta Fidelidad",
    },
    auraEffect: "GOLDEN_GLOW",
  },
  cyber_rose: {
    id: "cyber_rose",
    name: "Rosa Holográfica Eterna",
    description: "Flor bio-digital generada por regalos de seguidores en directo.",
    lore: "Nunca se marchita; sus pétalos emiten suaves destellos de luz rosa.",
    rarity: "RARE",
    category: "RELIC",
    iconName: "Sparkles",
    maxStack: 99,
    isConsumable: true,
    valueCoins: 80,
    statBonus: {
      energyRestore: 50,
      streamKarma: 15,
    },
    auraEffect: "NONE",
  },
  energy_elixir: {
    id: "energy_elixir",
    name: "Bebida Energética Cyber-Surge",
    description: "Restaura la energía del avatar y aumenta la velocidad de fotogramas (FPS).",
    lore: "Sabor a lima sintética y neón líquido. Aprobada por streamers nocturnos.",
    rarity: "COMMON",
    category: "CONSUMABLE",
    iconName: "Zap",
    maxStack: 30,
    isConsumable: true,
    valueCoins: 30,
    statBonus: {
      energyRestore: 100,
      fpsBonus: 15,
    },
    auraEffect: "NONE",
  },
  neural_chip: {
    id: "neural_chip",
    name: "Chip Neural Gemini Flash 3.7",
    description: "Procesador ultra-rápido de razonamiento cognitivo y síntesis emocional.",
    lore: "Permite a Miku improvisar respuestas agudas en menos de 100 milisegundos.",
    rarity: "EPIC",
    category: "QUANTUM_CORE",
    iconName: "Activity",
    maxStack: 10,
    isConsumable: false,
    valueCoins: 350,
    statBonus: {
      ttsResonance: 1.45,
      streamKarma: 40,
    },
    auraEffect: "CYAN_NEON",
  },
  streamer_crown: {
    id: "streamer_crown",
    name: "Corona Celestial de Diamante",
    description: "Símbolo de realeza y máximo estatus en el universo de streaming.",
    lore: "Reservada únicamente para aquellos que dominan el escenario virtual.",
    rarity: "LEGENDARY",
    category: "STREAM_GEAR",
    iconName: "Crown",
    maxStack: 1,
    isConsumable: false,
    valueCoins: 2000,
    statBonus: {
      hypeMultiplier: 2.0,
      streamKarma: 100,
      specialAbility: "Aura de Majestad Imperial",
    },
    auraEffect: "GOLDEN_GLOW",
  },
  void_shard: {
    id: "void_shard",
    name: "Fragmento del Vacío Digital",
    description: "Materia oscura computacional que absorbe el lag y las interferencias.",
    lore: "Un fragmento inestable originado tras la compresión de un agujero de datos.",
    rarity: "RARE",
    category: "RELIC",
    iconName: "Shield",
    maxStack: 50,
    isConsumable: false,
    valueCoins: 120,
    statBonus: {
      fpsBonus: 10,
      streamKarma: 10,
    },
    auraEffect: "VOID_PULSE",
  },
  hologram_disc: {
    id: "hologram_disc",
    name: "Disco Musical de Sintetizador",
    description: "Disco óptico con pistas de audio lo-fi y cyber-pop exclusivas.",
    lore: "Graba melodías sintéticas que elevan el ánimo del chat en un 200%.",
    rarity: "COMMON",
    category: "CONSUMABLE",
    iconName: "Music",
    maxStack: 25,
    isConsumable: true,
    valueCoins: 45,
    statBonus: {
      energyRestore: 30,
      hypeMultiplier: 1.1,
    },
    auraEffect: "NONE",
  },
  fire_ember: {
    id: "fire_ember",
    name: "Ascua de Hype Incandescente",
    description: "Llama digital que arde cuando el directo alcanza un pico de interacción.",
    lore: "Calor puro generado por miles de comentarios y donaciones sincronizadas.",
    rarity: "EPIC",
    category: "RELIC",
    iconName: "Flame",
    maxStack: 15,
    isConsumable: false,
    valueCoins: 300,
    statBonus: {
      hypeMultiplier: 1.35,
      energyRestore: 60,
    },
    auraEffect: "EMBER_FLAME",
  },
  badge_founder: {
    id: "badge_founder",
    name: "Medalla de Fundador HECTRON",
    description: "Insignia conmemorativa otorgada a los primeros exploradores del metaverso.",
    lore: "Edición limitada numerada y protegida criptográficamente en el ledger.",
    rarity: "LEGENDARY",
    category: "BADGE",
    iconName: "Award",
    maxStack: 1,
    isConsumable: false,
    valueCoins: 5000,
    statBonus: {
      streamKarma: 200,
      hypeMultiplier: 1.5,
      specialAbility: "Estatus de Pionero del Universo",
    },
    auraEffect: "PRISMATIC_RAINBOW",
  },
  nanobot_repair_kit: {
    id: "nanobot_repair_kit",
    name: "Kit de Nanobots de Mantenimiento",
    description: "Enjambre de nanorobots que optimizan la memoria y limpian glitches.",
    lore: "Mantiene los servomotores y el pipeline gráfico del avatar al 100% de eficiencia.",
    rarity: "COMMON",
    category: "CONSUMABLE",
    iconName: "Package",
    maxStack: 40,
    isConsumable: true,
    valueCoins: 35,
    statBonus: {
      energyRestore: 75,
      fpsBonus: 12,
    },
    auraEffect: "NONE",
  }
};

export const INITIAL_INVENTORY: GameItem[] = [
  {
    ...ITEM_CATALOG["badge_founder"],
    quantity: 1,
    discoveredAt: new Date().toISOString(),
    equipped: true,
  },
  {
    ...ITEM_CATALOG["quantum_core"],
    quantity: 1,
    discoveredAt: new Date().toISOString(),
    equipped: true,
  },
  {
    ...ITEM_CATALOG["energy_elixir"],
    quantity: 3,
    discoveredAt: new Date().toISOString(),
    equipped: false,
  },
  {
    ...ITEM_CATALOG["cyber_rose"],
    quantity: 5,
    discoveredAt: new Date().toISOString(),
    equipped: false,
  },
];

export const RARITY_CONFIG: Record<
  ItemRarity,
  { label: string; border: string; bg: string; text: string; glow: string; badge: string }
> = {
  COMMON: {
    label: "Común",
    border: "border-slate-600",
    bg: "bg-slate-900/90",
    text: "text-slate-300",
    glow: "shadow-slate-500/10",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
  RARE: {
    label: "Raro",
    border: "border-blue-500/50",
    bg: "bg-blue-950/40",
    text: "text-blue-300",
    glow: "shadow-blue-500/20",
    badge: "bg-blue-950 text-blue-300 border-blue-500/40",
  },
  EPIC: {
    label: "Épico",
    border: "border-purple-500/50",
    bg: "bg-purple-950/40",
    text: "text-purple-300",
    glow: "shadow-purple-500/20",
    badge: "bg-purple-950 text-purple-300 border-purple-500/40",
  },
  LEGENDARY: {
    label: "Legendario",
    border: "border-amber-400/60",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
    glow: "shadow-amber-500/30",
    badge: "bg-amber-950 text-amber-300 border-amber-500/50",
  },
};

export function getRandomCatalogItemId(): string {
  const itemIds = Object.keys(ITEM_CATALOG);
  const weights: Record<ItemRarity, number> = {
    COMMON: 50,
    RARE: 30,
    EPIC: 15,
    LEGENDARY: 5,
  };

  const pool: string[] = [];
  itemIds.forEach((id) => {
    const item = ITEM_CATALOG[id];
    const weight = weights[item.rarity] || 10;
    for (let i = 0; i < weight; i++) {
      pool.push(id);
    }
  });

  return pool[Math.floor(Math.random() * pool.length)];
}
