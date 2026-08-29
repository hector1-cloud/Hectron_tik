import React, { useState, useContext, useMemo } from "react";
import { BrainContext } from "../BrainContext";
import {
  Box,
  Layers,
  Sparkles,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Download,
  Trash2,
  Sliders,
  Maximize2,
  Zap,
  RotateCw,
  Sun,
  Shield,
  Palette,
  Compass,
  Monitor,
  Camera,
  FolderOpen,
  Plus,
  RefreshCw,
  Info,
  Check,
} from "lucide-react";

export type AssetCategory =
  | "all"
  | "environments"
  | "avatars"
  | "props"
  | "vfx"
  | "lighting_cameras";

export interface Asset3DItem {
  id: string;
  name: string;
  category: "environments" | "avatars" | "props" | "vfx" | "lighting_cameras";
  subcategory: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "QUANTUM";
  format: "GLB" | "GLTF" | "THREE_PROCEDURAL" | "CUSTOM_SHADER";
  polyCount: string;
  fileSize: string;
  thumbnailUrl: string;
  description: string;
  isLoaded: boolean;
  tags: string[];
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    intensity?: number;
    color?: string;
  };
  features: string[];
}

const INITIAL_3D_ASSETS: Asset3DItem[] = [
  // --- ENVIRONMENTS ---
  {
    id: "env_cyberpunk_neon",
    name: "Cyberpunk Studio Penthouse 2088",
    category: "environments",
    subcategory: "Estudio Virtual",
    rarity: "LEGENDARY",
    format: "GLB",
    polyCount: "42.5K Quads",
    fileSize: "18.4 MB",
    thumbnailUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    description: "Estudio flotante de alta tecnología con ventanales a rascacielos neón, pantallas holográficas y lluvia exterior reactiva.",
    isLoaded: true,
    tags: ["cyberpunk", "studio", "neon", "rain", "penthouse"],
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1.0, intensity: 1.2, color: "#00e1ff" },
    features: ["PBR Materials", "Reflexiones SSR", "Luces Volumétricas", "Audio Reactivo"],
  },
  {
    id: "env_sakura_zen",
    name: "Templo Zen & Jardín Sakura Flotante",
    category: "environments",
    subcategory: "Naturaleza Espiritual",
    rarity: "EPIC",
    format: "GLB",
    polyCount: "35.2K Quads",
    fileSize: "14.2 MB",
    thumbnailUrl: "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=600&auto=format&fit=crop&q=80",
    description: "Paisaje místico con cerezos en flor interactivos, linternas de piedra flotantes y puente sobre río de energía.",
    isLoaded: false,
    tags: ["zen", "japan", "sakura", "temple", "peaceful"],
    transform: { position: [0, -0.5, 0], rotation: [0, 45, 0], scale: 1.0, intensity: 0.9, color: "#ff80df" },
    features: ["Hojas Cayendo con Física", "Agua Shader Realtime", "Ciclo Día/Noche"],
  },
  {
    id: "env_quantum_void",
    name: "Cámara Cuántica del Vacío Hectron",
    category: "environments",
    subcategory: "Sci-Fi Abstracción",
    rarity: "QUANTUM",
    format: "CUSTOM_SHADER",
    polyCount: "12.8K Triangles",
    fileSize: "4.8 MB",
    thumbnailUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
    description: "Espacio dimensional abstracto generado por raymarching y fractales con pulso sincronizado al TTS de Miku.",
    isLoaded: false,
    tags: ["quantum", "abstract", "fractal", "void", "raymarching"],
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1.0, intensity: 1.5, color: "#8a2be2" },
    features: ["Procedural WebGL 2.0", "GPU Instancing", "Zero VRAM Waste"],
  },

  // --- AVATARS & COMPANIONS ---
  {
    id: "av_miku_holo",
    name: "Miku Cyber-Diva Prime (V4.2)",
    category: "avatars",
    subcategory: "Avatar Principal",
    rarity: "LEGENDARY",
    format: "GLB",
    polyCount: "68.4K Quads",
    fileSize: "28.5 MB",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    description: "Modelo oficial de Miku con 52 Blendshapes faciales para sincronización labial fonética milimétrica y dinámicas capilares.",
    isLoaded: true,
    tags: ["miku", "vocaloid", "lipsync", "blendshapes", "host"],
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1.0, intensity: 1.0 },
    features: ["52 ARKit Blendshapes", "Spring Physics Tails", "Shader Cel-Shaded"],
  },
  {
    id: "av_chibi_drone",
    name: "Hectron Orbit Drone Companion",
    category: "avatars",
    subcategory: "Mascota Flotante",
    rarity: "RARE",
    format: "THREE_PROCEDURAL",
    polyCount: "8.6K Quads",
    fileSize: "2.1 MB",
    thumbnailUrl: "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=600&auto=format&fit=crop&q=80",
    description: "Dron asistente flotante que reacciona a los regalos y mensajes VIP de TikTok proyectando hologramas en vivo.",
    isLoaded: true,
    tags: ["drone", "pet", "companion", "floating", "ai"],
    transform: { position: [1.2, 1.4, -0.4], rotation: [0, -30, 0], scale: 0.45, intensity: 1.3, color: "#00ffcc" },
    features: ["Órbita Cinemática", "Luz de Acompañamiento", "Emote Reactivo"],
  },

  // --- PROPS & FURNITURE ---
  {
    id: "prop_holographic_desk",
    name: "Escritorio Holográfico Streamer Pro",
    category: "props",
    subcategory: "Mobiliario Gamer",
    rarity: "EPIC",
    format: "GLB",
    polyCount: "16.2K Quads",
    fileSize: "6.7 MB",
    thumbnailUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop&q=80",
    description: "Mesa flotante de fibra de carbono con monitores curvos virtuales que renderizan el chat de TikTok en tiempo real.",
    isLoaded: true,
    tags: ["desk", "streaming", "monitors", "carbon", "setup"],
    transform: { position: [0, -0.2, 0.4], rotation: [0, 0, 0], scale: 0.9, intensity: 1.1, color: "#3b82f6" },
    features: ["Monitores con Canvas Textura", "Tira LED Programable", "Glow Dinámico"],
  },
  {
    id: "prop_arcade_cabinet",
    name: "Cabina Arcade Cyber-Retro 1999",
    category: "props",
    subcategory: "Interactivos 3D",
    rarity: "RARE",
    format: "GLB",
    polyCount: "11.5K Quads",
    fileSize: "5.3 MB",
    thumbnailUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
    description: "Máquina recreativa retro con marquesina animada y pantalla CRT funcional para minijuegos interactivos.",
    isLoaded: false,
    tags: ["arcade", "retro", "minigame", "cabinet", "crt"],
    transform: { position: [-2.1, 0, -0.8], rotation: [0, 25, 0], scale: 1.0, intensity: 1.0, color: "#f59e0b" },
    features: ["Shader CRT Scanline", "Audio 8-Bit Integrado", "Clickable Trigger"],
  },
  {
    id: "prop_cyber_crown",
    name: "Corona Cuántica de Streamer Legendaria",
    category: "props",
    subcategory: "Accesorios de Cabeza",
    rarity: "QUANTUM",
    format: "THREE_PROCEDURAL",
    polyCount: "9.2K Quads",
    fileSize: "1.8 MB",
    thumbnailUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80",
    description: "Corona que flota magnéticamente sobre la cabeza de Miku con cristales giratorios que emiten partículas doradas.",
    isLoaded: false,
    tags: ["crown", "accessory", "golden", "vip", "particles"],
    transform: { position: [0, 1.85, 0], rotation: [0, 0, 0], scale: 0.35, intensity: 2.0, color: "#fbbf24" },
    features: ["Efecto de Levigación", "Partículas GPU Gold", "Brillo HDR"],
  },

  // --- VFX & PARTICLES ---
  {
    id: "vfx_matrix_rain",
    name: "Lluvia de Código Matrix Realtime",
    category: "vfx",
    subcategory: "Efectos Ambientales",
    rarity: "EPIC",
    format: "CUSTOM_SHADER",
    polyCount: "Procedural",
    fileSize: "850 KB",
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    description: "Glifos digitales verdes cayendo en 3D con colisión contra el suelo del estudio y velocidad ajustable.",
    isLoaded: false,
    tags: ["matrix", "rain", "code", "green", "shader"],
    transform: { position: [0, 3.0, 0], rotation: [0, 0, 0], scale: 1.0, intensity: 1.4, color: "#10b981" },
    features: ["10,000 Partículas GPU", "Modo Reactivo al Chat", "Shader Unlit"],
  },
  {
    id: "vfx_aurora_borealis",
    name: "Vórtice de Aurora Prismática 3D",
    category: "vfx",
    subcategory: "Atmósfera Celestial",
    rarity: "LEGENDARY",
    format: "CUSTOM_SHADER",
    polyCount: "Procedural",
    fileSize: "1.2 MB",
    thumbnailUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&auto=format&fit=crop&q=80",
    description: "Ondas de luz prismáticas fluidas que iluminan volumétricamente el escenario al alcanzar hitos de Likes.",
    isLoaded: true,
    tags: ["aurora", "vortex", "rainbow", "vfx", "atmosphere"],
    transform: { position: [0, 2.5, -2.0], rotation: [15, 0, 0], scale: 1.5, intensity: 1.6, color: "#8b5cf6" },
    features: ["Niebla Volumétrica", "Curvas Bezier Dinámicas", "Modo Súper Hype"],
  },

  // --- LIGHTING & CAMERAS ---
  {
    id: "cam_cinematic_orbit",
    name: "Rig de Cámara Orbital Cinemática 4K",
    category: "lighting_cameras",
    subcategory: "Dirección de Cámara",
    rarity: "RARE",
    format: "THREE_PROCEDURAL",
    polyCount: "Control Rig",
    fileSize: "400 KB",
    thumbnailUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    description: "Cámara inteligente que enfoca dinámicamente las expresiones de Miku y cambia de ángulo con transiciones suaves.",
    isLoaded: true,
    tags: ["camera", "orbit", "cinematic", "director", "smooth"],
    transform: { position: [0, 1.2, 3.8], rotation: [0, 0, 0], scale: 1.0, intensity: 1.0 },
    features: ["Tracking Facial Automático", "Profundidad de Campo Bokeh", "Transición de 60fps"],
  },
  {
    id: "light_cyber_triad",
    name: "Sistema de Iluminación 3 Puntos Cyberpunk",
    category: "lighting_cameras",
    subcategory: "Iluminación de Estudio",
    rarity: "EPIC",
    format: "THREE_PROCEDURAL",
    polyCount: "Luz Key/Fill/Rim",
    fileSize: "300 KB",
    thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    description: "Key light cian (#00e1ff), Rim light fucsia (#ff007f) y Fill light azul profundo con sombras suaves por PCF.",
    isLoaded: true,
    tags: ["lighting", "three-point", "rim-light", "cyber-glow", "shadows"],
    transform: { position: [0, 2.5, 2.0], rotation: [45, 30, 0], scale: 1.0, intensity: 1.8, color: "#00e1ff" },
    features: ["Sombras Suaves 2048px", "Color Temperature Control", "Strobe para Donaciones"],
  },
];

