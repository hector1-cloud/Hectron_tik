package com.abadalabs.sims.enterprise

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

/**
 * Entidad Sim para la base de datos Room de Android
 * Representa el estado biológico y emocional del Sim junto a sus últimas 3 memorias serializadas.
 */
@Entity(tableName = "sims")
@Serializable
data class SimEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val hunger: Float = 100f,    // 0 a 100
    val energy: Float = 100f,    // 0 a 100
    val happiness: Float = 100f, // 0 a 100
    val memories: String = "[]"  // JSON serializado de las últimas 3 memorias
)
