package com.videoai.ai.analysis

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
import com.videoai.data.model.Media
import com.videoai.data.model.VideoAnalysis
import com.videoai.data.repository.AnalysisRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class AnalysisService : LifecycleService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var analysisManager: AnalysisManager? = null
    private var analysisRepository: AnalysisRepository? = null
    private var notificationManager: NotificationManager? = null
    private val CHANNEL_ID = "videoai_analysis"
    private val NOTIFICATION_ID = 2001
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Initialize analysis manager and repository
        // These would be injected via Hilt in production
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Video Analysis",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background video analysis progress"
                setShowBadge(false)
            }
            notificationManager?.createNotificationChannel(channel)
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.let {
            val media = it.getParcelableExtra<Media>("media")
            val types = it.getParcelableArrayList<AnalysisType>("types")?.toSet() 
                ?: AnalysisType.values().toSet()
            
            media?.let { startAnalysis(it, types) }
        }
        return START_STICKY
    }
    
    private fun startAnalysis(media: Media, types: Set<AnalysisType>) {
        scope.launch {
            try {
                val analysisId = media.id
                updateNotification(analysisId, "Starting analysis...", 0)
                
                val progressCallback = { progress: Float, stage: String ->
                    updateNotification(analysisId, stage, progress)
                }
                
                // Perform analysis
                val analysis = analysisManager?.analyze(media, types) 
                    ?: VideoAnalysis(mediaId = media.id, duration = media.duration)
                
                // Save to repository
                analysisRepository?.save(analysis)
                
                updateNotification(analysisId, "Analysis complete", 1f, true)
                
                // Broadcast completion
                val broadcastIntent = Intent("com.videoai.ANALYSIS_COMPLETE").apply {
                    putExtra("mediaId", media.id)
                    putExtra("analysis", analysis)
                }
                sendBroadcast(broadcastIntent)
                
            } catch (e: Exception) {
                updateNotification(media.id, "Analysis failed: ${e.message}", 0f, true)
            }
        }
    }
    
    private fun updateNotification(analysisId: String, message: String, progress: Float, complete: Boolean = false) {
        val progressInt = (progress * 100).toInt()
        
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Analyzing: ${media.name}")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setProgress(100, progressInt, false)
            .setOngoing(!complete)
            .setAutoCancel(complete)
            .setOnlyAlertOnce(true)
        
        if (complete) {
            builder.setProgress(0, 0, false)
        }
        
        val notification = builder.build()
        
        if (complete) {
            notificationManager?.notify(NOTIFICATION_ID + analysisId.hashCode(), notification)
            stopForeground(false)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }
    
    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}