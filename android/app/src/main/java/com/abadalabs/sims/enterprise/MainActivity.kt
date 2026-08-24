package com.abadalabs.sims.enterprise

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color

class MainActivity : ComponentActivity() {
    
    private val simViewModel: SimViewModel by viewModels {
        val database = SimDatabase.getDatabase(this)
        // Puedes pasar tu API key de Gemini o dejarla configurable desde el entorno
        SimViewModelFactory(database.simDao(), apiKey = "")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            val darkTheme = isSystemInDarkTheme()
            val colorScheme = if (darkTheme) {
                darkColorScheme(
                    primary = Color(0xFF10B981),
                    secondary = Color(0xFF06B6D4),
                    surface = Color(0xFF0F172A),
                    surfaceVariant = Color(0xFF1E293B)
                )
            } else {
                lightColorScheme(
                    primary = Color(0xFF059669),
                    secondary = Color(0xFF0891B2),
                    surface = Color(0xFFFFFFFF),
                    surfaceVariant = Color(0xFFF1F5F9)
                )
            }

            MaterialTheme(colorScheme = colorScheme) {
                val sims by simViewModel.sims.collectAsState(initial = emptyList())
                val isProcessingAi by simViewModel.isProcessingAi.collectAsState()
                val lastActionMessage by simViewModel.lastActionMessage.collectAsState()

                SimListScreen(
                    sims = sims,
                    isProcessingAi = isProcessingAi,
                    statusMessage = lastActionMessage,
                    onAddSimClick = { name -> simViewModel.addNewSim(name) },
                    onTriggerAi = { sim -> simViewModel.triggerAiNeedUpdate(sim) },
                    onDeleteSim = { sim -> simViewModel.deleteSim(sim) }
                )
            }
        }
    }
}
