package com.couplequest.multiplayer.wifi

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.NetworkInfo
import android.net.wifi.p2p.WifiP2pConfig
import android.net.wifi.p2p.WifiP2pDevice
import android.net.wifi.p2p.WifiP2pInfo
import android.net.wifi.p2p.WifiP2pManager
import android.net.wifi.p2p.nsd.WifiP2pDnsSdServiceInfo
import android.net.wifi.p2p.nsd.WifiP2pDnsSdServiceRequest
import android.util.Log
import com.couplequest.data.model.GameRoom
import com.couplequest.data.model.Player
import com.couplequest.multiplayer.transport.ConnectionState
import com.couplequest.multiplayer.transport.TransportInterface
import com.couplequest.multiplayer.transport.TransportMessage
import com.couplequest.multiplayer.transport.Result
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.ReceiveChannel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.util.concurrent.Executors

class WifiDirectTransport(
    private val context: Context,
    private val scope: CoroutineScope
) : TransportInterface {

    private val manager: WifiP2pManager by lazy { context.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager }
    private val channel: WifiP2pManager.Channel by lazy { manager.initialize(context, context.mainLooper, null) }
    private val receiver: WifiDirectBroadcastReceiver by lazy { WifiDirectBroadcastReceiver(this) }

    override val connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Idle)
    override val incomingMessages = Channel<TransportMessage>(100)
    override val currentRoom = MutableStateFlow<GameRoom?>(null)
    override val currentPlayer = MutableStateFlow<Player?>(null)
    override var isHost = false

    private var serverSocket: ServerSocket? = null
    private var clientSocket: Socket? = null
    private var isInitialized = false
    private val serviceName = "CoupleQuest"
    private val serviceInstanceName = "CoupleQuest_${System.currentTimeMillis()}"
    private val port = 8888

    override suspend fun initialize() {
        if (isInitialized) return
        isInitialized = true

        context.registerReceiver(receiver, IntentFilter(
            WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION,
            WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION,
            WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION,
            WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION
        ))

        discoverServices()
    }

    private fun discoverServices() {
        manager.setDnsSdResponseListeners(channel,
            { instanceName, registrationType, resourceType ->
                // Service discovered
            },
            { errorCode ->
                Log.e("WifiDirect", "Service discovery failed: $errorCode")
            }
        )

        val serviceInfo = WifiP2pDnsSdServiceInfo.newInstance(
            serviceInstanceName,
            "_couplequest._tcp",
            mapOf("port" to port.toString())
        )
        manager.addLocalService(channel, serviceInfo, null, null)

        val serviceRequest = WifiP2pDnsSdServiceRequest.newInstance()
        manager.addServiceRequest(channel, serviceRequest, null, null)
        manager.discoverServices(channel, null)
    }

    override suspend fun createRoom(room: GameRoom, player: Player): Result<String> {
        isHost = true
        currentPlayer.value = player
        currentRoom.value = room

        scope.launch {
            startServer()
        }

        connectionState.value = ConnectionState.Connected(room.code, "Host")
        return Result.Success(room.code)
    }

    private fun startServer() {
        Executors.newSingleThreadExecutor().execute {
            try {
                serverSocket = ServerSocket(port)
                while (!Thread.currentThread().isInterrupted) {
                    val socket = serverSocket?.accept() ?: break
                    handleClient(socket)
                }
            } catch (e: Exception) {
                Log.e("WifiDirect", "Server error", e)
                connectionState.value = ConnectionState.Error("Server error: ${e.message}")
            }
        }
    }

    private fun handleClient(socket: Socket) {
        clientSocket = socket
        Executors.newSingleThreadExecutor().execute {
            try {
                val input = socket.getInputStream()
                val buffer = ByteArray(4096)
                while (!Thread.currentThread().isInterrupted) {
                    val len = input.read(buffer)
                    if (len > 0) {
                        val message = String(buffer, 0, len)
                        parseAndEmitMessage(message)
                    }
                }
            } catch (e: Exception) {
                Log.e("WifiDirect", "Client handler error", e)
            } finally {
                try { socket.close() } catch (e: Exception) {}
            }
        }
    }

    private fun parseAndEmitMessage(json: String) {
        try {
            // Parse JSON and emit to channel
            scope.launch {
                incomingMessages.send(TransportMessage.RoomState(currentRoom.value!!))
            }
        } catch (e: Exception) {
            Log.e("WifiDirect", "Parse error", e)
        }
    }

    override suspend fun joinRoom(roomCode: String, player: Player): Result<GameRoom> {
        isHost = false
        currentPlayer.value = player

        connectionState.value = ConnectionState.Connecting("Connecting to $roomCode...")

        // In a real implementation, we'd discover the host via Wi-Fi Direct
        // For now, we'll simulate connection
        scope.launch {
            try {
                clientSocket = Socket(InetAddress.getByName("192.168.1.100"), port)
                connectionState.value = ConnectionState.Connected(roomCode, "Host")
                listenForMessages()
            } catch (e: Exception) {
                connectionState.value = ConnectionState.Error("Connection failed: ${e.message}")
            }
        }

        return Result.Success(GameRoom(code = roomCode, hostId = ""))
    }

    private fun listenForMessages() {
        clientSocket?.let { socket ->
            Executors.newSingleThreadExecutor().execute {
                try {
                    val input = socket.getInputStream()
                    val buffer = ByteArray(4096)
                    while (!Thread.currentThread().isInterrupted) {
                        val len = input.read(buffer)
                        if (len > 0) {
                            val message = String(buffer, 0, len)
                            parseAndEmitMessage(message)
                        }
                    }
                } catch (e: Exception) {
                    Log.e("WifiDirect", "Listen error", e)
                    connectionState.value = ConnectionState.Disconnected(e.message)
                }
            }
        }
    }

    override suspend fun leaveRoom() {
        shutdown()
    }

    override suspend fun sendMessage(message: TransportMessage) {
        val json = messageToJson(message)
        sendRaw(json)
    }

    private fun sendRaw(json: String) {
        clientSocket?.let { socket ->
            Executors.newSingleThreadExecutor().execute {
                try {
                    socket.outputStream.write(json.toByteArray())
                    socket.outputStream.flush()
                } catch (e: Exception) {
                    Log.e("WifiDirect", "Send error", e)
                }
            }
        } ?: serverSocket?.let { _ ->
            // Broadcast to all connected clients in host mode
        }
    }

    private fun messageToJson(message: TransportMessage): String {
        // Simplified - use proper JSON serialization in production
        return """{"type": "${message.javaClass.simpleName}"}"""
    }

    override suspend fun updateRoomState(room: GameRoom) {
        currentRoom.value = room
        sendMessage(TransportMessage.RoomState(room))
    }

    override suspend fun sendChallenge(challenge: ChallengeMessage) {
        sendMessage(TransportMessage.Challenge(challenge))
    }

    override suspend fun sendTurnChange(nextPlayerId: String) {
        val room = currentRoom.value?.copy(currentTurn = nextPlayerId)
        room?.let { currentRoom.value = it }
        sendMessage(TransportMessage.TurnChange(nextPlayerId, currentRoom.value?.roundNumber ?: 1))
    }

    override suspend fun sendChatMessage(message: ChatMessage) {
        sendMessage(TransportMessage.Chat(message))
    }

    override suspend fun requestSync() {
        sendMessage(TransportMessage.SyncRequest(java.util.UUID.randomUUID().toString()))
    }

    override fun shutdown() {
        try {
            context.unregisterReceiver(receiver)
        } catch (e: Exception) {}
        try { serverSocket?.close() } catch (e: Exception) {}
        try { clientSocket?.close() } catch (e: Exception) {}
        manager.removeLocalService(channel, null, null)
        connectionState.value = ConnectionState.Idle
        isInitialized = false
    }

    inner class WifiDirectBroadcastReceiver(private val transport: WifiDirectTransport) : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION -> {
                    val state = intent.getIntExtra(WifiP2pManager.EXTRA_WIFI_STATE, -1)
                    if (state == WifiP2pManager.WIFI_P2P_STATE_ENABLED) {
                        // Wi-Fi Direct is enabled
                    }
                }
                WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION -> {
                    // Peers changed
                }
                WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION -> {
                    val networkInfo = intent.getParcelableExtra<NetworkInfo>(WifiP2pManager.EXTRA_NETWORK_INFO)
                    if (networkInfo?.isConnected == true) {
                        manager.requestConnectionInfo(channel) { info ->
                            if (info.groupFormed && info.isGroupOwner) {
                                // We are the host
                            } else if (info.groupFormed) {
                                // We are a client
                            }
                        }
                    }
                }
            }
        }
    }
}