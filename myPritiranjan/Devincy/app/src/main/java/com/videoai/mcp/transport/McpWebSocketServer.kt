package com.videoai.mcp.transport

import android.util.Log
import com.videoai.data.model.*
import com.videoai.mcp.server.McpServer
import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer
import java.net.InetSocketAddress
import java.util.concurrent.ConcurrentHashMap

class McpWebSocketServer(
    private val port: Int,
    private val mcpServer: McpServer,
    private val authToken: String
) : WebSocketServer(InetSocketAddress(port)) {
    
    private val connections = ConcurrentHashMap<WebSocket, ClientConnection>()
    private val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }
    
    override fun onOpen(conn: WebSocket, handshake: ClientHandshake) {
        val clientIp = conn.remoteSocketAddress.address.hostAddress
        Log.d("McpServer", "New connection from $clientIp")
        
        // Check auth token in query parameters
        val query = handshake.resourceDescriptor.substringAfter("?")
        val tokenParam = query.split("&").find { it.startsWith("token=") }?.substringAfter("=")
        
        if (tokenParam != authToken) {
            Log.w("McpServer", "Invalid token from $clientIp")
            conn.close(4001, "Invalid authentication token")
            return
        }
        
        val clientConnection = ClientConnection(
            id = java.util.UUID.randomUUID().toString(),
            socket = conn,
            connectedAt = System.currentTimeMillis(),
            lastActivity = System.currentTimeMillis(),
            permissions = PermissionLevel.READ,
            automationMode = false
        )
        
        connections[conn] = clientConnection
        mcpServer.onClientConnected(clientConnection)
    }
    
    override fun onClose(conn: WebSocket, code: Int, reason: String, remote: Boolean) {
        val connection = connections.remove(conn)
        connection?.let {
            Log.d("McpServer", "Client disconnected: ${it.id} ($reason)")
            mcpServer.onClientDisconnected(it)
        }
    }
    
    override fun onMessage(conn: WebSocket, message: String) {
        val connection = connections[conn] ?: return
        connection.lastActivity = System.currentTimeMillis()
        
        scope.launch {
            try {
                val request = json.decodeFromString<McpRequest>(message)
                val response = mcpServer.handleRequest(connection, request)
                sendResponse(conn, response)
            } catch (e: Exception) {
                Log.e("McpServer", "Error processing message", e)
                sendError(conn, null, -32600, "Parse error: ${e.message}")
            }
        }
    }
    
    override fun onError(conn: WebSocket?, ex: Exception) {
        Log.e("McpServer", "WebSocket error", ex)
    }
    
    override fun onStart() {
        Log.d("McpServer", "MCP WebSocket server started on port $port")
    }
    
    private fun sendResponse(conn: WebSocket, response: McpResponse) {
        val jsonStr = json.encodeToString(response)
        conn.send(jsonStr)
    }
    
    private fun sendError(conn: WebSocket, id: Any?, code: Int, message: String) {
        val response = McpResponse(
            id = id,
            error = McpError(code = code, message = message)
        )
        sendResponse(conn, response)
    }
    
    fun broadcast(message: McpNotification) {
        val jsonStr = json.encodeToString(message)
        for (conn in connections.keys) {
            conn.send(jsonStr)
        }
    }
    
    fun getConnectedClients(): List<ClientConnection> = connections.values.toList()
    
    fun disconnectClient(clientId: String) {
        connections.entries.firstOrNull { it.value.id == clientId }?.key?.close()
    }
    
    companion object {
        private val scope = kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.SupervisorJob() + kotlinx.coroutines.Dispatchers.IO)
    }
}

data class ClientConnection(
    val id: String,
    val socket: WebSocket,
    val connectedAt: Long,
    var lastActivity: Long,
    var permissions: PermissionLevel,
    var automationMode: Boolean
)

@kotlinx.serialization.Serializable
data class McpRequest(
    val jsonrpc: String = "2.0",
    val id: Any?,
    val method: String,
    val params: Map<String, Any>? = null
)

@kotlinx.serialization.Serializable
data class McpResponse(
    val jsonrpc: String = "2.0",
    val id: Any?,
    val result: Any? = null,
    val error: McpError? = null
)

@kotlinx.serialization.Serializable
data class McpNotification(
    val jsonrpc: String = "2.0",
    val method: String,
    val params: Map<String, Any>? = null
)

@kotlinx.serialization.Serializable
data class McpError(
    val code: Int,
    val message: String,
    val data: Any? = null
)

enum class McpMethod {
    INITIALIZE("initialize"),
    INITIALIZED("initialized"),
    TOOLS_LIST("tools/list"),
    TOOLS_CALL("tools/call"),
    RESOURCES_LIST("resources/list"),
    RESOURCES_READ("resources/read"),
    RESOURCES_TEMPLATES_LIST("resources/templates/list"),
    PROMPTS_LIST("prompts/list"),
    PROMPTS_GET("prompts/get"),
    PING("ping");
    
    val value: String
}

enum class McpNotificationMethod {
    PROGRESS("progress"),
    CANCELLED("cancelled"),
    RESOURCES_CHANGED("resources/changed"),
    TOOLS_CHANGED("tools/changed");
    
    val value: String
}