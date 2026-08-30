export type Emotion = 'HAPPY' | 'SAD' | 'ANGRY' | 'SURPRISE' | 'FLIRT' | 'IDLE';

export type AvatarAnimationClass =
  | 'excited'
  | 'thinking'
  | 'happy'
  | 'surprised'
  | 'flirt'
  | 'angry'
  | 'sad'
  | 'idle'
  | 'excited_spin'
  | 'heart_hands'
  | 'cyber_glow'
  | 'zen_float'
  | 'victory_wave';

export interface TtsSentimentMetadata {
  text: string;
  emotion: Emotion;
  animationClass: AvatarAnimationClass;
  sentimentScore: number; // -1.0 to 1.0
  keywords: string[];
  pitch: number;
  speed: number;
  timestamp: string;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
export type LogScope = 'SERVER' | 'FRONTEND' | 'AGENT' | 'TIKTOK' | '3D' | 'WORKFLOW' | 'ACHIEVEMENT';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  scope: LogScope;
  message: string;
  details?: any;
}

export type SceneName =
  | 'DEFAULT'
  | 'HAPPY_SCENE'
  | 'SAD_SCENE'
  | 'ANGRY_SCENE'
  | 'SURPRISE_SCENE'
  | 'FLIRT_SCENE'
  | string;

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  emotion?: Emotion;
  avatar?: string;
  isAi?: boolean;
}

export interface ObsStatus {
  connected: boolean;
  streaming: boolean;
  scene: string;
  obsVersion?: string;
  websocketVersion?: string;
}

export interface BrainState {
  currentEmotion: Emotion;
  currentScene: string;
  lastMessageTime: number | null;
  isStreaming: boolean;
  tiktokConnected: boolean;
  isAutonomous: boolean;
  roomId?: string | null;
}

export type ItemRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type ItemCategory = 'RELIC' | 'CONSUMABLE' | 'STREAM_GEAR' | 'QUANTUM_CORE' | 'BADGE';
export type AuraEffect =
  | 'CYAN_NEON'
  | 'GOLDEN_GLOW'
  | 'PRISMATIC_RAINBOW'
  | 'VOID_PULSE'
  | 'EMBER_FLAME'
  | 'STARLIGHT_SPARKLES'
  | 'NONE';

export interface ItemStatBonus {
  hypeMultiplier?: number;
  fpsBonus?: number;
  streamKarma?: number;
  ttsResonance?: number;
  energyRestore?: number;
  specialAbility?: string;
}

export interface GameItem {
  id: string;
  name: string;
  description: string;
  lore: string;
  rarity: ItemRarity;
  category: ItemCategory;
  iconName: string;
  quantity: number;
  maxStack: number;
  discoveredAt: string;
  equipped?: boolean;
  isConsumable?: boolean;
  statBonus?: ItemStatBonus;
  auraEffect?: AuraEffect;
  valueCoins: number;
}

export interface SpawnedWorldItem {
  id: string;
  itemId: string;
  name: string;
  position: [number, number, number];
  rarity: ItemRarity;
  iconName: string;
  collected: boolean;
  spawnTime: number;
}

export interface SaveSlotMetadata {
  slotId: string;
  slotName: string;
  timestamp: string;
  isAutoSave?: boolean;
  playtimeSeconds: number;
  playerLevel: number;
  cyberCoins: number;
  activeScene: string;
  activeEmotion: Emotion;
  inventoryCount: number;
  completionPercentage: number;
}

