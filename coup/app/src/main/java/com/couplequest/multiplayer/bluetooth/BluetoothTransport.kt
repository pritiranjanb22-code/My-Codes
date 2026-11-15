package com.couplequest.multiplayer.bluetooth

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothServerSocket
import android.bluetooth.BluetoothSocket
import android.content.Context
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
import java.io.IOException
import java.util.UUID

class BluetoothTransport(
    private val context: Context,
    private val scope: CoroutineScope
) : TransportInterface {

    private val bluetoothAdapter: BluetoothAdapter by lazy { BluetoothAdapter.getDefaultAdapter() }
    private val MY_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private val NAME = "CoupleQuest"

    override val connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Idle)
    override val incomingMessages = Channel<TransportMessage>(100)
    override val currentRoom = MutableStateFlow<GameRoom?>(null)
    override val currentPlayer = MutableStateFlow<Player?>(null)
    override var isHost = false

    private var serverSocket: BluetoothServerSocket? = null
    private var clientSocket: BluetoothSocket? = null
    private var isInitialized = false

    override suspend fun initialize() {
        if (isInitialized || bluetoothAdapter == null) return
        isInitialized = true

        if (!bluetoothAdapter.isEnabled) {
            connectionState.value = ConnectionState.Error("Bluetooth is not enabled")
            return
        }
    }

    override suspend fun createRoom(room: GameRoom, player: Player): Result<String> {
        isHost = true
        currentPlayer.value = player
        currentRoom.value = room

        if (bluetoothAdapter == null) {
            return Result.Failure(Exception("Bluetooth not supported"))
        }

        scope.launch {
            startServer()
        }

        connectionState.value = ConnectionState.Connected(room.code, "Host (Bluetooth)")
        return Result.Success(room.code)
    }

    private fun startServer() {
        Executors.newSingleThreadExecutor().execute {
            try {
                serverSocket = bluetoothAdapter?.listenUsingRfcommWithServiceRecord(NAME, MY_UUID)
                while (!Thread.currentThread().isInterrupted) {
                    val socket = serverSocket?.accept() ?: break
                    handleClient(socket)
                }
            } catch (e: IOException) {
                Log.e("BluetoothTransport", "Server error", e)
                if (!Thread.currentThread().isInterrupted) {
                    connectionState.value = ConnectionState.Error("Bluetooth server error: ${e.message}")
                }
            }
        }
    }

    private fun handleClient(socket: BluetoothSocket) {
        clientSocket = socket
        connectionState.value = ConnectionState.Connected(
            currentRoom.value?.code ?: "Unknown",
            socket.remoteDevice.name ?: "Partner"
        )

        Executors.newSingleThreadExecutor().execute {
            try {
                val input = socket.inputStream
                val buffer = ByteArray(4096)
                while (!Thread.currentThread().isInterrupted) {
                    val len = input.read(buffer)
                    if (len > 0) {
                        val message = String(buffer, 0, len)
                        parseAndEmitMessage(message)
                    }
                }
            } catch (e: IOException) {
                Log.e("BluetoothTransport", "Client handler error", e)
                connectionState.value = ConnectionState.Disconnected(e.message)
            } finally {
                try { socket.close() } catch (e: Exception) {}
            }
        }
    }

    private fun parseAndEmitMessage(json: String) {
        scope.launch {
            try {
                // Parse JSON and emit appropriate message
                incomingMessages.send(TransportMessage.RoomState(currentRoom.value!!))
            } catch (e: Exception) {
                Log.e("BluetoothTransport", "Parse error", e)
            }
        }
    }

    override suspend fun joinRoom(roomCode: String, player: Player): Result<GameRoom> {
        isHost = false
        currentPlayer.value = player

        if (bluetoothAdapter == null) {
            return Result.Failure(Exception("Bluetooth not supported"))
        }

        connectionState.value = ConnectionState.Connecting("Searching for Bluetooth device...")

        // In a real implementation, we'd show a device picker
        // For now, return a mock result
        scope.launch {
            // Simulate connection
            try {
                Thread.sleep(2000)
                connectionState.value = ConnectionState.Connected(roomCode, "Host (Bluetooth)")
            } catch (e: InterruptedException) {}
        }

        return Result.Success(GameRoom(code = roomCode, hostId = ""))
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
                } catch (e: IOException) {
                    Log.e("BluetoothTransport", "Send error", e)
                    connectionState.value = ConnectionState.Error("Send failed: ${e.message}")
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
        connectionState.value = ConnectionState.Idle
        isInitialized = false
    }

    companion object {
        fun isBluetoothSupported(): Boolean {
            return BluetoothAdapter.getDefaultAdapter() != null
        }

        fun isBluetoothEnabled(): Boolean {
            return BluetoothAdapter.getDefaultAdapter()?.isEnabled == true
        }
    }
}