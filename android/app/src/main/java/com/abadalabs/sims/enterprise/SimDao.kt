package com.abadalabs.sims.enterprise

import androidx.room.*
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object (DAO) de Room para operaciones CRUD reactivas en la base de datos de Sims.
 */
@Dao
interface SimDao {
    @Query("SELECT * FROM sims ORDER BY id DESC")
    fun getAllSims(): Flow<List<SimEntity>>

    @Query("SELECT * FROM sims WHERE id = :id LIMIT 1")
    suspend fun getSimById(id: Long): SimEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSim(sim: SimEntity): Long

    @Update
    suspend fun updateSim(sim: SimEntity)

    @Delete
    suspend fun deleteSim(sim: SimEntity)
}
