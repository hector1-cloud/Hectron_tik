package com.abadalabs.sims.enterprise

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

/**
 * Base de datos Room para la persistencia local de Sims.
 */
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
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
