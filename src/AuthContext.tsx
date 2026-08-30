import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  UserProfile,
  UserProfileCustomization,
  UserRole,
  ThemeColorPreset,
  Avatar3DModel,
  AuraEffect,
  GeminiVoiceName,
  TtsExpressiveness,
  SceneName,
} from "./types";

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
    canManageProfiles: boolean;
    canModerateEngagement: boolean;
  };
  preferences: {
    theme: ThemeColorPreset;
    autoSaveIntervalMinutes: number;
    voiceFeedbackEnabled: boolean;
    streamOverlayTransparent: boolean;
    activeScenePreset: string;
  };
}

export interface AuthContextType {
  user: UserSession | null;
  activeProfile: UserProfile | null;
  profiles: UserProfile[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData?: Partial<UserSession>) => void;
  logout: () => void;
  updateUser: (updates: Partial<UserSession>) => void;
  updatePreferences: (preferences: Partial<UserSession["preferences"]>) => void;
  saveActiveTab: (tabName: string) => void;
  switchRole: (role: UserRole) => void;
  presetProfiles: Array<{ id: string; name: string; handle: string; role: UserRole; avatar: string; description: string }>;
  
  // Advanced Multi-Profile Management
  createProfile: (profileData?: Partial<UserProfile>) => UserProfile;
  updateProfile: (profileId: string, updates: Partial<UserProfile>) => void;
  selectProfile: (profileId: string) => void;
  duplicateProfile: (profileId: string) => UserProfile;
  deleteProfile: (profileId: string) => boolean;
  exportProfileJSON: (profileId?: string) => string;
  importProfileJSON: (jsonString: string) => { success: boolean; message: string; profile?: UserProfile };
  resetProfileToDefaults: (profileId: string) => void;
}

const STORAGE_SESSION_KEY = "hectron_auth_session_v1";
const STORAGE_PROFILES_KEY = "hectron_user_profiles_v1";
const STORAGE_ACTIVE_PROFILE_ID_KEY = "hectron_active_profile_id_v1";

const DEFAULT_CUSTOMIZATION: UserProfileCustomization = {
  avatarModel: "hectron-miku",
  avatarHue: 180,
  glowIntensity: 1.5,
  auraEffect: "CYAN_NEON",
  theme: "cyber-dark",
  geminiVoice: "Kore",
  voicePitch: 1.05,
  voiceSpeed: 1.05,
  expressiveness: "cheerful",
  voicePresetGreeting: "¡Hola a todos en la transmisión cuántica! Soy Hectron, listos para streamear.",
  responseStyle: "ENERGETIC",
  defaultScene: "DEFAULT",
  soundEffectsEnabled: true,
  autoSaveMinutes: 5,
  streamTags: ["TikTokLive", "VTuber", "AIStreamer", "HectronUniverse", "Cyberpunk"],
};

