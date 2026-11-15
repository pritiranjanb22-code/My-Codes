package com.couplequest.multiplayer.wifi

import android.content.Context
import android.net.wifi.WifiManager
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
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.util.concurrent.Executors

class SameWifiTransport(
    private val context: Context,
    private val scope: CoroutineScope
) : TransportInterface {

    private val PORT = 8889
    private val DISCOVERY_PORT = 8890
    private val DISCOVERY_MESSAGE = "COUPLE_QUEST_DISCOVERY"
    private val DISCOVERY_RESPONSE = "COUPLE_QUEST_RESPONSE"

    override val connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Idle)
    override val incomingMessages = Channel<TransportMessage>(100)
    override val currentRoom = MutableStateFlow<GameRoom?>(null)
    override val currentPlayer = MutableStateFlow<Player?>(null)
    override var isHost = false

    private var serverSocket: ServerSocket? = null
    private var clientSocket: Socket? = null
    private var discoverySocket: DatagramSocket? = null
    private var isInitialized = false
    private var hostAddress: InetAddress? = null

    override suspend fun initialize() {
        if (isInitialized) return
        isInitialized = true

        startDiscoveryListener()
    }

    private fun startDiscoveryListener() {
        scope.launch {
            Executors.newSingleThreadExecutor().execute {
                try {
                    discoverySocket = DatagramSocket(DISCOVERY_PORT)
                    discoverySocket?.setBroadcast(true)
                    val buffer = ByteArray(1024)
                    while (!Thread.currentThread().isInterrupted) {
                        val packet = DatagramPacket(buffer, buffer.size)
                        discoverySocket?.receive(packet)
                        val message = String(packet.data, 0, packet.length)
                        if (message == DISCOVERY_MESSAGE && isHost) {
                            sendDiscoveryResponse(packet.address)
                        } else if (message.startsWith(DISCOVERY_RESPONSE) && !isHost) {
                            hostAddress = packet.address
                            connectionState.value = ConnectionState.Connected(
                                currentRoom.value?.code ?: "Unknown",
                                "Found host at ${packet.address.hostAddress}"
                            )
                        }
                    }
                } catch (e: Exception) {
                    Log.e("SameWifiTransport", "Discovery error", e)
                }
            }
        }
    }

    private fun sendDiscoveryResponse(address: InetAddress) {
        try {
            val response = "$DISCOVERY_RESPONSE:${currentRoom.value?.code}:${currentRoom.value?.hostId}"
            val packet = DatagramPacket(
                response.toByteArray(),
                response.length,
                address,
                DISCOVERY_PORT
            )
            discoverySocket?.send(packet)
        } catch (e: Exception) {
            Log.e("SameWifiTransport", "Send discovery response error", e)
        }
    }

    private fun broadcastDiscovery() {
        scope.launch {
            Executors.newSingleThreadExecutor().execute {
                try {
                    val socket = DatagramSocket()
                    socket.setBroadcast(true)
                    val broadcastAddress = getBroadcastAddress()
                    val packet = DatagramPacket(
                        DISCOVERY_MESSAGE.toByteArray(),
                        DISCOVERY_MESSAGE.length,
                        broadcastAddress,
                        DISCOVERY_PORT
                    )
                    for (i in 1..5) {
                        socket.send(packet)
                        Thread.sleep(1000)
                    }
                    socket.close()
                } catch (e: Exception) {
                    Log.e("SameWifiTransport", "Broadcast discovery error", e)
                }
            }
        }
    }

    private fun getBroadcastAddress(): InetAddress {
        val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val dhcpInfo = wifiManager.dhcpInfo
        val ipAddress = dhcpInfo.ipAddress
        val netmask = dhcpInfo.netmask
        val broadcast = (ipAddress and netmask) or (netmask.inv())
        val bytes = Int.toByteArray(broadcast)
        return InetAddress.getByAddress(bytes)
    }

    override suspend fun createRoom(room: GameRoom, player: Player): Result<String> {
        isHost = true
        currentPlayer.value = player
        currentRoom.value = room

        scope.launch {
            startServer()
        }

        connectionState.value = ConnectionState.Connected(room.code, "Host (Wi-Fi)")
        return Result.Success(room.code)
    }

    private fun startServer() {
        Executors.newSingleThreadExecutor().execute {
            try {
                serverSocket = ServerSocket(PORT)
                while (!Thread.currentThread().isInterrupted) {
                    val socket = serverSocket?.accept() ?: break
                    handleClient(socket)
                }
            } catch (e: Exception) {
                Log.e("SameWifiTransport", "Server error", e)
                connectionState.value = ConnectionState.Error("Server error: ${e.message}")
            }
        }
    }

    private fun handleClient(socket: Socket) {
        clientSocket = socket
        connectionState.value = ConnectionState.Connected(
            currentRoom.value?.code ?: "Unknown",
            socket.inetAddress.hostAddress
        )

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
                Log.e("SameWifiTransport", "Client handler error", e)
                connectionState.value = ConnectionState.Disconnected(e.message)
            } finally {
                try { socket.close() } catch (e: Exception) {}
            }
        }
    }

    private fun parseAndEmitMessage(json: String) {
        scope.launch {
            try {
                incomingMessages.send(TransportMessage.RoomState(currentRoom.value!!))
            } catch (e: Exception) {
                Log.e("SameWifiTransport", "Parse error", e)
            }
        }
    }

    override suspend fun joinRoom(roomCode: String, player: Player): Result<GameRoom> {
        isHost = false
        currentPlayer.value = player

        connectionState.value = ConnectionState.Connecting("Searching for host on Wi-Fi...")

        broadcastDiscovery()

        // Wait for discovery response
        var attempts = 0
        while (hostAddress == null && attempts < 20) {
            kotlinx.coroutines.delay(500)
            attempts++
        }

        if (hostAddress == null) {
            return Result.Failure(Exception("No host found on this Wi-Fi network. Make sure both devices are on the same network."))
        }

        return try {
            scope.launch {
                connectToHost()
            }
            Result.Success(GameRoom(code = roomCode, hostId = ""))
        } catch (e: Exception) {
            Result.Failure(e)
        }
    }

    private fun connectToHost() {
        hostAddress?.let { address ->
            Executors.newSingleThreadExecutor().execute {
                try {
                    clientSocket = Socket(address, PORT)
                    connectionState.value = ConnectionState.Connected(
                        currentRoom.value?.code ?: "Unknown",
                        address.hostAddress
                    )
                    listenForMessages()
                } catch (e: Exception) {
                    Log.e("SameWifiTransport", "Connection error", e)
                    connectionState.value = ConnectionState.Error("Connection failed: ${e.message}")
                }
            }
        }
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
                    Log.e("SameWifiTransport", "Listen error", e)
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
                    Log.e("SameWifiTransport", "Send error", e)
                }
            }
        }
    }

    private fun messageToJson(message: TransportMessage): String {
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
        try { serverSocket?.close() } catch (e: Exception) {}
        try { clientSocket?.close() } catch (e: Exception) {}
        try { discoverySocket?.close() } catch (e: Exception) {}
        connectionState.value = ConnectionState.Idle
        isInitialized = false
        hostAddress = null
    }

    companion object {
        fun isOnSameNetwork(context: Context): Boolean {
            val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
            return wifiManager.connectionInfo.supplicantState.name == "COMPLETED"
        }
    }
}