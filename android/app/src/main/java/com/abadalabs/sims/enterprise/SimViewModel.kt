package com.abadalabs.sims.enterprise

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * ViewModel para gestionar el estado de los Sims y orquestar las llamadas cognitivas a Gemini AI.
 */
class SimViewModel(private val simDao: SimDao, apiKey: String = "") : ViewModel() {
    private val aiService = GeminAiService(apiKey)

    val sims: Flow<List<SimEntity>> = simDao.getAllSims()

    private val _isProcessingAi = MutableStateFlow<Map<Long, Boolean>>(emptyMap())
    val isProcessingAi: StateFlow<Map<Long, Boolean>> = _isProcessingAi.asStateFlow()

    private val _lastActionMessage = MutableStateFlow<String?>(null)
    val lastActionMessage: StateFlow<String?> = _lastActionMessage.asStateFlow()

    fun addNewSim(name: String) {
        if (name.isBlank()) return
        viewModelScope.launch {
            val initialMemories = listOf("Llegó a la ciudad", "Comenzó su nueva vida")
            val newSim = SimEntity(
                name = name.trim(),
                hunger = 80f,
                energy = 80f,
                happiness = 90f,
                memories = Json.encodeToString(initialMemories)
            )
            simDao.insertSim(newSim)
            _lastActionMessage.value = "¡Sim '${name.trim()}' creado exitosamente!"
        }
    }

    fun triggerAiNeedUpdate(sim: SimEntity) {
        viewModelScope.launch {
            _isProcessingAi.value = _isProcessingAi.value + (sim.id to true)
            try {
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
                    _lastActionMessage.value = "${sim.name}: ${plan.nextAction} (${plan.reason})"
                }
            } finally {
                _isProcessingAi.value = _isProcessingAi.value - sim.id
            }
        }
    }

    fun deleteSim(sim: SimEntity) {
        viewModelScope.launch {
            simDao.deleteSim(sim)
            _lastActionMessage.value = "Sim '${sim.name}' eliminado."
        }
    }
}

class SimViewModelFactory(private val simDao: SimDao, private val apiKey: String = "") : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(SimViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return SimViewModel(simDao, apiKey) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
