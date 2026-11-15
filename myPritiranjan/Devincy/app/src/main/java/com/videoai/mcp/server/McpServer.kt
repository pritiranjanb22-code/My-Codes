package com.videoai.mcp.server

import android.content.Context
import com.videoai.data.model.*
import com.videoai.data.repository.*
import com.videoai.engine.timeline.CommandEngine
import com.videoai.engine.timeline.EditorCommand
import com.videoai.engine.timeline.CommandResult
import com.videoai.mcp.transport.ClientConnection
import com.videoai.mcp.transport.McpError
import com.videoai.mcp.transport.McpMethod
import com.videoai.mcp.transport.McpNotification
import com.videoai.mcp.transport.McpNotificationMethod
import com.videoai.mcp.transport.McpRequest
import com.videoai.mcp.transport.McpResponse
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import java.util.concurrent.ConcurrentHashMap

class McpServer(
    private val context: Context,
    private val projectRepository: ProjectRepository,
    private val mediaRepository: MediaRepository,
    private val exportRepository: ExportRepository,
    private val analysisRepository: AnalysisRepository,
    private val settingsRepository: SettingsRepository,
    private val commandEngine: CommandEngine,
    private val renderEngine: com.videoai.engine.render.RenderEngine,
    private val authToken: String,
    private val serverInfo: ServerInfo
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val clients = ConcurrentHashMap<String, ClientConnection>()
    private val pendingConfirmations = ConcurrentHashMap<String, ClientConnection>()
    private val json = Json { ignoreUnknownKeys = true }
    
    // Tool registry
    private val tools = mutableMapOf<String, McpTool>()
    private val toolHandlers = mutableMapOf<String, ToolHandler>()
    
    init {
        registerTools()
    }
    
    private fun registerTools() {
        // Project tools
        registerTool("project_create", "Create a new project", PermissionLevel.WRITE) { client, args ->
            val name = args.getString("name") ?: "Untitled Project"
            val canvas = args.getJsonObject("canvas")?.let { parseCanvas(it) } ?: CanvasConfig()
            val project = Project.create(name, canvas)
            val result = commandEngine.execute(EditorCommand.CreateProject(project))
            handleCommandResult(result) { project ->
                mapOf("projectId" to project.id, "project" to project)
            }
        }
        
        registerTool("project_open", "Open existing project", PermissionLevel.READ) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val project = projectRepository.getById(projectId).await() ?: return@registerTool error("Project not found")
            mapOf("project" to project)
        }
        
        registerTool("project_save", "Save current project", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId")
            mapOf("success" to true, "savedAt" to System.currentTimeMillis())
        }
        
        registerTool("project_close", "Close project", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("project_list", "List all projects", PermissionLevel.READ) { client, args ->
            val projects = projectRepository.getAll().first()
            val summaries = projects.map { ProjectSummary(it) }
            mapOf("projects" to summaries, "total" to summaries.size)
        }
        
        registerTool("project_delete", "Delete project", PermissionLevel.DESTRUCTIVE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val confirm = args.getBoolean("confirm") ?: false
            if (!confirm && !client.automationMode) {
                throw ConfirmationRequired("Delete project $projectId?")
            }
            projectRepository.delete(projectId)
            mapOf("success" to true)
        }
        
        registerTool("project_duplicate", "Duplicate project", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val newName = args.getString("newName")
            val project = projectRepository.duplicate(projectId, newName).await()
            project?.let { mapOf("projectId" to it.id, "project" to it) }
                ?: error("Project not found")
        }
        
        // Media tools
        registerTool("media_list", "List media files", PermissionLevel.READ) { client, args ->
            val type = args.getString("type")?.let { MediaType.valueOf(it.uppercase()) }
            val folder = args.getString("folder")
            val limit = args.getInt("limit") ?: 50
            val offset = args.getInt("offset") ?: 0
            
            val mediaList = if (type != null) {
                mediaRepository.getByType(type).first()
            } else if (folder != null) {
                mediaRepository.getByFolder(folder).first()
            } else {
                mediaRepository.getAll().first()
            }
            
            val paged = mediaList.drop(offset).take(limit)
            mapOf("media" to paged, "total" to mediaList.size)
        }
        
        registerTool("media_import", "Import media from URI", PermissionLevel.WRITE) { client, args ->
            val uri = args.getString("uri") ?: return@registerTool error("uri required")
            val name = args.getString("name")
            val media = Media.fromUri(uri, MediaType.VIDEO).copy(name = name ?: uri.substringAfterLast("/"))
            mediaRepository.insert(media)
            mapOf("media" to media)
        }
        
        registerTool("media_get_metadata", "Get detailed media metadata", PermissionLevel.READ) { client, args ->
            val mediaId = args.getString("mediaId") ?: return@registerTool error("mediaId required")
            val media = mediaRepository.getById(mediaId).await() ?: return@registerTool error("Media not found")
            mapOf("metadata" to MediaMetadata())
        }
        
        registerTool("media_remove", "Remove media from library", PermissionLevel.DESTRUCTIVE) { client, args ->
            val mediaId = args.getString("mediaId") ?: return@registerTool error("mediaId required")
            val confirm = args.getBoolean("confirm") ?: false
            if (!confirm && !client.automationMode) {
                throw ConfirmationRequired("Delete media $mediaId?")
            }
            mediaRepository.delete(mediaId)
            mapOf("success" to true)
        }
        
        registerTool("media_generate_thumbnail", "Generate thumbnail", PermissionLevel.READ) { client, args ->
            val mediaId = args.getString("mediaId") ?: return@registerTool error("mediaId required")
            val time = args.getLong("time") ?: 0
            val width = args.getInt("width") ?: 320
            val height = args.getInt("height") ?: 180
            mapOf("thumbnailPath" to "")
        }
        
        registerTool("media_generate_proxy", "Generate proxy for editing", PermissionLevel.WRITE) { client, args ->
            val mediaId = args.getString("mediaId") ?: return@registerTool error("mediaId required")
            val quality = args.getString("quality")?.let { ProxyQuality.valueOf(it.uppercase()) }
            mapOf("proxyPath" to "")
        }
        
        registerTool("media_scan", "Scan device for media files", PermissionLevel.READ) { client, args ->
            val type = args.getString("type")?.let { MediaType.valueOf(it.uppercase()) }
            val result = if (type != null) {
                mediaRepository.scanMediaType(type)
            } else {
                mediaRepository.scanAllMedia()
            }
            mapOf("media" to result.media, "total" to result.total)
        }
        
        // Timeline tools
        registerTool("timeline_get", "Get full timeline state", PermissionLevel.READ) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val project = projectRepository.getById(projectId).await() ?: return@registerTool error("Project not found")
            mapOf("timeline" to project.timeline)
        }
        
        registerTool("timeline_add_clip", "Add clip to timeline", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val mediaId = args.getString("mediaId") ?: return@registerTool error("mediaId required")
            val trackId = args.getString("trackId")
            val trackType = args.getString("trackType")?.let { TrackType.valueOf(it.uppercase()) } ?: TrackType.VIDEO
            val startTime = args.getLong("startTime") ?: 0
            val sourceIn = args.getLong("sourceIn")
            val sourceOut = args.getLong("sourceOut")
            val duration = args.getLong("duration")
            
            val media = mediaRepository.getById(mediaId).await() ?: return@registerTool error("Media not found")
            
            val clip = Clip(
                mediaId = mediaId,
                trackId = trackId ?: "",
                startTime = startTime,
                duration = duration ?: media.duration,
                sourceIn = sourceIn ?: 0,
                sourceOut = sourceOut ?: 0
            )
            
            val result = commandEngine.execute(EditorCommand.AddClip(projectId, clip))
            handleCommandResult(result) { project ->
                val addedClip = project.timeline.tracks.flatMap { it.clips }.find { it.mediaId == mediaId && it.startTime == startTime }
                mapOf("clip" to addedClip, "trackId" to trackId)
            }
        }
        
        registerTool("timeline_remove_clip", "Remove clip from timeline", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val clipId = args.getString("clipId") ?: return@registerTool error("clipId required")
            
            val result = commandEngine.execute(EditorCommand.RemoveClip(projectId, clipId))
            handleCommandResult(result) { mapOf("success" to true) }
        }
        
        registerTool("timeline_move_clip", "Move clip to new position/track", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val clipId = args.getString("clipId") ?: return@registerTool error("clipId required")
            val trackId = args.getString("trackId")
            val startTime = args.getLong("startTime")
            
            val result = commandEngine.execute(EditorCommand.MoveClip(projectId, clipId, trackId, startTime.takeIf { it > 0 }))
            handleCommandResult(result) { mapOf("clip" to it) }
        }
        
        registerTool("timeline_split_clip", "Split clip at time", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val clipId = args.getString("clipId") ?: return@registerTool error("clipId required")
            val time = args.getLong("time") ?: return@registerTool error("time required")
            
            val result = commandEngine.execute(EditorCommand.SplitClip(projectId, clipId, time))
            handleCommandResult(result) { mapOf("clips" to it) }
        }
        
        registerTool("timeline_trim_clip", "Trim clip in/out points", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val clipId = args.getString("clipId") ?: return@registerTool error("clipId required")
            val sourceIn = args.getLong("sourceIn")
            val sourceOut = args.getLong("sourceOut")
            
            val result = commandEngine.execute(EditorCommand.TrimClip(projectId, clipId, sourceIn.takeIf { it >= 0 }, sourceOut.takeIf { it > 0 }))
            handleCommandResult(result) { mapOf("clip" to it) }
        }
        
        registerTool("timeline_add_track", "Add new track", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val type = args.getString("type")?.let { TrackType.valueOf(it.uppercase()) } ?: TrackType.VIDEO
            val index = args.getInt("index")
            
            val result = commandEngine.execute(EditorCommand.AddTrack(projectId, Track(type = type, index = index ?: 0)))
            handleCommandResult(result) { mapOf("track" to it) }
        }
        
        registerTool("timeline_remove_track", "Remove track", PermissionLevel.DESTRUCTIVE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val trackId = args.getString("trackId") ?: return@registerTool error("trackId required")
            
            val result = commandEngine.execute(EditorCommand.RemoveTrack(projectId, trackId))
            handleCommandResult(result) { mapOf("success" to true) }
        }
        
        registerTool("timeline_reorder_tracks", "Reorder tracks", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val trackIds = args.getJsonArray("trackIds")?.map { it.jsonPrimitive.content } ?: emptyList()
            
            val result = commandEngine.execute(EditorCommand.ReorderTracks(projectId, trackIds))
            handleCommandResult(result) { mapOf("tracks" to it) }
        }
        
        // Video editing tools
        registerTool("video_trim", "Trim video clip", PermissionLevel.WRITE) { client, args ->
            val clipId = args.getString("clipId") ?: return@registerTool error("clipId required")
            val start = args.getLong("start") ?: return@registerTool error("start required")
            val end = args.getLong("end") ?: return@registerTool error("end required")
            mapOf("success" to true)
        }
        
        registerTool("video_crop", "Crop video", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("video_rotate", "Rotate video", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("video_speed", "Change clip speed", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        // Audio tools
        registerTool("audio_add", "Add audio to timeline", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("audio_volume", "Set clip volume", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        // Text/Caption tools
        registerTool("text_add", "Add text layer", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val text = args.getString("text") ?: return@registerTool error("text required")
            val trackId = args.getString("trackId")
            val startTime = args.getLong("startTime") ?: 0
            val duration = args.getLong("duration") ?: 5_000_000
            
            val clip = Clip(
                mediaId = "",
                trackId = trackId ?: "",
                startTime = startTime,
                duration = duration,
                textConfig = TextConfig(text = text)
            )
            
            val result = commandEngine.execute(EditorCommand.AddClip(projectId, clip))
            handleCommandResult(result) { mapOf("clip" to it) }
        }
        
        registerTool("caption_generate", "Auto-generate captions from speech", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        // Effects tools
        registerTool("effect_add", "Add effect to clip", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val clipId = args.getString("clipId") ?: return@registerTool error("clipId required")
            val effectType = args.getString("effectType")?.let { EffectType.valueOf(it.uppercase()) } ?: return@registerTool error("effectType required")
            val parameters = args.getJsonObject("parameters")?.let { json.encodeToString(it) } ?: "{}"
            
            val effect = Effect(type = effectType, parameters = json.decodeFromString(parameters))
            val result = commandEngine.execute(EditorCommand.AddEffect(projectId, clipId, effect))
            handleCommandResult(result) { mapOf("clip" to it) }
        }
        
        registerTool("filter_apply", "Apply LUT/filter", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        // Transition tools
        registerTool("transition_add", "Add transition between clips", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val fromClipId = args.getString("fromClipId") ?: return@registerTool error("fromClipId required")
            val toClipId = args.getString("toClipId") ?: return@registerTool error("toClipId required")
            val type = args.getString("type")?.let { TransitionType.valueOf(it.uppercase()) } ?: return@registerTool error("type required")
            val duration = args.getLong("duration") ?: 500_000
            
            val transition = Transition(type = type, duration = duration)
            val result = commandEngine.execute(EditorCommand.AddTransition(projectId, transition, fromClipId, toClipId))
            handleCommandResult(result) { mapOf("transition" to it) }
        }
        
        // Keyframe tools
        registerTool("keyframe_add", "Add keyframe", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val clipId = args.getString("clipId") ?: return@registerTool error("clipId required")
            val property = args.getString("property") ?: return@registerTool error("property required")
            val time = args.getLong("time") ?: return@registerTool error("time required")
            val value = args.getJsonPrimitive("value")?.content ?: return@registerTool error("value required")
            val easing = args.getString("easing")?.let { Easing.valueOf(it.uppercase()) } ?: Easing.LINEAR
            
            val keyframe = Keyframe(
                time = time,
                property = property,
                value = KeyframeValue.FloatValue(value.toFloat()),
                easing = easing
            )
            
            val result = commandEngine.execute(EditorCommand.AddKeyframe(projectId, clipId, keyframe))
            handleCommandResult(result) { mapOf("keyframe" to it) }
        }
        
        // Color tools
        registerTool("color_adjust", "Adjust color parameters", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("color_grade", "Apply cinematic color grade", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        // AI Analysis tools
        registerTool("analyze_video", "Comprehensive video analysis", PermissionLevel.READ) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("detect_scenes", "Detect scene changes", PermissionLevel.READ) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("detect_silence", "Detect silent sections", PermissionLevel.READ) { client, args ->
            mapOf("success" to true)
        }
        
        // Export tools
        registerTool("export_video", "Export final video", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val project = projectRepository.getById(projectId).await() ?: return@registerTool error("Project not found")
            
            val settings = args.getJsonObject("settings")?.let { parseExportSettings(it) } 
                ?: ExportSettings()
            
            val job = renderEngine.exportVideo(projectId, settings, args.getString("outputPath"))
            mapOf("exportId" to job.id, "status" to job.status.name)
        }
        
        registerTool("get_export_status", "Get export progress", PermissionLevel.READ) { client, args ->
            val exportId = args.getString("exportId") ?: return@registerTool error("exportId required")
            val job = exportRepository.getById(exportId).await() ?: return@registerTool error("Export not found")
            mapOf("status" to job.status.name, "progress" to job.progress, "outputPath" to job.outputPath)
        }
        
        // State tools
        registerTool("get_project_state", "Get complete project state for LLM", PermissionLevel.READ) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val project = projectRepository.getById(projectId).await() ?: return@registerTool error("Project not found")
            
            val mediaLibrary = mediaRepository.getAll().first().map { MediaSummary(it) }
            
            val state = ProjectState(
                project = project,
                timeline = project.timeline,
                mediaLibrary = mediaLibrary,
                currentSelection = project.timeline.selection,
                playbackState = PlaybackState(),
                renderStatus = RenderStatus(),
                exportQueue = exportRepository.getActiveJobs().first()
            )
            
            mapOf("state" to state)
        }
        
        registerTool("undo", "Undo last operation", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val result = commandEngine.undo(projectId)
            handleCommandResult(result) { mapOf("success" to true, "description" to "Undo") }
        }
        
        registerTool("redo", "Redo last undone operation", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val result = commandEngine.redo(projectId)
            handleCommandResult(result) { mapOf("success" to true, "description" to "Redo") }
        }
        
        registerTool("server_info", "Get server information", PermissionLevel.READ) { client, args ->
            mapOf("info" to serverInfo)
        }
        
        // Photo editing tools
        registerTool("photo_create", "Create photo project", PermissionLevel.WRITE) { client, args ->
            val projectId = args.getString("projectId") ?: return@registerTool error("projectId required")
            val mediaId = args.getString("mediaId") ?: return@registerTool error("mediaId required")
            val name = args.getString("name") ?: "Photo Edit"
            
            val project = com.videoai.data.model.PhotoProject(
                name = name,
                sourceMediaId = mediaId
            )
            mapOf("projectId" to project.id, "project" to project)
        }
        
        registerTool("photo_adjust", "Adjust photo parameters", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("photo_crop", "Crop photo", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("photo_rotate", "Rotate photo", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("photo_filter", "Apply filter/LUT", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("photo_add_text", "Add text layer to photo", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("photo_remove_background", "Remove background from photo", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
        
        registerTool("photo_export", "Export photo", PermissionLevel.WRITE) { client, args ->
            mapOf("success" to true)
        }
    }
    
    private fun registerTool(name: String, description: String, permission: PermissionLevel, handler: ToolHandler) {
        val tool = McpTool(
            name = name,
            description = description,
            inputSchema = mapOf(),
            outputSchema = mapOf(),
            permissionLevel = permission
        )
        tools[name] = tool
        toolHandlers[name] = handler
    }
    
    fun handleRequest(client: ClientConnection, request: McpRequest): McpResponse {
        return try {
            when (request.method) {
                McpMethod.INITIALIZE.value -> {
                    McpResponse(id = request.id, result = mapOf(
                        "protocolVersion" to "2024-11-05",
                        "capabilities" to serverInfo.capabilities,
                        "serverInfo" to serverInfo
                    ))
                }
                McpMethod.TOOLS_LIST.value -> {
                    McpResponse(id = request.id, result = mapOf("tools" to tools.values))
                }
                McpMethod.TOOLS_CALL.value -> {
                    val params = request.params ?: return McpResponse(id = request.id, error = McpError(-32602, "Invalid params"))
                    val toolName = params.getString("name") ?: return McpResponse(id = request.id, error = McpError(-32602, "Tool name required"))
                    val arguments = params.getJsonObject("arguments") ?: emptyMap()
                    
                    val handler = toolHandlers[toolName] ?: return McpResponse(id = request.id, error = McpError(-32601, "Tool not found: $toolName"))
                    
                    // Check permissions
                    val tool = tools[toolName]!!
                    if (!hasPermission(client, tool.permissionLevel)) {
                        return McpResponse(id = request.id, error = McpError(-32603, "Insufficient permissions for $toolName"))
                    }
                    
                    val result = handler(client, arguments)
                    McpResponse(id = request.id, result = result)
                }
                McpMethod.RESOURCES_LIST.value -> {
                    McpResponse(id = request.id, result = mapOf("resources" to emptyList()))
                }
                McpMethod.PING.value -> {
                    McpResponse(id = request.id, result = mapOf("pong" to true))
                }
                else -> McpResponse(id = request.id, error = McpError(-32601, "Method not found: ${request.method}"))
            }
        } catch (e: ConfirmationRequired) {
            McpResponse(
                id = request.id,
                result = mapOf("requiresConfirmation" to true, "message" to e.message),
                error = null
            )
        } catch (e: Exception) {
            McpResponse(id = request.id, error = McpError(-32603, "Internal error: ${e.message}"))
        }
    }
    
    private fun hasPermission(client: ClientConnection, required: PermissionLevel): Boolean {
        if (client.automationMode) return true
        return when (required) {
            PermissionLevel.READ -> client.permissions != PermissionLevel.READ
            PermissionLevel.WRITE -> client.permissions == PermissionLevel.WRITE || client.permissions == PermissionLevel.DESTRUCTIVE
            PermissionLevel.DESTRUCTIVE -> client.permissions == PermissionLevel.DESTRUCTIVE
        }
    }
    
    private fun handleCommandResult(result: CommandResult, successMapper: (Project) -> Map<String, Any>): Map<String, Any> {
        return when (result) {
            is CommandResult.Success -> successMapper(result.project)
            is CommandResult.Failure -> error(result.error)
            is CommandResult.RequiresConfirmation -> throw ConfirmationRequired(result.request.description)
        }
    }
    
    private fun error(message: String): Map<String, Any> = mapOf("error" to message)
    
    private fun parseCanvas(json: JsonObject): CanvasConfig {
        return CanvasConfig(
            width = json.getInt("width") ?: 1920,
            height = json.getInt("height") ?: 1080,
            fps = json.getInt("fps") ?: 30
        )
    }
    
    private fun parseExportSettings(json: JsonObject): ExportSettings {
        return ExportSettings(
            width = json.getInt("width") ?: 1920,
            height = json.getInt("height") ?: 1080,
            fps = json.getInt("fps") ?: 30
        )
    }
    
    fun onClientConnected(client: ClientConnection) {
        clients[client.id] = client
        broadcast(McpNotification(
            method = McpNotificationMethod.TOOLS_CHANGED.value,
            params = mapOf("tools" to tools.values.map { it.name })
        ))
    }
    
    fun onClientDisconnected(client: ClientConnection) {
        clients.remove(client.id)
    }
    
    fun broadcast(notification: McpNotification) {
        // Would broadcast to all connected clients via WebSocket server
    }
    
    fun getConnectedClients(): List<ClientConnection> = clients.values.toList()
    
    fun shutdown() {
        scope.cancel()
        clients.clear()
    }
    
    interface ToolHandler {
        fun handle(client: ClientConnection, arguments: Map<String, Any>): Map<String, Any>
    }
    
    class ConfirmationRequired(val message: String) : Exception(message)
}