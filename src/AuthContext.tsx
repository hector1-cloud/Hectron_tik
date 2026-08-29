import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole = "creator" | "lead_dev" | "vip_moderator" | "director" | "guest";

export interface UserSession {
  id: string;
  name: string;
  handle: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  tier: "Free" | "Pro Streamer" | "Enterprise AI" | "Quantum Elite";
  cyberCoins: number;
  loginTimestamp: number;
  lastActiveTab: string;
  token: string;
  permissions: {
    canControlObs: boolean;
    canRunTerminal: boolean;
    canTriggerAutonomy: boolean;
    canManageInventory: boolean;
    canExportReports: boolean;
  };
  preferences: {
    theme: "cyber-dark" | "matrix-green" | "neon-violet";
    autoSaveIntervalMinutes: number;
    voiceFeedbackEnabled: boolean;
    streamOverlayTransparent: boolean;
    activeScenePreset: string;
  };
}

export interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData?: Partial<UserSession>) => void;
  logout: () => void;
  updateUser: (updates: Partial<UserSession>) => void;
  updatePreferences: (preferences: Partial<UserSession["preferences"]>) => void;
  saveActiveTab: (tabName: string) => void;
  switchRole: (role: UserRole) => void;
  presetProfiles: Array<{ id: string; name: string; handle: string; role: UserRole; avatar: string; description: string }>;
}

const STORAGE_KEY = "hectron_auth_session_v1";

const DEFAULT_PROFILES: Array<{ id: string; name: string; handle: string; role: UserRole; avatar: string; description: string }> = [
  {
    id: "usr_hectron_creator",
    name: "Hector Ruiz (Hectron)",
    handle: "@hectron_universe",
    role: "creator",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    description: "Streamer Principal y Creador del Núcleo IA Hectron Studio.",
  },
  {
    id: "usr_lead_developer",
    name: "Alex Vance (Lead Arch)",
    handle: "@vance_dev",
    role: "lead_dev",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    description: "Acceso total a Terminal Linux, BigQuery, Workflows y Cloud APIs.",
  },
  {
    id: "usr_vip_mod",
    name: "Nova Cyber (VIP Mod)",
    handle: "@nova_stream",
    role: "vip_moderator",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    description: "Moderación de TikTok Live, Control de Emociones y Chats.",
  },
  {
    id: "usr_director",
    name: "Elena Rostova (Executive)",
    handle: "@elena_director",
    role: "director",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    description: "Auditoría Enterprise, Métricas Financieras y Analítica en Vivo.",
  },
];

const createDefaultSession = (override?: Partial<UserSession>): UserSession => {
  return {
    id: override?.id || "usr_hectron_creator",
    name: override?.name || "Hector Ruiz (Hectron)",
    handle: override?.handle || "@hectron_universe",
    email: override?.email || "hectorruiz9992@gmail.com",
    role: override?.role || "creator",
    avatarUrl: override?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    tier: override?.tier || "Quantum Elite",
    cyberCoins: override?.cyberCoins ?? 2082,
    loginTimestamp: Date.now(),
    lastActiveTab: override?.lastActiveTab || "dashboard",
    token: "hct_live_" + Math.random().toString(36).substring(2, 15),
    permissions: {
      canControlObs: true,
      canRunTerminal: true,
      canTriggerAutonomy: true,
      canManageInventory: true,
      canExportReports: true,
    },
    preferences: {
      theme: "cyber-dark",
      autoSaveIntervalMinutes: 5,
      voiceFeedbackEnabled: true,
      streamOverlayTransparent: true,
      activeScenePreset: "DEFAULT",
    },
    ...override,
  };
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  updatePreferences: () => {},
  saveActiveTab: () => {},
  switchRole: () => {},
  presetProfiles: DEFAULT_PROFILES,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Retrieve user session on mount from localStorage
  useEffect(() => {
    try {
      const savedSessionRaw = localStorage.getItem(STORAGE_KEY);
      if (savedSessionRaw) {
        const parsed = JSON.parse(savedSessionRaw) as UserSession;
        if (parsed && parsed.id) {
          setUser(parsed);
        } else {
          const initial = createDefaultSession();
          setUser(initial);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        }
      } else {
        const initial = createDefaultSession();
        setUser(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch (e) {
      console.warn("[Auth] Error reading user session from localStorage, fallback to default", e);
      const initial = createDefaultSession();
      setUser(initial);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync state changes to localStorage
  const persistSession = useCallback((updatedUser: UserSession | null) => {
    if (updatedUser) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      } catch (err) {
        console.warn("[Auth] Failed to persist session to localStorage", err);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback((userData?: Partial<UserSession>) => {
    const newSession = createDefaultSession(userData);
    setUser(newSession);
    persistSession(newSession);
  }, [persistSession]);

  const logout = useCallback(() => {
    setUser(null);
    persistSession(null);
  }, [persistSession]);

  const updateUser = useCallback((updates: Partial<UserSession>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged: UserSession = {
        ...prev,
        ...updates,
      };
      persistSession(merged);
      return merged;
    });
  }, [persistSession]);

  const updatePreferences = useCallback((preferencesUpdates: Partial<UserSession["preferences"]>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged: UserSession = {
        ...prev,
        preferences: {
          ...prev.preferences,
          ...preferencesUpdates,
        },
      };
      persistSession(merged);
      return merged;
    });
  }, [persistSession]);

  const saveActiveTab = useCallback((tabName: string) => {
    setUser((prev) => {
      if (!prev || prev.lastActiveTab === tabName) return prev;
      const merged: UserSession = {
        ...prev,
        lastActiveTab: tabName,
      };
      persistSession(merged);
      return merged;
    });
  }, [persistSession]);

  const switchRole = useCallback((role: UserRole) => {
    const profile = DEFAULT_PROFILES.find((p) => p.role === role) || DEFAULT_PROFILES[0];
    setUser((prev) => {
      const merged: UserSession = {
        ...(prev || createDefaultSession()),
        id: profile.id,
        name: profile.name,
        handle: profile.handle,
        role: profile.role,
        avatarUrl: profile.avatar,
      };
      persistSession(merged);
      return merged;
    });
  }, [persistSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        updatePreferences,
        saveActiveTab,
        switchRole,
        presetProfiles: DEFAULT_PROFILES,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
