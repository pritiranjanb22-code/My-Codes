package com.videoai.mcp.server

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.videoai.data.repository.*
import com.videoai.engine.ffmpeg.ProxyGenerator
import com.videoai.engine.render.RenderEngine
import com.videoai.engine.timeline.CommandEngine
import com.videoai.engine.timeline.TimelineEngine
import com.videoai.mcp.auth.AuthManager
import com.videoai.mcp.transport.McpWebSocketServer
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import javax.inject.Inject

@AndroidEntryPoint
class McpServerService : Service() {
    @Inject
    lateinit var projectRepository: ProjectRepository
    
    @Inject
    lateinit var mediaRepository: MediaRepository
    
    @Inject
    lateinit var exportRepository: ExportRepository
    
    @Inject
    lateinit var analysisRepository: AnalysisRepository
    
    @Inject
    lateinit var settingsRepository: SettingsRepository
    
    @Inject
    lateinit var commandEngine: CommandEngine
    
    @Inject
    lateinit var renderEngine: RenderEngine
    
    @Inject
    lateinit var authManager: AuthManager
    
    @Inject
    lateinit var timelineEngine: TimelineEngine
    
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var webSocketServer: McpWebSocketServer? = null
    private var mcpServer: McpServer? = null
    
    override fun onCreate() {
        super.onCreate()
        initializeServer()
    }
    
    private fun initializeServer() {
        scope.launch {
            val token = authManager.getOrCreateToken()
            val port = authManager.getPort()
            
            val serverInfo = ServerInfo(
                host = getLocalHostname(),
                port = port,
                token = token
            )
            
            mcpServer = McpServer(
                context = this@McpServerService,
                projectRepository = projectRepository,
                mediaRepository = mediaRepository,
                exportRepository = exportRepository,
                analysisRepository = analysisRepository,
                settingsRepository = settingsRepository,
                commandEngine = commandEngine,
                renderEngine = renderEngine,
                authToken = token,
                serverInfo = serverInfo
            )
            
            webSocketServer = McpWebSocketServer(port, mcpServer!!, token)
            webSocketServer!!.start()
            
            Log.d("McpServerService", "MCP Server started on port $port")
        }
    }
    
    private fun getLocalHostname(): String {
        try {
            return java.net.InetAddress.getLocalHost().hostName
        } catch (e: Exception) {
            return "videoai-phone.local"
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        webSocketServer?.stop(1000)
        mcpServer?.shutdown()
        scope.cancel()
        super.onDestroy()
    }
}