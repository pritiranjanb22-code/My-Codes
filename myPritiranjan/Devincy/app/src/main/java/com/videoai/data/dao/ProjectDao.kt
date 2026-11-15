package com.videoai.data.dao

import androidx.room.*
import com.videoai.data.model.Project
import kotlinx.coroutines.flow.Flow

@Dao
interface ProjectDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(project: Project)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(projects: List<Project>)
    
    @Update
    suspend fun update(project: Project)
    
    @Delete
    suspend fun delete(project: Project)
    
    @Query("DELETE FROM projects WHERE id = :id")
    suspend fun deleteById(id: String): Int
    
    @Query("SELECT * FROM projects WHERE id = :id")
    suspend fun getById(id: String): Project?
    
    @Query("SELECT * FROM projects ORDER BY updatedAt DESC")
    fun getAll(): Flow<List<Project>>
    
    @Query("SELECT * FROM projects ORDER BY updatedAt DESC LIMIT :limit OFFSET :offset")
    suspend fun getPaged(limit: Int, offset: Int): List<Project>
    
    @Query("SELECT * FROM projects WHERE name LIKE :query ORDER BY updatedAt DESC")
    fun search(query: String): Flow<List<Project>>
    
    @Query("SELECT COUNT(*) FROM projects")
    suspend fun getCount(): Int
    
    @Query("UPDATE projects SET updatedAt = :timestamp WHERE id = :id")
    suspend fun updateTimestamp(id: String, timestamp: Long)
    
    @Query("DELETE FROM projects WHERE updatedAt < :threshold")
    suspend fun deleteOldProjects(threshold: Long): Int
}

@Dao
interface MediaDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(media: Media)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(mediaList: List<Media>)
    
    @Update
    suspend fun update(media: Media)
    
    @Delete
    suspend fun delete(media: Media)
    
    @Query("DELETE FROM media WHERE id = :id")
    suspend fun deleteById(id: String): Int
    
    @Query("SELECT * FROM media WHERE id = :id")
    suspend fun getById(id: String): Media?
    
    @Query("SELECT * FROM media WHERE type = :type ORDER BY dateAdded DESC")
    fun getByType(type: MediaType): Flow<List<Media>>
    
    @Query("SELECT * FROM media ORDER BY dateAdded DESC")
    fun getAll(): Flow<List<Media>>
    
    @Query("SELECT * FROM media ORDER BY dateAdded DESC LIMIT :limit OFFSET :offset")
    suspend fun getPaged(limit: Int, offset: Int): List<Media>
    
    @Query("SELECT * FROM media WHERE folder = :folder ORDER BY dateAdded DESC")
    fun getByFolder(folder: String): Flow<List<Media>>
    
    @Query("SELECT * FROM media WHERE name LIKE :query OR displayName LIKE :query ORDER BY dateAdded DESC")
    fun search(query: String): Flow<List<Media>>
    
    @Query("SELECT * FROM media WHERE isFavorite = 1 ORDER BY dateAdded DESC")
    fun getFavorites(): Flow<List<Media>>
    
    @Query("SELECT COUNT(*) FROM media")
    suspend fun getCount(): Int
    
    @Query("SELECT COUNT(*) FROM media WHERE type = :type")
    suspend fun getCountByType(type: MediaType): Int
    
    @Query("UPDATE media SET isFavorite = :favorite WHERE id = :id")
    suspend fun setFavorite(id: String, favorite: Boolean)
    
    @Query("DELETE FROM media WHERE dateAdded < :threshold")
    suspend fun deleteOldMedia(threshold: Long): Int
    
    @Query("SELECT DISTINCT folder FROM media WHERE folder IS NOT NULL")
    suspend fun getFolders(): List<String>
}

@Dao
interface ExportJobDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(job: ExportJob)
    
    @Update
    suspend fun update(job: ExportJob)
    
    @Query("SELECT * FROM export_jobs WHERE id = :id")
    suspend fun getById(id: String): ExportJob?
    
    @Query("SELECT * FROM export_jobs WHERE projectId = :projectId ORDER BY startedAt DESC")
    fun getByProject(projectId: String): Flow<List<ExportJob>>
    
    @Query("SELECT * FROM export_jobs WHERE status IN (:statuses) ORDER BY startedAt DESC")
    fun getByStatus(statuses: List<ExportStatus>): Flow<List<ExportJob>>
    
    @Query("SELECT * FROM export_jobs ORDER BY startedAt DESC LIMIT :limit")
    suspend fun getRecent(limit: Int): List<ExportJob>
    
    @Query("DELETE FROM export_jobs WHERE completedAt < :threshold")
    suspend fun deleteOldJobs(threshold: Long): Int
}

@Dao
interface AnalysisDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(analysis: VideoAnalysis)
    
    @Query("SELECT * FROM video_analysis WHERE mediaId = :mediaId")
    suspend fun getByMediaId(mediaId: String): VideoAnalysis?
    
    @Query("DELETE FROM video_analysis WHERE mediaId = :mediaId")
    suspend fun deleteByMediaId(mediaId: String)
}

@Dao
interface SettingsDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(setting: AppSetting)
    
    @Query("SELECT value FROM app_settings WHERE key = :key")
    suspend fun getString(key: String): String?
    
    @Query("SELECT value FROM app_settings WHERE key = :key")
    suspend fun getLong(key: String): Long?
    
    @Query("SELECT value FROM app_settings WHERE key = :key")
    suspend fun getBoolean(key: String): Boolean?
    
    @Query("SELECT value FROM app_settings WHERE key = :key")
    suspend fun getInt(key: String): Int?
    
    @Query("UPDATE app_settings SET value = :value WHERE key = :key")
    suspend fun setString(key: String, value: String)
    
    @Query("UPDATE app_settings SET value = :value WHERE key = :key")
    suspend fun setLong(key: String, value: Long)
    
    @Query("UPDATE app_settings SET value = :value WHERE key = :key")
    suspend fun setBoolean(key: String, value: Boolean)
    
    @Query("UPDATE app_settings SET value = :value WHERE key = :key")
    suspend fun setInt(key: String, value: Int)
    
    @Query("DELETE FROM app_settings WHERE key = :key")
    suspend fun delete(key: String)
    
    @Query("SELECT * FROM app_settings")
    suspend fun getAll(): List<AppSetting>
}

@Entity(tableName = "app_settings")
data class AppSetting(
    @PrimaryKey
    val key: String,
    val value: String
)