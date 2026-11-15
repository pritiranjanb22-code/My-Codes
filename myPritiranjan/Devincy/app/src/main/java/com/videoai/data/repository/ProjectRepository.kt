package com.videoai.data.repository

import com.videoai.data.dao.ProjectDao
import com.videoai.data.model.Project
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class ProjectRepository(private val dao: ProjectDao) {
    suspend fun create(project: Project) {
        dao.insert(project)
    }
    
    suspend fun save(project: Project) {
        dao.update(project.copy(updatedAt = System.currentTimeMillis()))
    }
    
    suspend fun delete(projectId: String) {
        dao.deleteById(projectId)
    }
    
    fun getAll(): Flow<List<Project>> = dao.getAll()
    
    suspend fun getById(projectId: String): Project? = dao.getById(projectId)
    
    suspend fun getPaged(limit: Int, offset: Int): List<Project> = dao.getPaged(limit, offset)
    
    fun search(query: String): Flow<List<Project>> = dao.search("%$query%")
    
    suspend fun getCount(): Int = dao.getCount()
    
    suspend fun duplicate(projectId: String, newName: String?): Project? {
        val original = dao.getById(projectId)
        return original?.let {
            val copy = it.copy(
                id = java.util.UUID.randomUUID().toString(),
                name = newName ?: "${it.name} Copy",
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )
            dao.insert(copy)
            copy
        }
    }
}

class MediaRepository(
    private val dao: MediaDao,
    private val scanner: MediaScanner
) {
    suspend fun insert(media: com.videoai.data.model.Media) {
        dao.insert(media)
    }
    
    suspend fun insertAll(mediaList: List<com.videoai.data.model.Media>) {
        dao.insertAll(mediaList)
    }
    
    suspend fun update(media: com.videoai.data.model.Media) {
        dao.update(media.copy(dateModified = System.currentTimeMillis()))
    }
    
    suspend fun delete(mediaId: String) {
        dao.deleteById(mediaId)
    }
    
    suspend fun getById(mediaId: String): com.videoai.data.model.Media? = dao.getById(mediaId)
    
    fun getByType(type: com.videoai.data.model.MediaType): Flow<List<com.videoai.data.model.Media>> = dao.getByType(type)
    
    fun getAll(): Flow<List<com.videoai.data.model.Media>> = dao.getAll()
    
    suspend fun getPaged(limit: Int, offset: Int): List<com.videoai.data.model.Media> = dao.getPaged(limit, offset)
    
    fun getByFolder(folder: String): Flow<List<com.videoai.data.model.Media>> = dao.getByFolder(folder)
    
    fun search(query: String): Flow<List<com.videoai.data.model.Media>> = dao.search("%$query%")
    
    fun getFavorites(): Flow<List<com.videoai.data.model.Media>> = dao.getFavorites()
    
    suspend fun getCount(): Int = dao.getCount()
    
    suspend fun getCountByType(type: com.videoai.data.model.MediaType): Int = dao.getCountByType(type)
    
    suspend fun setFavorite(mediaId: String, favorite: Boolean) {
        dao.setFavorite(mediaId, favorite)
    }
    
    suspend fun getFolders(): List<String> = dao.getFolders()
    
    // Media scanning
    suspend fun scanAllMedia(): ScanResult = scanner.scanAllMedia()
    
    suspend fun scanMediaType(type: com.videoai.data.model.MediaType): List<com.videoai.data.model.Media> = scanner.scanMediaType(type)
    
    suspend fun importFromUri(uri: android.net.Uri, type: com.videoai.data.model.MediaType): com.videoai.data.model.Media = scanner.importFromUri(uri, type)
}

class ExportRepository(private val dao: ExportJobDao) {
    suspend fun insert(job: com.videoai.data.model.ExportJob) {
        dao.insert(job)
    }
    
    suspend fun update(job: com.videoai.data.model.ExportJob) {
        dao.update(job)
    }
    
    suspend fun getById(jobId: String): com.videoai.data.model.ExportJob? = dao.getById(jobId)
    
    fun getByProject(projectId: String): Flow<List<com.videoai.data.model.ExportJob>> = dao.getByProject(projectId)
    
    fun getActiveJobs(): Flow<List<com.videoai.data.model.ExportJob>> = 
        dao.getByStatus(listOf(
            com.videoai.data.model.ExportStatus.PENDING,
            com.videoai.data.model.ExportStatus.QUEUED,
            com.videoai.data.model.ExportStatus.PREPARING,
            com.videoai.data.model.ExportStatus.RENDERING,
            com.videoai.data.model.ExportStatus.ENCODING,
            com.videoai.data.model.ExportStatus.FINALIZING
        ))
    
    suspend fun getRecent(limit: Int): List<com.videoai.data.model.ExportJob> = dao.getRecent(limit)
}

class AnalysisRepository(private val dao: AnalysisDao) {
    suspend fun save(analysis: com.videoai.data.model.VideoAnalysis) {
        dao.insert(analysis)
    }
    
    suspend fun getByMediaId(mediaId: String): com.videoai.data.model.VideoAnalysis? = dao.getByMediaId(mediaId)
    
    suspend fun deleteByMediaId(mediaId: String) {
        dao.deleteByMediaId(mediaId)
    }
}

class SettingsRepository(private val dao: SettingsDao) {
    private val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }
    
    suspend fun getString(key: String, default: String = ""): String =
        dao.getString(key) ?: default
    
    suspend fun setString(key: String, value: String) {
        dao.setString(key, value)
    }
    
    suspend fun getLong(key: String, default: Long = 0L): Long =
        dao.getLong(key) ?: default
    
    suspend fun setLong(key: String, value: Long) {
        dao.setLong(key, value)
    }
    
    suspend fun getBoolean(key: String, default: Boolean = false): Boolean =
        dao.getBoolean(key) ?: default
    
    suspend fun setBoolean(key: String, value: Boolean) {
        dao.setBoolean(key, value)
    }
    
    suspend fun getInt(key: String, default: Int = 0): Int =
        dao.getInt(key) ?: default
    
    suspend fun setInt(key: String, value: Int) {
        dao.setInt(key, value)
    }
    
    suspend fun getObject<T: Any>(key: String, clazz: KClass<T>): T? {
        val jsonStr = dao.getString(key)
        return jsonStr?.let { json.decodeFromString(it) }
    }
    
    suspend fun setObject<T: Any>(key: String, value: T) {
        val jsonStr = json.encodeToString(value)
        dao.setString(key, jsonStr)
    }
    
    companion object {
        const val KEY_AUTH_TOKEN = "auth_token"
        const val KEY_SERVER_PORT = "server_port"
        const val KEY_AUTOMATION_MODE = "automation_mode"
        const val KEY_PROXY_QUALITY = "proxy_quality"
        const val KEY_AUTO_SAVE = "auto_save"
        const val KEY_HARDWARE_ACCEL = "hardware_accel"
        const val KEY_AI_PROVIDER = "ai_provider"
        const val KEY_OLLAMA_URL = "ollama_url"
        const val KEY_CLOUD_API_KEY = "cloud_api_key"
        const val KEY_CLOUD_API_URL = "cloud_api_url"
        const val KEY_LAST_PROJECT_ID = "last_project_id"
        const val KEY_THEME = "theme"
        const val KEY_LANGUAGE = "language"
    }
}