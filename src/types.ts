export type Emotion = 'HAPPY' | 'SAD' | 'ANGRY' | 'SURPRISE' | 'FLIRT' | 'IDLE';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
export type LogScope = 'SERVER' | 'FRONTEND' | 'AGENT' | 'TIKTOK' | '3D' | 'WORKFLOW';

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
  isAutonomous: boolean;
  setIsAutonomous: (val: boolean) => void;
  tiktokConnected: boolean;
  setTiktokConnected: (val: boolean) => void;
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  activeTab: 'dashboard' | 'overlay' | 'agent' | 'tiktok' | 'logs' | 'performance' | 'autonomy' | 'workers-ai' | 'workflows' | 'executive';
  setActiveTab: (tab: 'dashboard' | 'overlay' | 'agent' | 'tiktok' | 'logs' | 'performance' | 'autonomy' | 'workers-ai' | 'workflows' | 'executive') => void;
  speakText: (text: string, emotion?: Emotion) => Promise<void>;
  latestSpeechText: string;
  isSpeaking: boolean;
  logs: LogEntry[];
  addLog: (level: LogLevel, scope: LogScope, message: string, details?: any) => void;
  clearLogs: () => void;
  lodLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  setLodLevel: (lod: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  fps: number;
}