export function Studio3DTab() {
  const { soundEffect, speakText } = useContext(BrainContext);
  const [assets, setAssets] = useState<Asset3DItem[]>(INITIAL_3D_ASSETS);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>("all");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterLoadedOnly, setFilterLoadedOnly] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset3DItem | null>(INITIAL_3D_ASSETS[0]);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (selectedRarity !== "all" && item.rarity !== selectedRarity) return false;
      if (filterLoadedOnly && !item.isLoaded) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        const matchesSub = item.subcategory.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesTags && !matchesSub) return false;
      }
      return true;
    });
  }, [assets, selectedCategory, selectedRarity, filterLoadedOnly, searchQuery]);

  // Loaded Assets count
  const loadedCount = useMemo(() => assets.filter((a) => a.isLoaded).length, [assets]);

  const toggleLoadAsset = (assetId: string) => {
    setAssets((prev) =>
      prev.map((item) => {
        if (item.id === assetId) {
          const nextState = !item.isLoaded;
          if (nextState) {
            soundEffect("save");
            showAlert(`✅ "${item.name}" cargado en el Escenario 3D.`);
          } else {
            soundEffect("pickup");
            showAlert(`⏹️ "${item.name}" retirado del Escenario 3D.`);
          }
          return { ...item, isLoaded: nextState };
        }
        return item;
      })
    );
  };

  const showAlert = (msg: string) => {
    setActiveAlert(msg);
    setTimeout(() => setActiveAlert(null), 3500);
  };

  const handleUpdateTransform = (
    assetId: string,
    transformUpdates: Partial<Asset3DItem["transform"]>
  ) => {
    setAssets((prev) =>
      prev.map((item) => {
        if (item.id === assetId) {
          return {
            ...item,
            transform: {
              ...item.transform,
              ...transformUpdates,
            },
          };
        }
        return item;
      })
    );
  };

  const handleExportScenePreset = () => {
    const activeSceneData = {
      presetName: "Hectron 3D Virtual Stage Preset v38.4",
      exportedAt: new Date().toISOString(),
      activeEntities: assets.filter((a) => a.isLoaded),
      stats: {
        totalEntities: loadedCount,
        lightingSchema: "Cyberpunk 3-Point HDR",
        renderEngine: "WebGL Three.js r185 + PostProcessing",
      },
    };

    const blob = new Blob([JSON.stringify(activeSceneData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hectron-3d-scene-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert("💾 Preset de Escenario 3D exportado como JSON.");
  };

  const handleApplyPreset = (presetName: string) => {
    if (presetName === "cyberpunk") {
      setAssets((prev) =>
        prev.map((a) => ({
          ...a,
          isLoaded: ["env_cyberpunk_neon", "av_miku_holo", "prop_holographic_desk", "cam_cinematic_orbit", "light_cyber_triad"].includes(a.id),
        }))
      );
      speakText("Preset Cyberpunk Studio 2088 cargado en el escenario.", "HAPPY", "excited");
      showAlert("🚀 Preset Cyberpunk Studio activado!");
    } else if (presetName === "zen") {
      setAssets((prev) =>
        prev.map((a) => ({
          ...a,
          isLoaded: ["env_sakura_zen", "av_miku_holo", "cam_cinematic_orbit", "vfx_aurora_borealis"].includes(a.id),
        }))
      );
      speakText("Preset Templo Sakura Zen activado.", "IDLE", "idle");
      showAlert("🌸 Preset Templo Sakura Zen activado!");
    } else if (presetName === "quantum") {
      setAssets((prev) =>
        prev.map((a) => ({
          ...a,
          isLoaded: ["env_quantum_void", "av_miku_holo", "prop_cyber_crown", "vfx_matrix_rain", "cam_cinematic_orbit"].includes(a.id),
        }))
      );
      speakText("Cámara Cuántica del Vacío activada.", "SURPRISE", "surprised");
      showAlert("⚡ Preset Cámara Cuántica activado!");
    }
  };

  const getRarityBadge = (rarity: Asset3DItem["rarity"]) => {
    switch (rarity) {
      case "COMMON":
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">Común</span>;
      case "RARE":
        return <span className="bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] font-bold">Raro</span>;
      case "EPIC":
        return <span className="bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded text-[10px] font-bold">Épico</span>;
      case "LEGENDARY":
        return <span className="bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">Legendario</span>;
      case "QUANTUM":
        return <span className="bg-rose-950 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">Cuántica ★</span>;
    }
  };

  return (
    <div id="studio-3d-tab-root" className="space-y-6 max-w-7xl mx-auto">
      {/* Alert toast */}
      {activeAlert && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-400 text-cyan-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-fadeIn">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-xs font-bold">{activeAlert}</span>
        </div>
      )}

      {/* Top Header & Scene Stats HUD */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0E1528] to-slate-900 border border-cyan-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Biblioteca & Grid de Assets 3D</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                    v38.4 Stage Engine
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Explora, carga e inspecciona entornos 3D, avatares, props y sistemas VFX en tiempo real para el streaming de Miku.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons & Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Presets:</span>
              <button
                onClick={() => handleApplyPreset("cyberpunk")}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60 transition cursor-pointer"
              >
                Cyberpunk
              </button>
              <button
                onClick={() => handleApplyPreset("zen")}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40 hover:bg-purple-900/60 transition cursor-pointer"
              >
                Zen Sakura
              </button>
              <button
                onClick={() => handleApplyPreset("quantum")}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 hover:bg-rose-900/60 transition cursor-pointer"
              >
                Cámara Cuántica
              </button>
            </div>

            <button
              onClick={handleExportScenePreset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar JSON</span>
            </button>
          </div>
        </div>

        {/* HUD Metrics strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Objetos en Escenario</span>
              <span className="text-base font-black text-cyan-400">{loadedCount} / {assets.length} Activos</span>
            </div>
            <Layers className="w-5 h-5 text-cyan-500/50" />
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">VRAM Estimada</span>
              <span className="text-base font-black text-emerald-400">~148 MB</span>
            </div>
            <Monitor className="w-5 h-5 text-emerald-500/50" />
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Shader Mode</span>
              <span className="text-base font-black text-purple-400">PBR + Cel CelShade</span>
            </div>
            <Palette className="w-5 h-5 text-purple-500/50" />
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Render Pipeline</span>
              <span className="text-base font-black text-amber-400">60 FPS Ultra (LOD High)</span>
            </div>
            <Zap className="w-5 h-5 text-amber-500/50" />
          </div>
        </div>
      </div>

      {/* Category Tabs & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Category Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: "Todos los Assets", icon: Box, count: assets.length },
            { id: "environments", label: "Escenarios & Ambientes", icon: Compass, count: assets.filter((a) => a.category === "environments").length },
            { id: "avatars", label: "Avatares & Compañeros", icon: Shield, count: assets.filter((a) => a.category === "avatars").length },
            { id: "props", label: "Mobiliario & Props", icon: Layers, count: assets.filter((a) => a.category === "props").length },
            { id: "vfx", label: "Partículas & VFX", icon: Sparkles, count: assets.filter((a) => a.category === "vfx").length },
            { id: "lighting_cameras", label: "Cámaras & Luces", icon: Camera, count: assets.filter((a) => a.category === "lighting_cameras").length },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as AssetCategory)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Rarity & Status Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, tags (cyberpunk, sakura, miku, desk, matrix...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Rarity Select */}
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none w-full sm:w-auto"
          >
            <option value="all">Todas las Rarezas</option>
            <option value="COMMON">Común</option>
            <option value="RARE">Raro</option>
            <option value="EPIC">Épico</option>
            <option value="LEGENDARY">Legendario</option>
            <option value="QUANTUM">Cuántica ★</option>
          </select>

          {/* Toggle Loaded Only */}
          <button
            onClick={() => setFilterLoadedOnly(!filterLoadedOnly)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer w-full sm:w-auto justify-center ${
              filterLoadedOnly
                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Solo Cargados ({loadedCount})</span>
          </button>
        </div>
      </div>

      {/* Grid of 3D Asset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssets.map((asset) => {
          return (
            <div
              key={asset.id}
              className={`group bg-slate-900/90 border rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:border-cyan-500/50 ${
                asset.isLoaded ? "border-cyan-500/40 ring-1 ring-cyan-500/20" : "border-slate-800"
              }`}
            >
              {/* Asset Header & Image Preview */}
              <div>
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {getRarityBadge(asset.rarity)}
                    <span className="bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                      {asset.format}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    {asset.isLoaded ? (
                      <span className="bg-emerald-950/90 border border-emerald-400 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        En Escenario
                      </span>
                    ) : (
                      <span className="bg-slate-950/80 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        En Reposo
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Stats */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-slate-300 font-mono">
                    <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">{asset.polyCount}</span>
                    <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">{asset.fileSize}</span>
                  </div>
                </div>

                {/* Content Box */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        {asset.subcategory}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {asset.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {asset.description}
                  </p>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {asset.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-950/80 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 pt-0 border-t border-slate-800/80 mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedAsset(asset);
                    setIsEditModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                  title="Inspector de Transformación y Shaders"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ajustar</span>
                </button>

                <button
                  onClick={() => toggleLoadAsset(asset.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    asset.isLoaded
                      ? "bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200"
                      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                  }`}
                >
                  {asset.isLoaded ? (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retirar</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cargar en 3D</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Box className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No se encontraron assets 3D</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Prueba a cambiar el filtro de categorías, restablecer la búsqueda o quitar la casilla de "Solo Cargados".
          </p>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedRarity("all");
              setSearchQuery("");
              setFilterLoadedOnly(false);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer"
          >
            Restablecer Filtros
          </button>
        </div>
      )}

      {/* Asset Transformation / Inspector Modal */}
      {isEditModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedAsset.name}</h3>
                  <span className="text-xs text-slate-400">Inspector 3D de Transformación y Parámetros</span>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Transform Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Position */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase text-cyan-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" /> Posición (X, Y, Z)
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>X: {selectedAsset.transform.position[0].toFixed(2)}</span>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.1"
                      value={selectedAsset.transform.position[0]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        handleUpdateTransform(selectedAsset.id, {
                          position: [val, selectedAsset.transform.position[1], selectedAsset.transform.position[2]],
                        });
                      }}
                      className="w-24 accent-cyan-400"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Y: {selectedAsset.transform.position[1].toFixed(2)}</span>
                    <input
                      type="range"
                      min="-2"
                      max="5"
                      step="0.1"
                      value={selectedAsset.transform.position[1]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        handleUpdateTransform(selectedAsset.id, {
                          position: [selectedAsset.transform.position[0], val, selectedAsset.transform.position[2]],
                        });
                      }}
                      className="w-24 accent-cyan-400"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Z: {selectedAsset.transform.position[2].toFixed(2)}</span>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.1"
                      value={selectedAsset.transform.position[2]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        handleUpdateTransform(selectedAsset.id, {
                          position: [selectedAsset.transform.position[0], selectedAsset.transform.position[1], val],
                        });
                      }}
                      className="w-24 accent-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Scale & Intensity */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase text-purple-400 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" /> Escala & Intensidad
                </span>
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Escala:</span>
                      <span className="text-white font-bold">{selectedAsset.transform.scale}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.05"
                      value={selectedAsset.transform.scale}
                      onChange={(e) => {
                        handleUpdateTransform(selectedAsset.id, { scale: parseFloat(e.target.value) });
                      }}
                      className="w-full accent-purple-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Luz/Emisión:</span>
                      <span className="text-white font-bold">{selectedAsset.transform.intensity ?? 1.0}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={selectedAsset.transform.intensity ?? 1.0}
                      onChange={(e) => {
                        handleUpdateTransform(selectedAsset.id, { intensity: parseFloat(e.target.value) });
                      }}
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>
              </div>

              {/* Shader Color & Status */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5" /> Color / Tinte Neón
                </span>
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedAsset.transform.color || "#00e1ff"}
                      onChange={(e) => {
                        handleUpdateTransform(selectedAsset.id, { color: e.target.value });
                      }}
                      className="w-10 h-10 rounded cursor-pointer border border-slate-700 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-300">
                      {selectedAsset.transform.color || "#00e1ff"}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>Format: <strong className="text-white">{selectedAsset.format}</strong></div>
                    <div>Polycount: <strong className="text-white">{selectedAsset.polyCount}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  handleUpdateTransform(selectedAsset.id, {
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: 1.0,
                    intensity: 1.0,
                  });
                  showAlert("Transformaciones restablecidas a valores por defecto.");
                }}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" /> Restablecer Transform
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    showAlert(`Parámetros de "${selectedAsset.name}" guardados correctamente.`);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  Aplicar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
