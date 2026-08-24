import { useState, useContext, useMemo } from "react";
import { BrainContext } from "../BrainContext";
import { GameItem, ItemCategory, ItemRarity } from "../types";
import { ITEM_CATALOG, RARITY_CONFIG } from "../lib/gameCatalog";
import {
  Package,
  Sparkles,
  Zap,
  Gem,
  Mic,
  Cpu,
  Shield,
  Music,
  Flame,
  Award,
  Search,
  Check,
  Plus,
  Coins,
  Battery,
  TrendingUp,
  Activity,
  Layers,
  Info,
  SlidersHorizontal,
  FlameKindling,
  Trash2,
} from "lucide-react";

export function InventoryMenu() {
  const {
    gameState,
    collectItem,
    useItem,
    equipItem,
    discardItem,
    spawnRandomWorldItem,
    gainCoins,
    gainExperience,
    triggerAutoSave,
    setActiveTab,
  } = useContext(BrainContext);

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | "ALL">("ALL");
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    gameState.inventory[0]?.id || null
  );
  const [actionNotice, setActionNotice] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const showNotice = (text: string, type: "success" | "info" = "success") => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Filtered inventory list
  const filteredItems = useMemo(() => {
    return gameState.inventory.filter((item) => {
      const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchRarity = selectedRarity === "ALL" || item.rarity === selectedRarity;
      const matchSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchRarity && matchSearch;
    });
  }, [gameState.inventory, selectedCategory, selectedRarity, searchQuery]);

  const selectedItem = useMemo(() => {
    return gameState.inventory.find((i) => i.id === selectedItemId) || gameState.inventory[0] || null;
  }, [gameState.inventory, selectedItemId]);

  // Render Lucide Icon based on iconName string
  const renderItemIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case "Cpu":
        return <Cpu className={className} />;
      case "Gem":
        return <Gem className={className} />;
      case "Mic":
        return <Mic className={className} />;
      case "Sparkles":
        return <Sparkles className={className} />;
      case "Zap":
        return <Zap className={className} />;
      case "Activity":
        return <Activity className={className} />;
      case "Crown":
        return <Award className={className} />;
      case "Shield":
        return <Shield className={className} />;
      case "Music":
        return <Music className={className} />;
      case "Flame":
        return <Flame className={className} />;
      case "Award":
        return <Award className={className} />;
      case "Package":
      default:
        return <Package className={className} />;
    }
  };

  const handleUse = (item: GameItem) => {
    const res = useItem(item.id);
    if (res.success) {
      showNotice(res.message, "success");
    } else {
      showNotice(res.message, "info");
    }
  };

  const handleEquip = (item: GameItem) => {
    const res = equipItem(item.id);
    if (res.success) {
      showNotice(res.message, "success");
    } else {
      showNotice(res.message, "info");
    }
  };

  const handleSell = (item: GameItem) => {
    const res = discardItem(item.id, 1);
    if (res.success) {
      showNotice(res.message, "info");
    }
  };

  const handleSimulateDrop = () => {
    const spawned = spawnRandomWorldItem();
    collectItem(spawned.itemId, 1);
    showNotice(`¡Descubriste un nuevo objeto: ${spawned.name}!`, "success");
  };

  const totalItemCount = gameState.inventory.reduce((acc, i) => acc + i.quantity, 0);
  const maxCapacity = 30;

  return (
    <div className="space-y-6">
      {/* Top Banner & Player Game Stats Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-4 lg:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                  Inventario del Metaverso
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Nivel {gameState.player.level}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Colecciona reliquias cibernéticas, núcleos cuánticos y equipamiento de streaming para Miku.
              </p>
            </div>
          </div>

          {/* Player Stats Chips */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {/* CyberCoins */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-amber-500/30">
              <Coins className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CyberCoins</div>
                <div className="text-sm font-black text-amber-300">{gameState.player.cyberCoins} ₢</div>
              </div>
            </div>

            {/* Energy */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-emerald-500/30">
              <Battery className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Energía Miku</div>
                <div className="text-sm font-black text-emerald-300">
                  {gameState.player.energy} / {gameState.player.maxEnergy}
                </div>
              </div>
            </div>

            {/* Capacity Meter */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-cyan-500/30">
              <Layers className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Capacidad</div>
                <div className="text-sm font-black text-cyan-300">
                  {totalItemCount} / {maxCapacity}
                </div>
              </div>
            </div>

            {/* Quick Drop Button */}
            <button
              onClick={handleSimulateDrop}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explorar y Encontrar Objeto</span>
            </button>
          </div>
        </div>

        {/* Experience Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3">
          <div className="text-xs text-slate-400 font-bold whitespace-nowrap">
            Progreso Nivel {gameState.player.level}:
          </div>
          <div className="flex-1 bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((gameState.player.xp / gameState.player.xpToNextLevel) * 100))}%`,
              }}
            />
          </div>
          <div className="text-xs text-cyan-300 font-mono font-bold">
            {gameState.player.xp} / {gameState.player.xpToNextLevel} XP
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-cyan-950/90 border border-cyan-400 text-cyan-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg shadow-cyan-500/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{actionNotice.text}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-cyan-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Filters, Search & Categories */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "ALL", label: "Todos", icon: Package },
              { id: "RELIC", label: "Reliquias", icon: Gem },
              { id: "QUANTUM_CORE", label: "Núcleos Cuánticos", icon: Cpu },
              { id: "STREAM_GEAR", label: "Gear Streamer", icon: Mic },
              { id: "CONSUMABLE", label: "Consumibles", icon: Zap },
              { id: "BADGE", label: "Insignias", icon: Award },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Rarity Filter */}
        <div className="flex items-center gap-2">
          {/* Rarity Select */}
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value as any)}
            className="bg-slate-950 text-xs font-bold text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">Cualquier Rareza</option>
            <option value="COMMON">Común</option>
            <option value="RARE">Raro</option>
            <option value="EPIC">Épico</option>
            <option value="LEGENDARY">Legendario</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar objeto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400 w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Item Inventory Grid (Left) + Item Inspector Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Item Grid (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 lg:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <span>Objetos en Posesión ({filteredItems.length})</span>
            </h3>
            <div className="text-xs text-slate-400">
              Haz clic en cualquier objeto para inspeccionar o usar
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4 border-2 border-dashed border-slate-800 rounded-xl">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-400">No se encontraron objetos</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No tienes objetos que coincidan con los filtros seleccionados o tu inventario está vacío.
              </p>
              <button
                onClick={handleSimulateDrop}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
              >
                Buscar Nuevos Objetos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const rarityStyle = RARITY_CONFIG[item.rarity];
                const isSelected = selectedItem?.id === item.id;
                const isEquipped = item.equipped;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`relative rounded-xl p-3 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      rarityStyle.bg
                    } ${rarityStyle.border} ${
                      isSelected
                        ? "ring-2 ring-cyan-400 scale-[1.02] shadow-lg shadow-cyan-500/20"
                        : "hover:border-slate-500 hover:scale-[1.01]"
                    }`}
                  >
                    {/* Equipped Ribbon / Badge */}
                    {isEquipped && (
                      <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
                        <Check className="w-2.5 h-2.5" />
                        <span>EQUIPADO</span>
                      </div>
                    )}

                    {/* Quantity Badge */}
                    <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                      x{item.quantity}
                    </div>

                    {/* Item Icon */}
                    <div className="w-12 h-12 mx-auto mt-4 mb-2 rounded-xl bg-slate-950/60 flex items-center justify-center shadow-inner">
                      <div className={rarityStyle.text}>{renderItemIcon(item.iconName, "w-6 h-6")}</div>
                    </div>

                    {/* Item Title & Rarity */}
                    <div className="text-center mt-1">
                      <div className="text-xs font-bold text-slate-200 truncate" title={item.name}>
                        {item.name}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${rarityStyle.badge}`}
                        >
                          {rarityStyle.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Item Inspector & Actions Panel (4/5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {selectedItem ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              {/* Rarity Header Bar */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      RARITY_CONFIG[selectedItem.rarity].badge
                    }`}
                  >
                    {RARITY_CONFIG[selectedItem.rarity].label}
                  </span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                    {selectedItem.category.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedItem.valueCoins} ₢</span>
                </div>
              </div>

              {/* Big Visual Card */}
              <div className="bg-gradient-to-b from-slate-950 to-slate-900 p-6 rounded-2xl border border-slate-800 text-center relative mb-4 shadow-inner">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-950/40 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-xl shadow-cyan-500/20 mb-3 animate-pulse">
                  {renderItemIcon(selectedItem.iconName, "w-10 h-10")}
                </div>
                <h4 className="text-base font-black text-white">{selectedItem.name}</h4>
                <div className="text-xs text-cyan-400 font-mono mt-0.5">
                  Cantidad: x{selectedItem.quantity} / Máx: {selectedItem.maxStack}
                </div>
              </div>

              {/* Description & Lore */}
              <div className="space-y-3 mb-5">
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Efecto</div>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>

                {selectedItem.lore && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Historia del Metaverso</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic mt-1 leading-relaxed">
                      "{selectedItem.lore}"
                    </p>
                  </div>
                )}

                {/* Stat Bonuses */}
                {selectedItem.statBonus && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Bonus de Atributos</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedItem.statBonus.hypeMultiplier && (
                        <div className="text-slate-300">
                          Hype Multiplier:{" "}
                          <span className="text-emerald-400 font-bold">
                            +{Math.round((selectedItem.statBonus.hypeMultiplier - 1) * 100)}%
                          </span>
                        </div>
                      )}
                      {selectedItem.statBonus.ttsResonance && (
                        <div className="text-slate-300">
                          Voz TTS Clarity:{" "}
                          <span className="text-cyan-400 font-bold">
                            +{Math.round((selectedItem.statBonus.ttsResonance - 1) * 100)}%
                          </span>
                        </div>
                      )}
                      {selectedItem.statBonus.fpsBonus && (
                        <div className="text-slate-300">
                          FPS Boost:{" "}
                          <span className="text-blue-400 font-bold">
                            +{selectedItem.statBonus.fpsBonus} FPS
                          </span>
                        </div>
                      )}
                      {selectedItem.statBonus.energyRestore && (
                        <div className="text-slate-300">
                          Restaura Energía:{" "}
                          <span className="text-emerald-400 font-bold">
                            +{selectedItem.statBonus.energyRestore}
                          </span>
                        </div>
                      )}
                      {selectedItem.statBonus.streamKarma && (
                        <div className="text-slate-300">
                          Karma Stream:{" "}
                          <span className="text-purple-400 font-bold">
                            +{selectedItem.statBonus.streamKarma}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {selectedItem.isConsumable ? (
                  <button
                    onClick={() => handleUse(selectedItem)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Usar Consumible ({selectedItem.quantity} restantes)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleEquip(selectedItem)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                      selectedItem.equipped
                        ? "bg-slate-800 text-amber-300 border border-amber-500/40 hover:bg-slate-700"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>{selectedItem.equipped ? "Desequipar Objeto" : "Equipar en Miku"}</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleSell(selectedItem)}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Vender (+{Math.round(selectedItem.valueCoins * 0.5)} ₢)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("saves")}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Guardar Partida</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Selecciona un objeto para ver sus detalles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