export const INITIAL_PRESET_PROFILES: UserProfile[] = [
  {
    id: "usr_hectron_creator",
    name: "Hector Ruiz (Hectron)",
    handle: "@hectron_universe",
    email: "hectorruiz9992@gmail.com",
    role: "creator",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    tier: "Quantum Elite",
    bio: "Streamer Principal y Creador del Núcleo IA Hectron Studio.",
    badge: "🌟 Creador Prime",
    cyberCoins: 2850,
    level: 12,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
    isDefault: true,
    customization: {
      ...DEFAULT_CUSTOMIZATION,
      avatarModel: "hectron-miku",
      auraEffect: "CYAN_NEON",
      theme: "cyber-dark",
      geminiVoice: "Kore",
      voicePresetGreeting: "¡Bienvenidos a la señal cuántica de Hectron Universe!",
    },
    permissions: {
      canControlObs: true,
      canRunTerminal: true,
      canTriggerAutonomy: true,
      canManageInventory: true,
      canExportReports: true,
      canManageProfiles: true,
      canModerateEngagement: true,
    },
  },
  {
    id: "usr_lead_developer",
    name: "Alex Vance (Lead Arch)",
    handle: "@vance_dev",
    email: "alex.vance@hectron.ai",
    role: "lead_dev",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    tier: "Enterprise AI",
    bio: "Acceso total a Terminal Linux, BigQuery, Workflows y Cloud APIs.",
    badge: "🛠️ Lead Architect",
    cyberCoins: 1950,
    level: 9,
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
    customization: {
      ...DEFAULT_CUSTOMIZATION,
      avatarModel: "mech-prime",
      auraEffect: "PRISMATIC_RAINBOW",
      theme: "matrix-green",
      geminiVoice: "Fenrir",
      voicePresetGreeting: "Terminal de comando en línea. Sistemas de desarrollo listos.",
      responseStyle: "TECHNICAL",
    },
    permissions: {
      canControlObs: true,
      canRunTerminal: true,
      canTriggerAutonomy: true,
      canManageInventory: true,
      canExportReports: true,
      canManageProfiles: true,
      canModerateEngagement: true,
    },
  },
  {
    id: "usr_vip_mod",
    name: "Nova Cyber (VIP Mod)",
    handle: "@nova_stream",
    email: "nova.mod@tiktok.live",
    role: "vip_moderator",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    tier: "Pro Streamer",
    bio: "Moderación de TikTok Live, Control de Emociones, Encuestas y Mini-Juegos.",
    badge: "🛡️ VIP Moderator",
    cyberCoins: 1400,
    level: 7,
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
    customization: {
      ...DEFAULT_CUSTOMIZATION,
      avatarModel: "cyber-holo",
      auraEffect: "STARLIGHT_SPARKLES",
      theme: "neon-violet",
      geminiVoice: "Aoede",
      voicePresetGreeting: "¡Modo fiesta y moderación activo! Saludos a toda la comunidad.",
      responseStyle: "KAWAII",
    },
    permissions: {
      canControlObs: true,
      canRunTerminal: false,
      canTriggerAutonomy: true,
      canManageInventory: true,
      canExportReports: false,
      canManageProfiles: false,
      canModerateEngagement: true,
    },
  },
  {
    id: "usr_director",
    name: "Elena Rostova (Executive)",
    handle: "@elena_director",
    email: "elena.exec@studio.corp",
    role: "director",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    tier: "Quantum Elite",
    bio: "Auditoría Enterprise, Métricas Financieras y Analítica en Vivo.",
    badge: "👑 Executive Director",
    cyberCoins: 3500,
    level: 15,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
    customization: {
      ...DEFAULT_CUSTOMIZATION,
      avatarModel: "chibi-core",
      auraEffect: "GOLDEN_GLOW",
      theme: "solar-gold",
      geminiVoice: "Leda",
      voicePresetGreeting: "Iniciando panel directivo. Analítica y control global en curso.",
      responseStyle: "PHILOSOPHER",
    },
    permissions: {
      canControlObs: true,
      canRunTerminal: true,
      canTriggerAutonomy: true,
      canManageInventory: true,
      canExportReports: true,
      canManageProfiles: true,
      canModerateEngagement: true,
    },
  },
];

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const savedRaw = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("[Auth] Error reading profiles from localStorage", e);
    }
    return INITIAL_PRESET_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_PROFILE_ID_KEY);
      if (saved) return saved;
    } catch {}
    return "usr_hectron_creator";
  });

  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync active profile into user session
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || INITIAL_PRESET_PROFILES[0];

  const syncUserFromProfile = useCallback((profile: UserProfile, lastActiveTabOverride?: string) => {
    const session: UserSession = {
      id: profile.id,
      name: profile.name,
      handle: profile.handle,
      email: profile.email,
      role: profile.role,
      avatarUrl: profile.avatarUrl,
      tier: profile.tier,
      cyberCoins: profile.cyberCoins,
      loginTimestamp: Date.now(),
      lastActiveTab: lastActiveTabOverride || "dashboard",
      token: "hct_live_" + Math.random().toString(36).substring(2, 15),
      permissions: { ...profile.permissions },
      preferences: {
        theme: profile.customization?.theme || "cyber-dark",
        autoSaveIntervalMinutes: profile.customization?.autoSaveMinutes || 5,
        voiceFeedbackEnabled: true,
        streamOverlayTransparent: true,
        activeScenePreset: profile.customization?.defaultScene || "DEFAULT",
      },
    };
    setUser(session);
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    } catch (err) {
      console.warn("[Auth] Error persisting session", err);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    try {
      const savedSessionRaw = localStorage.getItem(STORAGE_SESSION_KEY);
      let tab = "dashboard";
      if (savedSessionRaw) {
        const parsed = JSON.parse(savedSessionRaw);
        if (parsed?.lastActiveTab) tab = parsed.lastActiveTab;
      }
      syncUserFromProfile(activeProfile, tab);
    } catch (e) {
      syncUserFromProfile(INITIAL_PRESET_PROFILES[0]);
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile, syncUserFromProfile]);

  // Persist profiles whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.warn("[Auth] Failed to persist profiles list", e);
    }
  }, [profiles]);

  // Persist active profile ID
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_PROFILE_ID_KEY, activeProfileId);
    } catch (e) {}
  }, [activeProfileId]);

  const selectProfile = useCallback(
    (profileId: string) => {
      const target = profiles.find((p) => p.id === profileId);
      if (target) {
        setActiveProfileId(target.id);
        syncUserFromProfile(target, user?.lastActiveTab);
      }
    },
    [profiles, syncUserFromProfile, user?.lastActiveTab]
  );

  const createProfile = useCallback(
    (profileData?: Partial<UserProfile>): UserProfile => {
      const newId = "usr_" + Math.random().toString(36).substring(2, 9);
      const newProfile: UserProfile = {
        id: newId,
        name: profileData?.name || "Nuevo Streamer Virtual",
        handle: profileData?.handle || `@streamer_${Math.floor(Math.random() * 900 + 100)}`,
        email: profileData?.email || "streamer@hectron.universe",
        role: profileData?.role || "creator",
        avatarUrl:
          profileData?.avatarUrl ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        tier: profileData?.tier || "Pro Streamer",
        bio: profileData?.bio || "Perfil personalizado de streamer con configuración y preferencias dedicadas.",
        badge: profileData?.badge || "✨ Streamer Personalizado",
        cyberCoins: profileData?.cyberCoins ?? 1000,
        level: profileData?.level ?? 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customization: {
          ...DEFAULT_CUSTOMIZATION,
          ...(profileData?.customization || {}),
        },
        permissions: {
          canControlObs: true,
          canRunTerminal: true,
          canTriggerAutonomy: true,
          canManageInventory: true,
          canExportReports: true,
          canManageProfiles: true,
          canModerateEngagement: true,
          ...(profileData?.permissions || {}),
        },
      };

      setProfiles((prev) => [...prev, newProfile]);
      setActiveProfileId(newProfile.id);
      syncUserFromProfile(newProfile);
      return newProfile;
    },
    [syncUserFromProfile]
  );

  const updateProfile = useCallback(
    (profileId: string, updates: Partial<UserProfile>) => {
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== profileId) return p;
          const updated: UserProfile = {
            ...p,
            ...updates,
            customization: {
              ...p.customization,
              ...(updates.customization || {}),
            },
            permissions: {
              ...p.permissions,
              ...(updates.permissions || {}),
            },
            updatedAt: new Date().toISOString(),
          };
          if (profileId === activeProfileId) {
            syncUserFromProfile(updated, user?.lastActiveTab);
          }
          return updated;
        })
      );
    },
    [activeProfileId, syncUserFromProfile, user?.lastActiveTab]
  );

  const duplicateProfile = useCallback(
    (profileId: string): UserProfile => {
      const source = profiles.find((p) => p.id === profileId) || activeProfile;
      const clonedId = "usr_" + Math.random().toString(36).substring(2, 9);
      const clonedProfile: UserProfile = {
        ...source,
        id: clonedId,
        name: `${source.name} (Copia)`,
        handle: `${source.handle}_copy`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false,
        customization: {
          ...source.customization,
        },
        permissions: {
          ...source.permissions,
        },
      };

      setProfiles((prev) => [...prev, clonedProfile]);
      setActiveProfileId(clonedProfile.id);
      syncUserFromProfile(clonedProfile);
      return clonedProfile;
    },
    [profiles, activeProfile, syncUserFromProfile]
  );

  const deleteProfile = useCallback(
    (profileId: string): boolean => {
      if (profiles.length <= 1) {
        return false; // Prevent deleting the only profile
      }
      setProfiles((prev) => {
        const filtered = prev.filter((p) => p.id !== profileId);
        if (activeProfileId === profileId && filtered.length > 0) {
          const fallback = filtered[0];
          setActiveProfileId(fallback.id);
          syncUserFromProfile(fallback);
        }
        return filtered;
      });
      return true;
    },
    [profiles.length, activeProfileId, syncUserFromProfile]
  );

  const exportProfileJSON = useCallback(
    (profileId?: string): string => {
      const target = profiles.find((p) => p.id === (profileId || activeProfileId)) || activeProfile;
      return JSON.stringify(target, null, 2);
    },
    [profiles, activeProfileId, activeProfile]
  );

  const importProfileJSON = useCallback(
    (jsonString: string): { success: boolean; message: string; profile?: UserProfile } => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || !parsed.name) {
          return { success: false, message: "JSON de perfil inválido: falta el campo 'name'." };
        }
        const importedId = "usr_" + Math.random().toString(36).substring(2, 9);
        const newProfile: UserProfile = {
          ...parsed,
          id: importedId,
          name: parsed.name,
          handle: parsed.handle || `@import_${Math.floor(Math.random() * 900)}`,
          customization: {
            ...DEFAULT_CUSTOMIZATION,
            ...(parsed.customization || {}),
          },
          permissions: {
            canControlObs: true,
            canRunTerminal: true,
            canTriggerAutonomy: true,
            canManageInventory: true,
            canExportReports: true,
            canManageProfiles: true,
            canModerateEngagement: true,
            ...(parsed.permissions || {}),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDefault: false,
        };

        setProfiles((prev) => [...prev, newProfile]);
        setActiveProfileId(newProfile.id);
        syncUserFromProfile(newProfile);
        return { success: true, message: `Perfil "${newProfile.name}" importado exitosamente.`, profile: newProfile };
      } catch (err: any) {
        return { success: false, message: `Error al importar JSON: ${err.message}` };
      }
    },
    [syncUserFromProfile]
  );

  const resetProfileToDefaults = useCallback(
    (profileId: string) => {
      const preset = INITIAL_PRESET_PROFILES.find((p) => p.id === profileId) || INITIAL_PRESET_PROFILES[0];
      updateProfile(profileId, {
        ...preset,
        id: profileId,
        updatedAt: new Date().toISOString(),
      });
    },
    [updateProfile]
  );

  // Backward compatible user methods
  const login = useCallback(
    (userData?: Partial<UserSession>) => {
      if (userData?.id) {
        selectProfile(userData.id);
      } else {
        selectProfile("usr_hectron_creator");
      }
    },
    [selectProfile]
  );

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {}
  }, []);

  const updateUser = useCallback(
    (updates: Partial<UserSession>) => {
      setUser((prev) => {
        if (!prev) return null;
        const merged = { ...prev, ...updates };
        try {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      });
      if (activeProfileId) {
        updateProfile(activeProfileId, {
          name: updates.name,
          handle: updates.handle,
          email: updates.email,
          role: updates.role,
          avatarUrl: updates.avatarUrl,
          tier: updates.tier,
          cyberCoins: updates.cyberCoins,
        });
      }
    },
    [activeProfileId, updateProfile]
  );

  const updatePreferences = useCallback(
    (preferencesUpdates: Partial<UserSession["preferences"]>) => {
      setUser((prev) => {
        if (!prev) return null;
        const merged = {
          ...prev,
          preferences: { ...prev.preferences, ...preferencesUpdates },
        };
        try {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      });
      if (activeProfileId) {
        updateProfile(activeProfileId, {
          customization: {
            ...activeProfile.customization,
            theme: preferencesUpdates.theme || activeProfile.customization.theme,
            autoSaveMinutes: preferencesUpdates.autoSaveIntervalMinutes || activeProfile.customization.autoSaveMinutes,
            defaultScene: preferencesUpdates.activeScenePreset || activeProfile.customization.defaultScene,
          },
        });
      }
    },
    [activeProfileId, activeProfile, updateProfile]
  );

  const saveActiveTab = useCallback((tabName: string) => {
    setUser((prev) => {
      if (!prev || prev.lastActiveTab === tabName) return prev;
      const merged = { ...prev, lastActiveTab: tabName };
      try {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }, []);

  const switchRole = useCallback(
    (role: UserRole) => {
      const match = profiles.find((p) => p.role === role) || INITIAL_PRESET_PROFILES.find((p) => p.role === role);
      if (match) {
        selectProfile(match.id);
      }
    },
    [profiles, selectProfile]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProfile,
        profiles,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        updatePreferences,
        saveActiveTab,
        switchRole,
        presetProfiles: profiles.map((p) => ({
          id: p.id,
          name: p.name,
          handle: p.handle,
          role: p.role,
          avatar: p.avatarUrl,
          description: p.bio,
        })),
        createProfile,
        updateProfile,
        selectProfile,
        duplicateProfile,
        deleteProfile,
        exportProfileJSON,
        importProfileJSON,
        resetProfileToDefaults,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

