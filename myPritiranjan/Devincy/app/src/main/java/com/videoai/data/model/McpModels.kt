package com.videoai.data.model

import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class ProjectState(
    val project: Project,
    val timeline: Timeline,
    val mediaLibrary: List<MediaSummary>,
    val currentSelection: Selection?,
    val playbackState: PlaybackState,
    val renderStatus: RenderStatus,
    val exportQueue: List<ExportJob>
)

@Serializable
data class PlaybackState(
    val isPlaying: Boolean = false,
    val currentTime: Long = 0,
    val playbackSpeed: Float = 1.0f,
    val loopEnabled: Boolean = false,
    val loopStart: Long = 0,
    val loopEnd: Long = 0
)

@Serializable
data class RenderStatus(
    val isRendering: Boolean = false,
    val progress: Float = 0f,
    val currentFrame: Long = 0,
    val totalFrames: Long = 0,
    val previewPath: String? = null,
    val error: String? = null
)

@Serializable
data class ServerInfo(
    val name: String = "VideoAI Phone",
    val version: String = "1.0.0",
    val host: String,
    val port: Int,
    val mcpEndpoint: String = "/mcp",
    val token: String,
    val capabilities: ServerCapabilities = ServerCapabilities(),
    val connectedClients: Int = 0,
    val uptime: Long = 0
)

@Serializable
data class ServerCapabilities(
    val videoEditing: Boolean = true,
    val photoEditing: Boolean = true,
    val audioEditing: Boolean = true,
    val aiAnalysis: Boolean = true,
    val maxTracks: Int = 16,
    maxTimelineDuration: Long = 3600_000_000, // 1 hour in microseconds
    val supportedFormats: List<String> = listOf("mp4", "mov", "mkv", "webm", "jpg", "png", "heic", "mp3", "wav", "aac"),
    val supportedCodecs: List<String> = listOf("h264", "h265", "vp9", "av1", "prores"),
    val hardwareAcceleration: Boolean = true,
    val maxExportResolution: String = "4K",
    val maxFps: Int = 60
)

@Serializable
data class ConnectionInfo(
    val clientId: String = UUID.randomUUID().toString(),
    val clientName: String,
    val connectedAt: Long = System.currentTimeMillis(),
    val lastActivity: Long = System.currentTimeMillis(),
    val permissions: PermissionLevel = PermissionLevel.READ,
    val automationMode: Boolean = false
)

@Serializable
enum class PermissionLevel {
    READ,
    WRITE,
    DESTRUCTIVE
}

@Serializable
data class PermissionRequest(
    val requestId: String = UUID.randomUUID().toString(),
    val operation: String,
    val level: PermissionLevel,
    val description: String,
    val affectedResources: List<String> = emptyList(),
    val timestamp: Long = System.currentTimeMillis()
)

@Serializable
data class PermissionResponse(
    val requestId: String,
    val granted: Boolean,
    val grantedAt: Long = System.currentTimeMillis()
)

@Serializable
data class McpTool(
    val name: String,
    val description: String,
    val inputSchema: Map<String, Any>,
    val outputSchema: Map<String, Any>,
    val permissionLevel: PermissionLevel = PermissionLevel.WRITE
)

@Serializable
data class McpToolCall(
    val id: String = UUID.randomUUID().toString(),
    val tool: String,
    val arguments: Map<String, Any>,
    val timestamp: Long = System.currentTimeMillis()
)

@Serializable
data class McpToolResult(
    val callId: String,
    val success: Boolean,
    val result: Any? = null,
    val error: McpError? = null,
    val requiresConfirmation: Boolean = false,
    val confirmationRequest: PermissionRequest? = null
)

@Serializable
data class McpError(
    val code: Int,
    val message: String,
    val data: Any? = null
)

@Serializable
data class McpInitializeRequest(
    val protocolVersion: String = "2024-11-05",
    val capabilities: Map<String, Any> = emptyMap(),
    val clientInfo: ClientInfo
)

@Serializable
data class ClientInfo(
    val name: String,
    val version: String
)

@Serializable
data class McpInitializeResponse(
    val protocolVersion: String = "2024-11-05",
    val capabilities: ServerCapabilities,
    val serverInfo: ServerInfo
)