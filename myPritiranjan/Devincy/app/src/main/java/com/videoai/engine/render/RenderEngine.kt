package com.videoai.engine.render

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import com.videoai.data.model.*
import com.videoai.data.repository.MediaRepository
import com.videoai.engine.ffmpeg.FFmpegCommandBuilder
import com.videoai.engine.ffmpeg.FFmpegWrapper
import com.videoai.engine.ffmpeg.ProxyGenerator
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.*
import java.io.File
import javax.inject.Inject

@AndroidEntryPoint
class ExportService : LifecycleService() {
    @Inject
    lateinit var mediaRepository: MediaRepository
    
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val jobs = mutableMapOf<String, ExportJob>()
    private var notificationManager: NotificationManager? = null
    private val CHANNEL_ID = "videoai_export"
    private val NOTIFICATION_ID = 1001
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Video Export",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background video export progress"
                setShowBadge(false)
            }
            notificationManager?.createNotificationChannel(channel)
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.let {
            val job = it.getParcelableExtra<ExportJob>("job")
            job?.let { startExport(it) }
        }
        return START_STICKY
    }
    
    private fun startExport(job: ExportJob) {
        jobs[job.id] = job
        scope.launch {
            try {
                updateJob(job.copy(status = ExportStatus.PREPARING, progress = 0.05f))
                showNotification(job, "Preparing export...")
                
                // Collect media files
                val mediaMap = collectMedia(job)
                
                updateJob(job.copy(status = ExportStatus.RENDERING, progress = 0.1f))
                showNotification(job, "Rendering video...")
                
                // Build FFmpeg command
                val builder = FFmpegCommandBuilder(job.project, mediaMap)
                val command = builder.buildExportCommand(job.settings, job.outputPath)
                
                updateJob(job.copy(status = ExportStatus.ENCODING, progress = 0.2f))
                showNotification(job, "Encoding...")
                
                // Execute export
                val startTime = System.currentTimeMillis()
                val result = FFmpegWrapper.execute(command)
                val renderTime = System.currentTimeMillis() - startTime
                
                if (result == 0) {
                    val outputFile = File(job.outputPath)
                    val fileSize = outputFile.length()
                    
                    updateJob(job.copy(
                        status = ExportStatus.COMPLETED,
                        progress = 1f,
                        completedAt = System.currentTimeMillis(),
                        outputFileSize = fileSize,
                        renderTimeMs = renderTime
                    ))
                    showNotification(job, "Export complete!", true)
                } else {
                    val error = FFmpegWrapper.getLastOutput()
                    updateJob(job.copy(
                        status = ExportStatus.FAILED,
                        error = error,
                        completedAt = System.currentTimeMillis()
                    ))
                    showNotification(job, "Export failed: $error", true)
                }
            } catch (e: Exception) {
                updateJob(job.copy(
                    status = ExportStatus.FAILED,
                    error = e.message,
                    completedAt = System.currentTimeMillis()
                ))
                showNotification(job, "Export failed: ${e.message}", true)
            } finally {
                jobs.remove(job.id)
                if (jobs.isEmpty()) {
                    stopForeground(true)
                    stopSelf()
                }
            }
        }
    }
    
    private fun collectMedia(job: ExportJob): Map<String, Media> {
        val mediaMap = mutableMapOf<String, Media>()
        val mediaList = mediaRepository.getAll().first()
        for (media in mediaList) {
            mediaMap[media.id] = media
        }
        return mediaMap
    }
    
    private fun updateJob(updatedJob: ExportJob) {
        jobs[updatedJob.id] = updatedJob
        // Broadcast update to UI
        val intent = Intent("com.videoai.EXPORT_PROGRESS").apply {
            putExtra("job", updatedJob)
        }
        sendBroadcast(intent)
    }
    
    private fun showNotification(job: ExportJob, message: String, complete: Boolean = false) {
        val progress = (job.progress * 100).toInt()
        
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Exporting: ${job.project.name}")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setProgress(100, progress, false)
            .setOngoing(!complete)
            .setAutoCancel(complete)
            .setOnlyAlertOnce(true)
        
        if (complete) {
            builder.setProgress(0, 0, false)
        }
        
        val notification = builder.build()
        
        if (complete) {
            notificationManager?.notify(NOTIFICATION_ID + job.id.hashCode(), notification)
            stopForeground(false)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }
    
    fun cancelExport(jobId: String) {
        val job = jobs[jobId]
        if (job != null) {
            FFmpegWrapper.cancel(job.id.toLong())
            jobs.remove(jobId)
        }
    }
    
    fun getJob(jobId: String): ExportJob? = jobs[jobId]
    
    fun getAllJobs(): List<ExportJob> = jobs.values.toList()
    
    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}

