import React, { useState } from "react";
import {
  Sparkles,
  Gift,
  Heart,
  MessageSquare,
  Users,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Sliders,
  Zap,
  Filter,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";

export interface EventActionMapping {
  id: string;
  name: string;
  eventType: "gift" | "chat_command" | "subscription" | "follow" | "like_milestone";
  filterCondition: string; // e.g. "Rose", "!pregunta", "Tier 1", ">= 100"
  targetAction: string; // e.g. "Hectron_TikTok_Gift"
  obsScene?: string;
  enabled: boolean;
  paramTemplate: string; // JSON or key-value format
  lastTriggered?: string;
  triggerCount: number;
}

const INITIAL_MAPPINGS: EventActionMapping[] = [
  {
    id: "map_rose",
    name: "Regalo TikTok: Rosa / Corazón",
    eventType: "gift",
    filterCondition: "Rose,Rosa,Heart",
    targetAction: "Hectron_TikTok_Gift",
    obsScene: "FLIRT_SCENE",
    enabled: true,
    paramTemplate: '{"giftName":"{giftName}","count":{count},"user":"{user}"}',
    triggerCount: 142
  },
  {
    id: "map_crown",
    name: "Regalo Épico: Corona / Galaxia",
    eventType: "gift",
    filterCondition: "Crown,Corona,Galaxy,Lion",
    targetAction: "Hectron_TikTok_Gift",
    obsScene: "SURPRISE_SCENE",
    enabled: true,
    paramTemplate: '{"giftName":"{giftName}","count":{count},"user":"{user}","epic":true}',
    triggerCount: 18
  },
  {
    id: "map_sub",
    name: "Nueva Suscripción / Resub",
    eventType: "subscription",
    filterCondition: "All Tiers",
    targetAction: "Hectron_SubAlert",
    obsScene: "DEFAULT",
    enabled: true,
    paramTemplate: '{"user":"{user}","tier":"{tier}","months":{months}}',
    triggerCount: 35
  },
  {
    id: "map_ai_cmd",
    name: "Comando IA Chat: !pregunta / !ai",
    eventType: "chat_command",
    filterCondition: "!pregunta,!ai,!ask",
    targetAction: "Hectron_TikTok_Chat",
    obsScene: "DEFAULT",
    enabled: true,
    paramTemplate: '{"user":"{user}","prompt":"{cleanPrompt}"}',
    triggerCount: 89
  },
  {
    id: "map_follow",
    name: "Nuevo Seguidor en Directo",
    eventType: "follow",
    filterCondition: "Any Follower",
    targetAction: "Hectron_TikTok_Follow",
    obsScene: "DEFAULT",
    enabled: true,
    paramTemplate: '{"user":"{user}","rewardCoins":50}',
    triggerCount: 260
  }
];

interface ChatEventActionMapperProps {
  isConnected: boolean;
  onExecuteAction: (actionName: string, args?: Record<string, any>) => Promise<void> | void;
  onLog?: (type: "IN" | "OUT" | "INFO" | "ERROR", msg: string) => void;
}

export function ChatEventActionMapper({
  isConnected,
  onExecuteAction,
  onLog
}: ChatEventActionMapperProps) {
  const [mappings, setMappings] = useState<EventActionMapping[]>(INITIAL_MAPPINGS);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [editingMapping, setEditingMapping] = useState<EventActionMapping | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [testSimulatingId, setTestSimulatingId] = useState<string | null>(null);

  // New rule form state
  const [newRule, setNewRule] = useState<Partial<EventActionMapping>>({
    name: "",
    eventType: "gift",
    filterCondition: "",
    targetAction: "Hectron_CustomAction",
    obsScene: "DEFAULT",
    enabled: true,
    paramTemplate: '{"user":"{user}","value":"{value}"}'
  });

  const filteredMappings = mappings.filter((m) => {
    if (selectedFilter === "all") return true;
    return m.eventType === selectedFilter;
  });

  const handleToggleEnable = (id: string) => {
    const target = mappings.find((m) => m.id === id);
    if (!target) return;
    const nextEnabled = !target.enabled;

    setMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: nextEnabled } : m))
    );

    if (onLog) {
      onLog(
        "INFO",
        `Regla de Mapeo "${target.name}" ${nextEnabled ? "ACTIVADA" : "DESACTIVADA"}`
      );
    }
  };

  const handleDeleteRule = (id: string) => {
    setMappings((prev) => prev.filter((m) => m.id !== id));
    if (onLog) onLog("INFO", `Regla eliminada del motor de mapeo.`);
  };

  const handleSimulateRule = async (mapping: EventActionMapping) => {
    setTestSimulatingId(mapping.id);
    const mockUser = "ViewerTest_" + Math.floor(Math.random() * 899 + 100);
    const mockGift = mapping.filterCondition.split(",")[0] || "Rose";

    let parsedArgs: Record<string, any> = {
      user: mockUser,
      eventRuleId: mapping.id,
      timestamp: Date.now()
    };

    if (mapping.eventType === "gift") {
      parsedArgs.giftName = mockGift;
      parsedArgs.count = 1;
      parsedArgs.hectron_gift_user = mockUser;
      parsedArgs.hectron_gift_name = mockGift;
      parsedArgs.hectron_gift_count = 1;
    } else if (mapping.eventType === "chat_command") {
      parsedArgs.prompt = "¿Cómo puedo ganar más monedas en Hectron?";
      parsedArgs.hectron_chat_user = mockUser;
      parsedArgs.hectron_chat_text = `!pregunta ${parsedArgs.prompt}`;
    } else if (mapping.eventType === "subscription") {
      parsedArgs.tier = "Tier 1";
      parsedArgs.months = 1;
    } else if (mapping.eventType === "follow") {
      parsedArgs.hectron_follower_user = mockUser;
    }

    if (onLog) {
      onLog(
        "OUT",
        `[Mapeador de Eventos] Disparando "${mapping.targetAction}" para evento "${mapping.name}"`
      );
    }

    try {
      await onExecuteAction(mapping.targetAction, parsedArgs);
      setMappings((prev) =>
        prev.map((m) =>
          m.id === mapping.id
            ? {
                ...m,
                triggerCount: m.triggerCount + 1,
                lastTriggered: new Date().toLocaleTimeString()
              }
            : m
        )
      );
    } catch (err: any) {
      if (onLog) onLog("ERROR", `Fallo al ejecutar mapeo: ${err.message}`);
    } finally {
      setTimeout(() => setTestSimulatingId(null), 500);
    }
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.targetAction) return;

    const created: EventActionMapping = {
      id: "map_" + Date.now(),
      name: newRule.name || "Nueva Regla",
      eventType: newRule.eventType || "gift",
      filterCondition: newRule.filterCondition || "Default",
      targetAction: newRule.targetAction || "Hectron_Action",
      obsScene: newRule.obsScene || "DEFAULT",
      enabled: true,
      paramTemplate: newRule.paramTemplate || "{}",
      triggerCount: 0
    };

    setMappings((prev) => [created, ...prev]);
    setShowAddModal(false);
    setNewRule({
      name: "",
      eventType: "gift",
      filterCondition: "",
      targetAction: "Hectron_CustomAction",
      obsScene: "DEFAULT",
      enabled: true,
      paramTemplate: '{"user":"{user}","value":"{value}"}'
    });

    if (onLog) onLog("INFO", `Nueva regla de mapeo "${created.name}" creada con éxito.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls Bar */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Motor de Mapeo: Eventos de Chat &rarr; Acciones Streamer.bot</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Asocia automáticamente regalos, suscripciones, comentarios o comandos con acciones C# y cambios de escena OBS.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedFilter === "all" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Todos ({mappings.length})
            </button>
            <button
              onClick={() => setSelectedFilter("gift")}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedFilter === "gift" ? "bg-pink-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Regalos
            </button>
            <button
              onClick={() => setSelectedFilter("chat_command")}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedFilter === "chat_command" ? "bg-cyan-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Comandos
            </button>
            <button
              onClick={() => setSelectedFilter("subscription")}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedFilter === "subscription" ? "bg-amber-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Subs
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-purple-600/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Regla</span>
          </button>
        </div>
      </div>

      {/* Mappings List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredMappings.map((mapping) => {
          const isSimulating = testSimulatingId === mapping.id;
          return (
            <div
              key={mapping.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                mapping.enabled
                  ? "bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md"
                  : "bg-slate-950/60 border-slate-850 opacity-60"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Event Type Badge & Info */}
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                    {mapping.eventType === "gift" && <Gift className="w-5 h-5 text-pink-400" />}
                    {mapping.eventType === "chat_command" && <MessageSquare className="w-5 h-5 text-cyan-400" />}
                    {mapping.eventType === "subscription" && <Sparkles className="w-5 h-5 text-amber-400" />}
                    {mapping.eventType === "follow" && <Heart className="w-5 h-5 text-rose-400" />}
                    {mapping.eventType === "like_milestone" && <Zap className="w-5 h-5 text-emerald-400" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white">{mapping.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                        {mapping.eventType.toUpperCase()}
                      </span>
                      {mapping.obsScene && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30">
                          OBS: {mapping.obsScene}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        Filtro: <strong className="text-slate-200">{mapping.filterCondition}</strong>
                      </span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-purple-300">
                        <ArrowRight className="w-3 h-3 text-purple-400" />
                        {mapping.targetAction}
                      </span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-[11px] text-slate-400">
                        Disparos: <strong className="text-emerald-400 font-mono">{mapping.triggerCount}</strong>
                      </span>
                      {mapping.lastTriggered && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          (Último: {mapping.lastTriggered})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions & Toggle */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    type="button"
                    onClick={() => handleSimulateRule(mapping)}
                    disabled={!isConnected || isSimulating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-purple-300 hover:text-purple-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    <Play className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin text-amber-400" : ""}`} />
                    <span>{isSimulating ? "Probando..." : "Simular Evento"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleEnable(mapping.id)}
                    className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
                    title={mapping.enabled ? "Desactivar Regla" : "Activar Regla"}
                  >
                    {mapping.enabled ? (
                      <ToggleRight className="w-6 h-6 text-purple-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteRule(mapping.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition cursor-pointer"
                    title="Eliminar regla"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Nueva Regla de Mapeo de Evento</span>
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre Descriptivo de la Regla
                </label>
                <input
                  type="text"
                  required
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="ej. Regalo TikTok: Gorra de Cumpleaños"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Evento en Vivo
                  </label>
                  <select
                    value={newRule.eventType}
                    onChange={(e) =>
                      setNewRule({ ...newRule, eventType: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="gift">Regalo / Donación</option>
                    <option value="chat_command">Comando de Chat</option>
                    <option value="subscription">Suscripción / Resub</option>
                    <option value="follow">Nuevo Seguidor</option>
                    <option value="like_milestone">Hito de Me Gustas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Condición / Filtro
                  </label>
                  <input
                    type="text"
                    value={newRule.filterCondition}
                    onChange={(e) => setNewRule({ ...newRule, filterCondition: e.target.value })}
                    placeholder="ej. Hat,Gorra o !comando"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Acción Destino en Streamer.bot
                  </label>
                  <input
                    type="text"
                    required
                    value={newRule.targetAction}
                    onChange={(e) => setNewRule({ ...newRule, targetAction: e.target.value })}
                    placeholder="ej. Hectron_TikTok_Gift"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Escena OBS Asignada
                  </label>
                  <input
                    type="text"
                    value={newRule.obsScene}
                    onChange={(e) => setNewRule({ ...newRule, obsScene: e.target.value })}
                    placeholder="ej. FLIRT_SCENE o DEFAULT"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  Guardar Regla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
