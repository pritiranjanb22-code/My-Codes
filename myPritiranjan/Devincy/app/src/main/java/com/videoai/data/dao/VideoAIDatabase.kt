package com.videoai.data.dao

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.videoai.data.model.*

@Database(
    entities = [
        Project::class,
        Media::class,
        ExportJob::class,
        VideoAnalysis::class,
        AppSetting::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class VideoAIDatabase : RoomDatabase() {
    abstract fun projectDao(): ProjectDao
    abstract fun mediaDao(): MediaDao
    abstract fun exportJobDao(): ExportJobDao
    abstract fun analysisDao(): AnalysisDao
    abstract fun settingsDao(): SettingsDao
    
    companion object {
        @Volatile
        private var INSTANCE: VideoAIDatabase? = null
        
        fun getInstance(context: Context): VideoAIDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    VideoAIDatabase::class.java,
                    "videoai.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}