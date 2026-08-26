import React, { useState, useEffect } from "react";
import {
  Users,
  Brain,
  Sparkles,
  Zap,
  Battery,
  Heart,
  Utensils,
  Plus,
  RotateCw,
  Copy,
  Check,
  Smartphone,
  Database,
  Code2,
  Play,
  Pause,
  RefreshCw,
  Clock,
  Layers,
  Terminal,
  Activity,
  Award,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Flame,
} from "lucide-react";

export interface SimItem {
  id: number;
  name: string;
  hunger: number;
  energy: number;
  happiness: number;
  memories: string[];
  isThinking?: boolean;
  lastAction?: string;
  lastReason?: string;
}

export interface SimActionPlan {
  nextAction: string;
  reason: string;
  hungerDelta: number;
  energyDelta: number;
  happinessDelta: number;
}

export function SimsEnterpriseStudio() {
  const [activeSubTab, setActiveSubTab] = useState<"live-simulator" | "android-code" | "ai-mind">("live-simulator");
  const [sims, setSims] = useState<SimItem[]>([
    {
      id: 1,
      name: "Alex Mercer",
      hunger: 75,
      energy: 60,
      happiness: 85,
      memories: ["Llegó a la ciudad", "Comenzó su nueva vida", "Exploró el centro comercial"],
    },
    {
      id: 2,
      name: "Elena Rostova",
      hunger: 42,
      energy: 88,
      happiness: 65,
      memories: ["Preparó café expreso", "Comenzó a pintar un cuadro", "Adoptó un gato galáctico"],
    },
    {
      id: 3,
      name: "Dr. Victor Vance",
      hunger: 90,
      energy: 30,
      happiness: 95,
      memories: ["Completó una investigación cuántica", "Jugó ajedrez espacial", "Escuchó música Lo-Fi"],
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSimName, setNewSimName] = useState("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // AI Mind Sandbox State
  const [sandboxSimName, setSandboxSimName] = useState("Kira Vance");
  const [sandboxHunger, setSandboxHunger] = useState(35);
  const [sandboxEnergy, setSandboxEnergy] = useState(25);
  const [sandboxHappiness, setSandboxHappiness] = useState(80);
  const [sandboxMemories, setSandboxMemories] = useState("Terminó turno nocturno, Compró ingredientes, Quiere descansar");
  const [sandboxResult, setSandboxResult] = useState<SimActionPlan | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // Load Sims from server API
  const fetchSims = async () => {
    try {
      const res = await fetch("/api/sims");
      const data = await res.json();
      if (data.ok && Array.isArray(data.sims) && data.sims.length > 0) {
        setSims(data.sims);
      }
    } catch (e) {
      console.warn("Using local Sims fallback", e);
    }
  };

  useEffect(() => {
    fetchSims();
  }, []);

  // Trigger Gemini AI Action for a Sim
  const triggerAiForSim = async (sim: SimItem) => {
    setSims((prev) =>
      prev.map((s) => (s.id === sim.id ? { ...s, isThinking: true } : s))
    );

    try {
      const res = await fetch("/api/sims/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simId: sim.id,
          simName: sim.name,
          hunger: sim.hunger,
          energy: sim.energy,
          happiness: sim.happiness,
          recentMemories: sim.memories,
        }),
      });

      const data = await res.json();
      if (data.ok && data.plan) {
        const plan: SimActionPlan = data.plan;
        setSims((prev) =>
          prev.map((s) => {
            if (s.id === sim.id) {
              const updatedHunger = Math.max(0, Math.min(100, s.hunger + plan.hungerDelta));
              const updatedEnergy = Math.max(0, Math.min(100, s.energy + plan.energyDelta));
              const updatedHappiness = Math.max(0, Math.min(100, s.happiness + plan.happinessDelta));
              const updatedMemories = [plan.nextAction, ...s.memories.filter((m) => m !== plan.nextAction)].slice(0, 3);
              return {
                ...s,
                hunger: Math.round(updatedHunger),
                energy: Math.round(updatedEnergy),
                happiness: Math.round(updatedHappiness),
                memories: updatedMemories,
                lastAction: plan.nextAction,
                lastReason: plan.reason,
                isThinking: false,
              };
            }
            return s;
          })
        );
      } else {
        throw new Error("Invalid plan response");
      }
    } catch (err) {
      // Local fallback calculation
      const fallbackPlan: SimActionPlan = {
        nextAction: "Tomar un café y reflexionar",
        reason: "Recuperación de energía espontánea",
        hungerDelta: -5,
        energyDelta: 15,
        happinessDelta: 10,
      };

      setSims((prev) =>
        prev.map((s) => {
          if (s.id === sim.id) {
            return {
              ...s,
              hunger: Math.max(0, Math.min(100, s.hunger + fallbackPlan.hungerDelta)),
              energy: Math.max(0, Math.min(100, s.energy + fallbackPlan.energyDelta)),
              happiness: Math.max(0, Math.min(100, s.happiness + fallbackPlan.happinessDelta)),
              memories: [fallbackPlan.nextAction, ...s.memories].slice(0, 3),
              lastAction: fallbackPlan.nextAction,
              lastReason: fallbackPlan.reason,
              isThinking: false,
            };
          }
          return s;
        })
      );
    }
  };

  // Add new Sim
  const handleAddNewSim = async () => {
    if (!newSimName.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/sims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSimName.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.sim) {
        setSims((prev) => [...prev, data.sim]);
      } else {
        const localSim: SimItem = {
          id: Date.now(),
          name: newSimName.trim(),
          hunger: 100,
          energy: 100,
          happiness: 100,
          memories: ["Llegó a la ciudad", "Comenzó su nueva vida"],
        };
        setSims((prev) => [...prev, localSim]);
      }
    } catch (e) {
      const localSim: SimItem = {
        id: Date.now(),
        name: newSimName.trim(),
        hunger: 100,
        energy: 100,
        happiness: 100,
        memories: ["Llegó a la ciudad", "Comenzó su nueva vida"],
      };
      setSims((prev) => [...prev, localSim]);
    } finally {
      setNewSimName("");
      setShowAddModal(false);
      setIsLoading(false);
    }
  };

  // Manual Need Boosters
  const boostSimNeed = (simId: number, type: "hunger" | "energy" | "happiness", delta: number) => {
    setSims((prev) =>
      prev.map((s) => {
        if (s.id === simId) {
          const newVal = Math.max(0, Math.min(100, s[type] + delta));
          return { ...s, [type]: newVal };
        }
        return s;
      })
    );
  };

  // Auto-simulation loop
  useEffect(() => {
    if (!isAutoSimulating || sims.length === 0) return;
    const interval = setInterval(() => {
      // Pick a random sim and trigger AI update
      const randomSim = sims[Math.floor(Math.random() * sims.length)];
      if (randomSim && !randomSim.isThinking) {
        triggerAiForSim(randomSim);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoSimulating, sims]);

  // Execute Sandbox AI Plan
  const testSandboxPlan = async () => {
    setSandboxLoading(true);
    try {
      const memories = sandboxMemories.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/sims/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simName: sandboxSimName,
          hunger: sandboxHunger,
          energy: sandboxEnergy,
          happiness: sandboxHappiness,
          recentMemories: memories,
        }),
      });
      const data = await res.json();
      if (data.ok && data.plan) {
        setSandboxResult(data.plan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSandboxLoading(false);
    }
  };

  const copyCode = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Helper for need color
  const getProgressColor = (value: number) => {
    if (value >= 60) return "bg-emerald-500";
    if (value >= 30) return "bg-amber-500";
    return "bg-rose-500";
  };

  const kotlinFullCode = `package com.abadalabs.sims.enterprise

import android.content.Context
import androidx.room.*
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.generationConfig

// ==========================================
// 1. ROOM DATABASE: ENTITY, DAO & DATABASE
// ==========================================

@Entity(tableName = "sims")
data class SimEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val hunger: Float = 100f, // 0 a 100
    val energy: Float = 100f, // 0 a 100
    val happiness: Float = 100f, // 0 a 100
    val memories: String = "[]" // JSON serializado de las últimas 3 memorias
)

@Dao
interface SimDao {
    @Query("SELECT * FROM sims")
    fun getAllSims(): Flow<List<SimEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSim(sim: SimEntity)

    @Update
    suspend fun updateSim(sim: SimEntity)
}

@Database(entities = [SimEntity::class], version = 1, exportSchema = false)
abstract class SimDatabase : RoomDatabase() {
    abstract fun simDao(): SimDao

    companion object {
        @Volatile
        private var INSTANCE: SimDatabase? = null

        fun getDatabase(context: Context): SimDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    SimDatabase::class.java,
                    "sim_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}

// ==========================================
// 2. GEMINI AI SERVICE (Google AI SDK)
// ==========================================

@Serializable
data class SimActionPlan(
    val nextAction: String,
    val reason: String,
    val hungerDelta: Float,
    val energyDelta: Float,
    val happinessDelta: Float
)

class GeminAiService {
    // Clave de API provista por el entorno seguro
    private val apiKey = ""
    
    private val generativeModel = GenerativeModel(
        modelName = "gemini-3.7-flash",
        apiKey = apiKey,
        generationConfig = generationConfig {
            responseMimeType = "application/json"
        }
    )

    suspend fun generateNextPlan(simName: String, hunger: Float, energy: Float, happiness: Float, recentMemories: List<String>): SimActionPlan? {
        try {
            val prompt = """
                Actúa como el motor de IA de un Sim. Analiza el estado actual del Sim llamado $simName:
                - Hambre: $hunger / 100
                - Energía: $energy / 100
                - Felicidad: $happiness / 100
                - Últimas memorias: \${recentMemories.joinToString(", ")}

                Devuelve un JSON estricto con la siguiente estructura exacta:
                {
                  "nextAction": "Acción recomendada en formato breve",
                  "reason": "Razón corta de la acción",
                  "hungerDelta": <cambio numérico para hambre, ej: 10.0 o -5.0>,
                  "energyDelta": <cambio numérico para energía>,
                  "happinessDelta": <cambio numérico para felicidad>
                }
            """.trimIndent()

            val response = generativeModel.generateContent(prompt)
            val jsonText = response.text ?: return null
            
            return Json { ignoreUnknownKeys = true }.decodeFromString<SimActionPlan>(jsonText)
        } catch (e: Exception) {
            return null
        }
    }
}

// ==========================================
// 3. SIM VIEWMODEL
// ==========================================

class SimViewModel(private val simDao: SimDao) : ViewModel() {
    private val aiService = GeminAiService()

    val sims: Flow<List<SimEntity>> = simDao.getAllSims()

    fun addNewSim(name: String) {
        viewModelScope.launch {
            val newSim = SimEntity(
                name = name,
                memories = Json.encodeToString(listOf("Llegó a la ciudad", "Comenzó su nueva vida"))
            )
            simDao.insertSim(newSim)
        }
    }

    fun triggerAiNeedUpdate(sim: SimEntity) {
        viewModelScope.launch {
            val memoriesList: List<String> = try {
                Json.decodeFromString(sim.memories)
            } catch (e: Exception) {
                emptyList()
            }

            val plan = aiService.generateNextPlan(sim.name, sim.hunger, sim.energy, sim.happiness, memoriesList)
            if (plan != null) {
                val updatedHunger = (sim.hunger + plan.hungerDelta).coerceIn(0f, 100f)
                val updatedEnergy = (sim.energy + plan.energyDelta).coerceIn(0f, 100f)
                val updatedHappiness = (sim.happiness + plan.happinessDelta).coerceIn(0f, 100f)
                
                val updatedMemories = (listOf(plan.nextAction) + memoriesList).take(3)
                val serializedMemories = Json.encodeToString(updatedMemories)

                val updatedSim = sim.copy(
                    hunger = updatedHunger,
                    energy = updatedEnergy,
                    happiness = updatedHappiness,
                    memories = serializedMemories
                )
                simDao.updateSim(updatedSim)
            }
        }
    }
}

// ==========================================
// 4. JETPACK COMPOSE UI (SCREENS & COMPONENTS)
// ==========================================

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Refresh

@Composable
fun SimListScreen(
    sims: List<SimEntity>,
    onAddSimClick: () -> Unit,
    onTriggerAi: (SimEntity) -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var newSimName by remember { mutableStateOf("") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Agregar Sim")
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
            if (sims.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No hay Sims registrados. ¡Crea uno nuevo!", style = MaterialTheme.typography.bodyLarge)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(sims) { sim ->
                        SimCard(sim = sim, onTriggerAi = { onTriggerAi(sim) })
                    }
                }
            }

            if (showAddDialog) {
                AlertDialog(
                    onDismissRequest = { showAddDialog = false },
                    title = { Text("Crear Nuevo Sim") },
                    text = {
                        OutlinedTextField(
                            value = newSimName,
                            onValueChange = { newSimName = it },
                            label = { Text("Nombre del Sim") },
                            singleLine = true
                        )
                    },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                if (newSimName.isNotBlank()) {
                                    onAddSimClick()
                                    newSimName = ""
                                    showAddDialog = false
                                }
                            }
                        ) {
                            Text("Guardar")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { showAddDialog = false }) {
                            Text("Cancelar")
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun SimCard(sim: SimEntity, onTriggerAi: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = sim.name, style = MaterialTheme.typography.titleLarge)
                IconButton(onClick = onTriggerAi) {
                    Icon(Icons.Default.Refresh, contentDescription = "Actualizar por IA")
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            NeedProgressBar(label = "Hambre", value = sim.hunger)
            Spacer(modifier = Modifier.height(4.dp))
            NeedProgressBar(label = "Energía", value = sim.energy)
            Spacer(modifier = Modifier.height(4.dp))
            NeedProgressBar(label = "Felicidad", value = sim.happiness)
        }
    }
}

@Composable
fun NeedProgressBar(label: String, value: Float) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = label, style = MaterialTheme.typography.bodySmall)
            Text(text = "\${value.toInt()}%", style = MaterialTheme.typography.bodySmall)
        }
        LinearProgressIndicator(
            progress = { value / 100f },
            modifier = Modifier.fillMaxWidth().height(6.dp),
        )
    }
}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ABADALABS SIMS AI ENTERPRISE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Android Room & Gemini AI Autonomous Sims</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Kotlin v2.0
              </span>
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Motor de simulación autónoma de vida impulsado por Google AI SDK (Gemini GenerativeModel),
              persistencia reactiva con Android Room Database y UI declarativa en Jetpack Compose.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAutoSimulating(!isAutoSimulating)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg ${
                isAutoSimulating
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20 animate-pulse"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20"
              }`}
            >
              {isAutoSimulating ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pausar Auto-Vida</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Auto-Simular Sims</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Sim</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveSubTab("live-simulator")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSubTab === "live-simulator"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/60"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Simulador Jetpack Compose</span>
          </button>

          <button
            onClick={() => setActiveSubTab("android-code")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSubTab === "android-code"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/60"
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Código Kotlin & Room DB</span>
          </button>

          <button
            onClick={() => setActiveSubTab("ai-mind")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSubTab === "ai-mind"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/60"
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Sandbox Gemini AI Mind</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE SIMULATOR (JETPACK COMPOSE REPLICA) */}
      {activeSubTab === "live-simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Sims Feed (Matches Jetpack Compose SimListScreen & SimCard) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">SimListScreen — Población Activa ({sims.length})</h2>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Room Database Flow Activo</span>
              </div>
            </div>

            {sims.length === 0 ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-medium">No hay Sims registrados en la base de datos Room.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400"
                >
                  Crear Primer Sim
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sims.map((sim) => (
                  <div
                    key={sim.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 shadow-lg transition duration-200 relative overflow-hidden group"
                  >
                    {/* Header: Name and AI Trigger Button */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-lg text-cyan-300">
                          {sim.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
                              {sim.name}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              ID: #{sim.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Room Entity synced</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerAiForSim(sim)}
                          disabled={sim.isThinking}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 text-xs font-bold transition disabled:opacity-50"
                          title="Actualizar por IA (GenerativeModel)"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${sim.isThinking ? "animate-spin" : ""}`} />
                          <span>{sim.isThinking ? "Consultando Gemini..." : "Decisión IA"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Needs Progress Bars (Exact Jetpack Compose NeedProgressBar replica) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-4">
                      {/* Hunger */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Utensils className="w-3.5 h-3.5 text-amber-400" /> Hambre
                          </span>
                          <span className="font-bold text-white">{Math.round(sim.hunger)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${getProgressColor(sim.hunger)}`}
                            style={{ width: `${sim.hunger}%` }}
                          />
                        </div>
                        <div className="flex gap-1 pt-1">
                          <button
                            onClick={() => boostSimNeed(sim.id, "hunger", 20)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            +Alimentar
                          </button>
                          <button
                            onClick={() => boostSimNeed(sim.id, "hunger", -15)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                          >
                            -Hambre
                          </button>
                        </div>
                      </div>

                      {/* Energy */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Battery className="w-3.5 h-3.5 text-cyan-400" /> Energía
                          </span>
                          <span className="font-bold text-white">{Math.round(sim.energy)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${getProgressColor(sim.energy)}`}
                            style={{ width: `${sim.energy}%` }}
                          />
                        </div>
                        <div className="flex gap-1 pt-1">
                          <button
                            onClick={() => boostSimNeed(sim.id, "energy", 25)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            +Dormir
                          </button>
                          <button
                            onClick={() => boostSimNeed(sim.id, "energy", -15)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                          >
                            -Cansar
                          </button>
                        </div>
                      </div>

                      {/* Happiness */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-rose-400" /> Felicidad
                          </span>
                          <span className="font-bold text-white">{Math.round(sim.happiness)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${getProgressColor(sim.happiness)}`}
                            style={{ width: `${sim.happiness}%` }}
                          />
                        </div>
                        <div className="flex gap-1 pt-1">
                          <button
                            onClick={() => boostSimNeed(sim.id, "happiness", 20)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            +Diversión
                          </button>
                          <button
                            onClick={() => boostSimNeed(sim.id, "happiness", -15)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                          >
                            -Aburrir
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Latest AI Thought / Decision Bubble */}
                    {sim.lastAction && (
                      <div className="bg-cyan-950/40 border border-cyan-500/20 rounded-xl p-3 mb-3 text-xs flex items-start gap-2.5">
                        <Brain className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-cyan-200">
                            Última Acción: "{sim.lastAction}"
                          </div>
                          <div className="text-slate-400 mt-0.5 text-[11px]">
                            {sim.lastReason}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Serialized Rolling Memories (3 Max) */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-indigo-400" />
                        <span>Memorias Recientes (Room JSON Serialization)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sim.memories.map((memo, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/80 flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <span>{memo}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Engine Stats & Telemetry */}
          <div className="space-y-6">
            {/* Architecture Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Arquitectura Android Enterprise</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200">1. Room SQLite Database</div>
                    <div className="text-slate-400 text-[11px]">
                      Entidad <code className="text-amber-300">SimEntity</code> con PrimaryKey autogenerada y <code className="text-amber-300">Flow&lt;List&lt;SimEntity&gt;&gt;</code> reactivo.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <Brain className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200">2. Google AI SDK (Gemini)</div>
                    <div className="text-slate-400 text-[11px]">
                      Modelo <code className="text-cyan-300">gemini-3.7-flash</code> con <code className="text-cyan-300">application/json</code> response MIME type y parsing seguro.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200">3. Coroutines SimViewModel</div>
                    <div className="text-slate-400 text-[11px]">
                      Gestión de ciclo de vida con <code className="text-indigo-300">viewModelScope.launch</code> y actualización de deltas.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200">4. Jetpack Compose UI</div>
                    <div className="text-slate-400 text-[11px]">
                      Material 3 <code className="text-emerald-300">Scaffold</code>, <code className="text-emerald-300">FloatingActionButton</code>, <code className="text-emerald-300">LazyColumn</code> y <code className="text-emerald-300">LinearProgressIndicator</code>.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Acciones Rápidas del Motor</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    sims.forEach((s) => triggerAiForSim(s));
                  }}
                  className="px-3 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold text-center transition"
                >
                  ⚡ Despertar Todos (IA)
                </button>

                <button
                  onClick={() => {
                    setSims((prev) =>
                      prev.map((s) => ({
                        ...s,
                        hunger: 100,
                        energy: 100,
                        happiness: 100,
                      }))
                    );
                  }}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold text-center transition"
                >
                  💖 Restaurar Necesidades
                </button>
              </div>

              <button
                onClick={async () => {
                  await fetch("/api/sims/reset", { method: "POST" });
                  fetchSims();
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 text-xs text-center transition"
              >
                Reiniciar Población Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANDROID KOTLIN & ROOM CODE VIEWER */}
      {activeSubTab === "android-code" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-cyan-400" />
                <span>Código Fuente Completo Kotlin (com.abadalabs.sims.enterprise)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Archivos listos para producción en Android Studio con Jetpack Compose y Google AI Client SDK.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyCode(kotlinFullCode, "full-kotlin")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition shadow-md"
              >
                {copiedSection === "full-kotlin" ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Todo el Código</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="ml-2">SimEnterpriseEngine.kt</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Kotlin 2.0 • Android Room 2.6 • Compose Material 3</span>
            </div>

            <pre className="p-6 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[600px] scrollbar-thin scrollbar-thumb-slate-700">
              <code>{kotlinFullCode}</code>
            </pre>
          </div>

          {/* Gradle Dependencies snippet */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Dependencias de Gradle (build.gradle.kts)</span>
              </h3>
              <button
                onClick={() =>
                  copyCode(
                    `dependencies {
    // Jetpack Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.02.01")
    implementation(composeBom)
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    
    // Android Room Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // Google AI SDK for Android (Gemini)
    implementation("com.google.ai.client.generativeai:generativeai:0.9.0")

    // KotlinX Serialization & Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
}`,
                    "gradle-deps"
                  )
                }
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedSection === "gradle-deps" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Gradle</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 text-xs font-mono text-cyan-300 border border-slate-800 overflow-x-auto">
              <code>{`dependencies {
    // Jetpack Compose Material 3
    implementation(platform("androidx.compose:compose-bom:2024.02.01"))
    implementation("androidx.compose.material3:material3")
    
    // Android Room Database & Coroutines
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    // Google AI Client SDK (Gemini GenerativeModel)
    implementation("com.google.ai.client.generativeai:generativeai:0.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
}`}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: GEMINI AI MIND SANDBOX */}
      {activeSubTab === "ai-mind" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sandbox Config */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase mb-2">
                <Brain className="w-3.5 h-3.5" />
                <span>Simulador de Prompts Gemini</span>
              </div>
              <h2 className="text-xl font-bold text-white">Laboratorio de Decisiones Autónomas</h2>
              <p className="text-xs text-slate-400 mt-1">
                Ajusta las necesidades del Sim y ejecuta el motor Gemini en tiempo real para observar el JSON de planificación estructurada devuelto.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Sim de Prueba</label>
                <input
                  type="text"
                  value={sandboxSimName}
                  onChange={(e) => setSandboxSimName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Hunger Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-300">Hambre actual:</span>
                  <span className="font-bold text-amber-400">{sandboxHunger}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sandboxHunger}
                  onChange={(e) => setSandboxHunger(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Energy Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-300">Energía actual:</span>
                  <span className="font-bold text-cyan-400">{sandboxEnergy}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sandboxEnergy}
                  onChange={(e) => setSandboxEnergy(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Happiness Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-300">Felicidad actual:</span>
                  <span className="font-bold text-rose-400">{sandboxHappiness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sandboxHappiness}
                  onChange={(e) => setSandboxHappiness(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              {/* Memories text */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Últimas Memorias (Separadas por comas)
                </label>
                <input
                  type="text"
                  value={sandboxMemories}
                  onChange={(e) => setSandboxMemories(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={testSandboxPlan}
                disabled={sandboxLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sandboxLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculando Plan Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Ejecutar SimActionPlan con Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sandbox Response Output */}
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Respuesta SimActionPlan (JSON Estructurado)</span>
                </h3>
                {sandboxResult && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    200 OK
                  </span>
                )}
              </div>

              {sandboxResult ? (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-semibold text-cyan-400 uppercase">Acción Recomendada:</div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>{sandboxResult.nextAction}</span>
                    </div>
                    <div className="text-xs text-slate-400 pt-1">
                      <span className="font-semibold text-slate-300">Razón: </span>
                      {sandboxResult.reason}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                      <div className="text-[11px] text-slate-400">Delta Hambre</div>
                      <div className={`text-base font-bold ${sandboxResult.hungerDelta >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                        {sandboxResult.hungerDelta > 0 ? `+${sandboxResult.hungerDelta}` : sandboxResult.hungerDelta}%
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                      <div className="text-[11px] text-slate-400">Delta Energía</div>
                      <div className={`text-base font-bold ${sandboxResult.energyDelta >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                        {sandboxResult.energyDelta > 0 ? `+${sandboxResult.energyDelta}` : sandboxResult.energyDelta}%
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                      <div className="text-[11px] text-slate-400">Delta Felicidad</div>
                      <div className={`text-base font-bold ${sandboxResult.happinessDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {sandboxResult.happinessDelta > 0 ? `+${sandboxResult.happinessDelta}` : sandboxResult.happinessDelta}%
                      </div>
                    </div>
                  </div>

                  <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto">
                    <code>{JSON.stringify(sandboxResult, null, 2)}</code>
                  </pre>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Ajusta los parámetros y presiona "Ejecutar SimActionPlan" para ver la respuesta generada por Gemini AI.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Sim (Equivalent to Jetpack Compose AlertDialog) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Crear Nuevo Sim (Room DB)</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Se insertará una nueva entidad <code className="text-cyan-300">SimEntity</code> con necesidades al 100% y las memorias iniciales estándar.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre del Sim (OutlinedTextField)
              </label>
              <input
                type="text"
                placeholder="Ej: Laura Palmer, Caleb Vatore..."
                value={newSimName}
                onChange={(e) => setNewSimName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNewSim();
                }}
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNewSim}
                disabled={!newSimName.trim() || isLoading}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Guardar Sim</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
