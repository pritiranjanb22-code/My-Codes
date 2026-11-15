package com.couplequest.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.couplequest.data.model.Challenge
import com.couplequest.data.model.ChallengeHistoryEntry
import com.couplequest.data.model.GameRoom
import com.couplequest.data.model.GameSession
import com.couplequest.data.model.Player

@Database(
    entities = [
        Player::class,
        GameRoom::class,
        Challenge::class,
        GameSession::class,
        ChallengeHistoryEntry::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun playerDao(): PlayerDao
    abstract fun gameRoomDao(): GameRoomDao
    abstract fun challengeDao(): ChallengeDao
    abstract fun gameSessionDao(): GameSessionDao
    abstract fun challengeHistoryDao(): ChallengeHistoryDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "couple_quest_db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}