export interface GameStatePayload {
  version: number;
  timestamp: string;
  player: {
    name: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    cyberCoins: number;
    energy: number;
    maxEnergy: number;
    reputation: number;
  };
  inventory: GameItem[];
  equippedItems: string[];
  activeAura: AuraEffect;
  discoveredItemIds: string[];
  worldSpawnedItems: SpawnedWorldItem[];
  streamStats: {
    totalViewersServed: number;
    giftsReceivedCount: number;
    itemsCollectedCount: number;
    questsCompletedCount: number;
  };
  settings: {
    autoSaveIntervalSeconds: number;
    soundEffectsEnabled: boolean;
    bgmVolume: number;
    sfxVolume: number;
    particleDensity: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  activeScene: string;
  activeEmotion: Emotion;
  playtimeSeconds: number;
}

export type GeminiVoiceName = "Kore" | "Puck" | "Charon" | "Fenrir" | "Aoede" | "Zephyr" | "Leda" | "Orus";

export type TtsExpressiveness = "cheerful" | "energetic" | "calm" | "natural" | "anime";

export interface TtsVoiceSettings {
  voice: GeminiVoiceName;
  speakingRate: number;
  pitch: number;
  expressiveness: TtsExpressiveness;
  autoSpeechEnabled: boolean;
}

export interface VirtualStreamerState {
  version: number;
  timestamp: string;
  emotion: Emotion;
  activeScene: string;
  chatHistory: ChatMessage[];
  isAutonomous: boolean;
  isStreaming: boolean;
  tiktokConnected: boolean;
  ttsVoiceSettings: TtsVoiceSettings;
  streamStats: {
    totalViewersServed: number;
    giftsReceivedCount: number;
    itemsCollectedCount: number;
    questsCompletedCount: number;
    totalChatMessages: number;
    minutesStreamed: number;
    totalLikes: number;
    hypeMultiplier: number;
  };
  equippedRewards: {
    activeAnimation?: AvatarAnimationClass | string;
    activeSpecialPhrase?: string;
    activeVisualEffect?: AuraEffect;
    activeTitle?: string;
    activeBadge?: string;
  };
  unlockedAchievementIds: string[];
  claimedRewardIds: string[];
}

export type AchievementCategory = 'CHAT' | 'GIFTS' | 'STREAM_TIME' | 'EXPLORATION' | 'AI_AUTONOMY';
export type AchievementRarity = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
export type RewardType = 'ANIMATION' | 'SPECIAL_PHRASE' | 'VISUAL_EFFECT' | 'STREAMER_TITLE' | 'CYBER_COINS';

export interface AchievementReward {
  id: string;
  type: RewardType;
  name: string;
  description: string;
  value: string;
  iconName: string;
  animationClass?: AvatarAnimationClass;
  auraEffect?: AuraEffect;
  speechText?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  iconName: string;
  targetCount: number;
  currentCount: number;
  unlocked: boolean;
  unlockedAt?: string;
  claimed: boolean;
  reward: AchievementReward;
  xpReward: number;
  coinsReward: number;
}

export interface BrainContextType {
  agentUrl: string;
  setAgentUrl: (url: string) => void;
  agentStatus: 'ONLINE' | 'OFFLINE' | 'CHECKING';
  setAgentStatus: (status: 'ONLINE' | 'OFFLINE' | 'CHECKING') => void;
  obsStatus: ObsStatus;
  setObsStatus: (status: ObsStatus) => void;
  scenes: string[];
  setScenes: (scenes: string[]) => void;
  emotion: Emotion;
  setEmotion: (emotion: Emotion) => void;
  animationClass: AvatarAnimationClass;
  setAnimationClass: (animClass: AvatarAnimationClass) => void;
  latestTtsMetadata: TtsSentimentMetadata | null;
  isAutonomous: boolean;
  setIsAutonomous: (val: boolean) => void;
  tiktokConnected: boolean;
  setTiktokConnected: (val: boolean) => void;
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  activeTab: 'dashboard' | 'game' | 'inventory' | 'saves' | 'achievements' | 'profiles' | 'engagement' | 'overlay' | 'agent' | 'tiktok' | 'duix' | 'streamerbot' | 'logs' | 'performance' | 'autonomy' | 'workers-ai' | 'workflows' | 'executive' | 'enterprise' | 'sims' | 'livestudio' | 'linux' | 'studio3d' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'game' | 'inventory' | 'saves' | 'achievements' | 'profiles' | 'engagement' | 'overlay' | 'agent' | 'tiktok' | 'duix' | 'streamerbot' | 'logs' | 'performance' | 'autonomy' | 'workers-ai' | 'workflows' | 'executive' | 'enterprise' | 'sims' | 'livestudio' | 'linux' | 'studio3d' | 'analytics') => void;
  speakText: (text: string, emotion?: Emotion, customAnimation?: AvatarAnimationClass, customVoiceConfig?: Partial<TtsVoiceSettings>) => Promise<void>;
  latestSpeechText: string;
  isSpeaking: boolean;
  logs: LogEntry[];
  addLog: (level: LogLevel, scope: LogScope, message: string, details?: any) => void;
  clearLogs: () => void;
  lodLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  setLodLevel: (lod: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  fps: number;
  
  // TTS Voice Settings
  ttsVoiceSettings: TtsVoiceSettings;
  setTtsVoiceSettings: React.Dispatch<React.SetStateAction<TtsVoiceSettings>>;
  updateTtsVoiceSettings: (settings: Partial<TtsVoiceSettings>) => void;
  resetTtsVoiceSettings: () => void;
  
  // Game & Inventory & Save System state
  gameState: GameStatePayload;
  collectItem: (itemId: string, quantity?: number) => { success: boolean; item?: GameItem; message: string };
  useItem: (itemId: string) => { success: boolean; message: string };
  equipItem: (itemId: string) => { success: boolean; message: string };
  discardItem: (itemId: string, quantity?: number) => { success: boolean; message: string };
  spawnRandomWorldItem: () => SpawnedWorldItem;
  pickupWorldItem: (spawnedId: string) => void;
  saveGame: (slotId: string, slotName?: string) => Promise<{ success: boolean; message: string }>;
  loadGame: (slotId: string) => Promise<{ success: boolean; message: string }>;
  deleteSave: (slotId: string) => Promise<{ success: boolean; message: string }>;
  exportSaveData: (slotId?: string) => string;
  importSaveData: (jsonData: string) => Promise<{ success: boolean; message: string }>;
  saveSlots: SaveSlotMetadata[];
  isAutoSaving: boolean;
  lastAutoSaveTime: string | null;
  triggerAutoSave: (reason?: string) => Promise<void>;
  gainExperience: (amount: number) => void;
  gainCoins: (amount: number) => void;
  soundEffect: (type: 'pickup' | 'save' | 'load' | 'equip' | 'use' | 'level_up' | 'error') => void;

  // Streamer State Persistence & Restoration
  saveStreamerFullState: (slotId?: string) => Promise<{ success: boolean; message: string }>;
  loadStreamerFullState: (slotId?: string) => Promise<{ success: boolean; message: string }>;
  resetStreamerFullState: () => Promise<{ success: boolean; message: string }>;
  exportStreamerStateJSON: () => string;
  importStreamerStateJSON: (jsonStr: string) => Promise<{ success: boolean; message: string }>;
  streamerStateRestoredNotice: string | null;
  dismissStreamerRestoredNotice: () => void;

  // Achievements & Rewards System
  achievements: Achievement[];
  claimAchievementReward: (achievementId: string) => { success: boolean; message: string };
  equipRewardAnimation: (animClass: AvatarAnimationClass) => void;
  equipRewardVisualEffect: (aura: AuraEffect) => void;
  equipRewardSpecialPhrase: (phrase: string) => void;
  equipRewardTitle: (title: string) => void;
  equippedRewards: {
    activeAnimation?: AvatarAnimationClass | string;
    activeSpecialPhrase?: string;
    activeVisualEffect?: AuraEffect;
    activeTitle?: string;
  };
  triggerAchievementCheck: (action: 'chat_sent' | 'gift_received' | 'item_collected' | 'stream_tick' | 'ai_decision' | 'tts_spoken', count?: number) => void;
  latestUnlockedAchievement: Achievement | null;
  dismissUnlockedAchievementToast: () => void;
}

export interface DuixCreateAvatarRequest {
  conversationId: string;
  ttsName: string;
  name: string;
  greetings: string;
  profile: string;
}

export interface DuixCreateAvatarResponse {
  code?: number;
  msg?: string;
  data?: {
    avatarId?: string;
    avatarUrl?: string;
    conversationId?: string;
    status?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export type VoiceCommandCategory = 'scene' | 'stream' | 'emotion' | 'game' | 'navigation';

export interface VoiceCommandItem {
  id: string;
  title: string;
  phrase: string;
  category: VoiceCommandCategory;
  description: string;
  aliases: string[];
  samplePayload?: any;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  lastCommand: VoiceCommandItem | null;
  lastExecutionTime: string | null;
  lastStatus: 'idle' | 'matched' | 'unrecognized' | 'error';
  statusMessage?: string;
  isSupported: boolean;
  permissionGranted: boolean;
  language: string;
  continuous: boolean;
  audioFeedback: boolean;
  voiceAck: boolean;
}

export interface LinuxSystemState {
  info: any | null;
  metrics: any | null;
  processes: any[];
  filesystem: {
    currentPath: string;
    parentPath: string | null;
    entries: any[];
  } | null;
  diagnostics: any | null;
  terminalHistory: Array<{
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    timestamp: string;
    timeMs: number;
  }>;
}

// ==========================================
// USER PROFILES & CUSTOMIZATION TYPES
// ==========================================
export type ThemeColorPreset =
  | 'cyber-dark'
  | 'matrix-green'
  | 'neon-violet'
  | 'solar-gold'
  | 'midnight-void'
  | 'sakura-cyber'
  | 'crimson-overclock';

export type Avatar3DModel = 'hectron-miku' | 'cyber-holo' | 'mech-prime' | 'chibi-core';
export type UserRole = 'creator' | 'lead_dev' | 'vip_moderator' | 'director' | 'guest' | 'custom';

export interface UserProfileCustomization {
  avatarModel: Avatar3DModel;
  avatarHue: number; // 0 to 360
  glowIntensity: number; // 0.5 to 3.0
  auraEffect: AuraEffect;
  theme: ThemeColorPreset;
  geminiVoice: GeminiVoiceName;
  voicePitch: number;
  voiceSpeed: number;
  expressiveness: TtsExpressiveness;
  voicePresetGreeting: string;
  responseStyle: 'ENERGETIC' | 'SARCASTIC' | 'KAWAII' | 'TECHNICAL' | 'PHILOSOPHER';
  defaultScene: SceneName;
  soundEffectsEnabled: boolean;
  autoSaveMinutes: number;
  streamTags: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  tier: 'Free' | 'Pro Streamer' | 'Enterprise AI' | 'Quantum Elite';
  bio: string;
  badge: string;
  cyberCoins: number;
  level: number;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  customization: UserProfileCustomization;
  permissions: {
    canControlObs: boolean;
    canRunTerminal: boolean;
    canTriggerAutonomy: boolean;
    canManageInventory: boolean;
    canExportReports: boolean;
    canManageProfiles: boolean;
    canModerateEngagement: boolean;
  };
}

// ==========================================
// INTERACTIVE AUDIENCE ENGAGEMENT TYPES
// ==========================================
export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voterHandles: string[];
}

export interface LivePoll {
  id: string;
  question: string;
  options: PollOption[];
  status: 'ACTIVE' | 'ENDED' | 'DRAFT';
  createdAt: string;
  durationSeconds: number;
  remainingSeconds: number;
  totalVotes: number;
  winnerOptionId?: string;
  aiWinnerAnalysis?: string;
  pointsReward: number;
}

export type QuestionStatus = 'PENDING' | 'ANSWERING' | 'ANSWERED' | 'REJECTED';

export interface AudienceQuestion {
  id: string;
  senderName: string;
  senderAvatar?: string;
  senderHandle: string;
  question: string;
  timestamp: string;
  status: QuestionStatus;
  upvotes: number;
  aiAnswer?: string;
  aiEmotion?: Emotion;
  answeredAt?: string;
}

export interface TriviaQuestion {
  id: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  coinsReward: number;
  xpReward: number;
}

export interface TriviaGameState {
  active: boolean;
  currentQuestion: TriviaQuestion | null;
  selectedOptionIndex: number | null;
  timeRemainingSeconds: number;
  answered: boolean;
  isCorrect: boolean | null;
  score: number;
  streak: number;
  totalAnswered: number;
  aiCommentary?: string;
}

export interface FortuneWheelPrize {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  icon: string;
  type: 'COINS' | 'XP' | 'SCENE_SWITCH' | 'SPECIAL_EMOTE' | 'VIP_SHOUTOUT' | 'HYPE_BURST' | 'JACKPOT';
  value: any;
  probabilityWeight: number;
}

export interface WheelSpinResult {
  prize: FortuneWheelPrize;
  timestamp: string;
  spunBy: string;
}

export interface HypeBattleState {
  active: boolean;
  teamCyanHype: number;
  teamFireHype: number;
  targetHype: number;
  durationSeconds: number;
  remainingSeconds: number;
  winnerTeam?: 'CYAN' | 'FIRE' | 'DRAW';
  totalClicks: number;
}

export interface WordGuessState {
  active: boolean;
  word: string;
  category: string;
  hint: string;
  guessedLetters: string[];
  maxWrongAttempts: number;
  wrongAttemptsCount: number;
  solved: boolean;
  failed: boolean;
  coinsReward: number;
}



