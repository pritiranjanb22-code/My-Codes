package com.videoai

import android.app.Application
import android.content.Context
import com.videoai.data.dao.VideoAIDatabase
import com.videoai.data.repository.*
import com.videoai.engine.ffmpeg.FFmpegWrapper
import com.videoai.engine.ffmpeg.ProxyGenerator
import com.videoai.engine.photo.PhotoEngine
import com.videoai.engine.render.RenderEngine
import com.videoai.engine.timeline.CommandEngine
import com.videoai.engine.timeline.TimelineEngine
import com.videoai.mcp.auth.AuthManager
import com.videoai.mcp.server.McpServer
import dagger.hilt.android.HiltAndroidApp
import dagger.hilt.android.EntryPointAccessors
import dagger.hilt.android.EntryPoints
import javax.inject.Inject
import javax.inject.Singleton

@HiltAndroidApp
class VideoAIApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize FFmpeg
        FFmpegWrapper.initialize()
        
        // Initialize database
        VideoAIDatabase.getInstance(this)
    }
    
    companion object {
        lateinit var instance: VideoAIApplication
            private set
    }
}

// Hilt Modules
@dagger.Module
@InstallIn(dagger.hilt.components.SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@dagger.hilt.android.qualifiers.ApplicationContext context: Context): VideoAIDatabase {
        return VideoAIDatabase.getInstance(context)
    }
    
    @Provides
    @Singleton
    fun provideProjectDao(database: VideoAIDatabase): com.videoai.data.dao.ProjectDao {
        return database.projectDao()
    }
    
    @Provides
    @Singleton
    fun provideMediaDao(database: VideoAIDatabase): com.videoai.data.dao.MediaDao {
        return database.mediaDao()
    }
    
    @Provides
    @Singleton
    fun provideExportJobDao(database: VideoAIDatabase): com.videoai.data.dao.ExportJobDao {
        return database.exportJobDao()
    }
    
    @Provides
    @Singleton
    fun provideAnalysisDao(database: VideoAIDatabase): com.videoai.data.dao.AnalysisDao {
        return database.analysisDao()
    }
    
    @Provides
    @Singleton
    fun provideSettingsDao(database: VideoAIDatabase): com.videoai.data.dao.SettingsDao {
        return database.settingsDao()
    }
}

@dagger.Module
@InstallIn(dagger.hilt.components.SingletonComponent::class)
object RepositoryModule {
    @Provides
    @Singleton
    fun provideProjectRepository(dao: com.videoai.data.dao.ProjectDao): ProjectRepository {
        return ProjectRepository(dao)
    }
    
    @Provides
    @Singleton
    fun provideMediaScanner(@dagger.hilt.android.qualifiers.ApplicationContext context: Context): MediaScanner {
        return MediaScanner(context)
    }
    
    @Provides
    @Singleton
    fun provideMediaRepository(dao: com.videoai.data.dao.MediaDao, scanner: MediaScanner): MediaRepository {
        return MediaRepository(dao, scanner)
    }
    
    @Provides
    @Singleton
    fun provideExportRepository(dao: com.videoai.data.dao.ExportJobDao): ExportRepository {
        return ExportRepository(dao)
    }
    
    @Provides
    @Singleton
    fun provideAnalysisRepository(dao: com.videoai.data.dao.AnalysisDao): AnalysisRepository {
        return AnalysisRepository(dao)
    }
    
    @Provides
    @Singleton
    fun provideSettingsRepository(dao: com.videoai.data.dao.SettingsDao): SettingsRepository {
        return SettingsRepository(dao)
    }
}

@dagger.Module
@InstallIn(dagger.hilt.components.SingletonComponent::class)
object EngineModule {
    @Provides
    @Singleton
    fun provideTimelineEngine(
        projectRepository: ProjectRepository,
        mediaRepository: MediaRepository
    ): TimelineEngine {
        return TimelineEngine(projectRepository, mediaRepository)
    }
    
    @Provides
    @Singleton
    fun provideCommandEngine(
        projectRepository: ProjectRepository,
        mediaRepository: MediaRepository,
        settingsRepository: SettingsRepository,
        timelineEngine: TimelineEngine
    ): CommandEngine {
        return CommandEngine(
            projectRepository = projectRepository,
            mediaRepository = mediaRepository,
            settingsRepository = settingsRepository,
            timelineEngine = timelineEngine
        )
    }
    
    @Provides
    @Singleton
    fun provideProxyGenerator(settingsRepository: SettingsRepository): ProxyGenerator {
        return ProxyGenerator(settingsRepository)
    }
    
    @Provides
    @Singleton
    fun provideRenderEngine(
        projectRepository: ProjectRepository,
        mediaRepository: MediaRepository,
        exportRepository: ExportRepository,
        proxyGenerator: ProxyGenerator
    ): RenderEngine {
        return RenderEngine(
            projectRepository = projectRepository,
            mediaRepository = mediaRepository,
            exportRepository = exportRepository,
            proxyGenerator = proxyGenerator
        )
    }
    
    @Provides
    @Singleton
    fun providePhotoEngine(proxyGenerator: ProxyGenerator): PhotoEngine {
        return PhotoEngine(proxyGenerator)
    }
}

@dagger.Module
@InstallIn(dagger.hilt.components.SingletonComponent::class)
object McpModule {
    @Provides
    @Singleton
    fun provideAuthManager(@dagger.hilt.android.qualifiers.ApplicationContext context: Context): AuthManager {
        return AuthManager(context)
    }
    
    @Provides
    @Singleton
    fun provideMcpServer(
        context: Context,
        projectRepository: ProjectRepository,
        mediaRepository: MediaRepository,
        exportRepository: ExportRepository,
        analysisRepository: AnalysisRepository,
        settingsRepository: SettingsRepository,
        commandEngine: CommandEngine,
        renderEngine: RenderEngine,
        authManager: AuthManager
    ): McpServer {
        val serverInfo = com.videoai.data.model.ServerInfo(
            host = getLocalHostname(),
            port = authManager.getPort(),
            token = authManager.getOrCreateToken()
        )
        
        return McpServer(
            context = context,
            projectRepository = projectRepository,
            mediaRepository = mediaRepository,
            exportRepository = exportRepository,
            analysisRepository = analysisRepository,
            settingsRepository = settingsRepository,
            commandEngine = commandEngine,
            renderEngine = renderEngine,
            authToken = authManager.getOrCreateToken(),
            serverInfo = serverInfo
        )
    }
    
    private fun getLocalHostname(): String {
        try {
            return java.net.InetAddress.getLocalHost().hostName
        } catch (e: Exception) {
            return "videoai-phone.local"
        }
    }
}

@dagger.Module
@InstallIn(dagger.hilt.components.SingletonComponent::class)
object AiModule {
    @Provides
    @Singleton
    fun provideAnalysisManager(
        @dagger.hilt.android.qualifiers.ApplicationContext context: Context
    ): com.videoai.ai.analysis.AnalysisManager {
        val providers = listOf(
            com.videoai.ai.analysis.AnalysisProvider.LocalMediaPipe(),
            com.videoai.ai.analysis.AnalysisProvider.LocalMlKit(),
            com.videoai.ai.analysis.AnalysisProvider.LocalFfmpeg()
        )
        return com.videoai.ai.analysis.AnalysisManager(providers, context)
    }
}

// Entry point for services
class McpServerEntryPoint : EntryPoints.EntryPoint {
    fun mcpServer(): McpServer
}

class AnalysisServiceEntryPoint : EntryPoints.EntryPoint {
    fun analysisManager(): com.videoai.ai.analysis.AnalysisManager
}