class RenderEngine(
    private val projectRepository: com.videoai.data.repository.ProjectRepository,
    private val mediaRepository: com.videoai.data.repository.MediaRepository,
    private val exportRepository: com.videoai.data.repository.ExportRepository,
    private val proxyGenerator: ProxyGenerator
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _renderStatus = MutableStateFlow<RenderStatus>(RenderStatus())
    val renderStatus: StateFlow<RenderStatus> = _renderStatus
    
    suspend fun exportVideo(
        projectId: String,
        settings: ExportSettings,
        outputPath: String? = null
    ): ExportJob {
        val project = projectRepository.getById(projectId) 
            ?: throw IllegalArgumentException("Project not found: $projectId")
        
        val finalOutputPath = outputPath ?: generateOutputPath(project, settings)
        File(finalOutputPath).parentFile?.mkdirs()
        
        val job = ExportJob(
            projectId = projectId,
            settings = settings,
            outputPath = finalOutputPath
        )
        
        exportRepository.insert(job)
        
        // Start export service
        val intent = Intent(android.app.ApplicationProvider.getContext<Context>(), ExportService::class.java)
            .putExtra("job", job)
        android.app.ApplicationProvider.getContext<Context>().startForegroundService(intent)
        
        return job
    }
    
    suspend fun exportProject(projectId: String, outputPath: String? = null): String {
        val project = projectRepository.getById(projectId)
            ?: throw IllegalArgumentException("Project not found: $projectId")
        
        val finalOutputPath = outputPath ?: generateProjectOutputPath(project)
        File(finalOutputPath).parentFile?.mkdirs()
        
        // Serialize project to JSON
        val json = kotlinx.serialization.json.Json { prettyPrint = true }
        val projectJson = json.encodeToString(project)
        File(finalOutputPath).writeText(projectJson)
        
        return finalOutputPath
    }
    
    fun generatePreview(projectId: String, timeUs: Long): String? {
        // Generate a preview frame at the given time
        // This would use FFmpeg to extract a frame
        return null // Placeholder
    }
    
    private fun generateOutputPath(project: Project, settings: ExportSettings): String {
        val exportsDir = File(
            android.content.ContextCompat.getFilesDir(android.app.ApplicationProvider.getContext<Context>()!!),
            "exports"
        )
        exportsDir.mkdirs()
        
        val ext = when (settings.containerFormat) {
            ExportSettings.ContainerFormat.MP4 -> "mp4"
            ExportSettings.ContainerFormat.MOV -> "mov"
            ExportSettings.ContainerFormat.MKV -> "mkv"
            ExportSettings.ContainerFormat.WEBM -> "webm"
            ExportSettings.ContainerFormat.TS -> "ts"
        }
        
        val timestamp = System.currentTimeMillis()
        val safeName = project.name.replace("[^a-zA-Z0-9_-]".toRegex(), "_")
        return File(exportsDir, "${safeName}_${timestamp}.$ext").absolutePath
    }
    
    private fun generateProjectOutputPath(project: Project): String {
        val exportsDir = File(
            android.content.ContextCompat.getFilesDir(android.app.ApplicationProvider.getContext<Context>()!!),
            "exports"
        )
        exportsDir.mkdirs()
        
        val timestamp = System.currentTimeMillis()
        val safeName = project.name.replace("[^a-zA-Z0-9_-]".toRegex(), "_")
        return File(exportsDir, "${safeName}_${timestamp}.videoai").absolutePath
    }
    
    fun cancelExport(jobId: String) {
        // Send cancel to service
        val intent = Intent("com.videoai.CANCEL_EXPORT").apply {
            putExtra("jobId", jobId)
        }
        android.app.ApplicationProvider.getContext<Context>().sendBroadcast(intent)
    }
    
    fun getExportStatus(jobId: String): ExportStatus? {
        // Would query from service or repository
        return null // Placeholder
    }
}

class PreviewRenderer(
    private val proxyGenerator: ProxyGenerator
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val previewCache = mutableMapOf<String, String>()
    
    suspend fun renderPreview(
        project: Project,
        timeUs: Long,
        width: Int,
        height: Int
    ): String? {
        // Render a preview frame using proxies for speed
        val cacheKey = "${project.id}_${timeUs}_${width}x$height"
        
        return previewCache[cacheKey] ?: scope.async {
            // Build simplified filter graph for preview
            val command = buildPreviewCommand(project, timeUs, width, height)
            val outputPath = getPreviewPath(project.id, timeUs)
            File(outputPath).parentFile?.mkdirs()
            
            val result = FFmpegWrapper.execute(command)
            if (result == 0) {
                previewCache[cacheKey] = outputPath
                outputPath
            } else {
                null
            }
        }.await()
    }
    
    private fun buildPreviewCommand(project: Project, timeUs: Long, width: Int, height: Int): String {
        // Simplified command for fast preview
        // Uses proxies and renders only the frame at timeUs
        return "ffmpeg -y -ss ${timeUs / 1_000_000.0} -i \"placeholder\" -vframes 1 -vf \"scale=$width:$height\" \"${getPreviewPath(project.id, timeUs)}\""
    }
    
    private fun getPreviewPath(projectId: String, timeUs: Long): String {
        val cacheDir = File(
            android.content.ContextCompat.getCacheDir(android.app.ApplicationProvider.getContext<Context>()!!),
            "previews"
        )
        cacheDir.mkdirs()
        return File(cacheDir, "${projectId}_${timeUs}.jpg").absolutePath
    }
    
    fun clearCache() {
        previewCache.clear()
    }
}