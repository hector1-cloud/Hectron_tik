package com.abadalabs.sims.enterprise

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.generationConfig
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class SimActionPlan(
    val nextAction: String,
    val reason: String,
    val hungerDelta: Float,
    val energyDelta: Float,
    val happinessDelta: Float
)

/**
 * Servicio de IA impulsado por el SDK oficial de Google AI (Gemini) para Android.
 * Genera planes de acción cognitivos y decisiones de comportamiento autónomo para cada Sim.
 */
class GeminAiService(private val apiKey: String = "") {
    
    private val generativeModel = GenerativeModel(
        modelName = "gemini-2.5-flash-preview-09-2025",
        apiKey = apiKey,
        generationConfig = generationConfig {
            responseMimeType = "application/json"
            temperature = 0.8f
        }
    )

    suspend fun generateNextPlan(
        simName: String,
        hunger: Float,
        energy: Float,
        happiness: Float,
        recentMemories: List<String>
    ): SimActionPlan? {
        try {
            val memoriesJoined = if (recentMemories.isEmpty()) "Ninguna memoria reciente" else recentMemories.joinToString(", ")
            val prompt = """
                Actúa como el motor de IA de un Sim. Analiza el estado actual del Sim llamado $simName:
                - Hambre: $hunger / 100
                - Energía: $energy / 100
                - Felicidad: $happiness / 100
                - Últimas memorias: $memoriesJoined

                Devuelve un JSON estricto con la siguiente estructura exacta:
                {
                  "nextAction": "Acción recomendada en formato breve y expresivo en español",
                  "reason": "Razón corta de la acción",
                  "hungerDelta": <cambio numérico para hambre, ej: 15.0 o -8.0>,
                  "energyDelta": <cambio numérico para energía, ej: 25.0 o -5.0>,
                  "happinessDelta": <cambio numérico para felicidad, ej: 20.0 o -10.0>
                }
            """.trimIndent()

            val response = generativeModel.generateContent(prompt)
            val jsonText = response.text ?: return null
            
            return Json { ignoreUnknownKeys = true }.decodeFromString<SimActionPlan>(jsonText)
        } catch (e: Exception) {
            e.printStackTrace()
            // Fallback cognitivo en caso de desconexión
            return generateHeuristicPlan(hunger, energy, happiness)
        }
    }

    private fun generateHeuristicPlan(hunger: Float, energy: Float, happiness: Float): SimActionPlan {
        return when {
            hunger < 40f -> SimActionPlan(
                nextAction = "Cocinar y comer una comida completa",
                reason = "El nivel de hambre es crítico.",
                hungerDelta = 35f,
                energyDelta = -5f,
                happinessDelta = 10f
            )
            energy < 35f -> SimActionPlan(
                nextAction = "Dormir una siesta reparadora",
                reason = "El nivel de energía está agotado.",
                hungerDelta = -8f,
                energyDelta = 40f,
                happinessDelta = 5f
            )
            happiness < 45f -> SimActionPlan(
                nextAction = "Jugar videojuegos y escuchar música",
                reason = "Necesita distracción para mejorar el ánimo.",
                hungerDelta = -5f,
                energyDelta = -8f,
                happinessDelta = 30f
            )
            else -> SimActionPlan(
                nextAction = "Conversar con vecinos y socializar",
                reason = "Estado equilibrado, busca interacción social.",
                hungerDelta = -4f,
                energyDelta = -6f,
                happinessDelta = 15f
            )
        }
    }
}
