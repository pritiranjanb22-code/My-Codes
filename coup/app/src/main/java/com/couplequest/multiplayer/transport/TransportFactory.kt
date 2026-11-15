package com.couplequest.multiplayer.transport

import android.content.Context
import com.couplequest.data.model.ConnectionType
import com.couplequest.multiplayer.bluetooth.BluetoothTransport
import com.couplequest.multiplayer.wifi.SameWifiTransport
import com.couplequest.multiplayer.wifi.WifiDirectTransport
import kotlinx.coroutines.CoroutineScope
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TransportFactory @Inject constructor() {

    fun createTransport(
        type: ConnectionType,
        context: Context,
        scope: CoroutineScope
    ): TransportInterface {
        return when (type) {
            ConnectionType.ONE_PHONE -> OnePhoneTransport()
            ConnectionType.SAME_WIFI -> SameWifiTransport(context, scope)
            ConnectionType.WIFI_DIRECT -> WifiDirectTransport(context, scope)
            ConnectionType.BLUETOOTH -> BluetoothTransport(context, scope)
        }
    }

    fun getAvailableTransports(context: Context): List<ConnectionType> {
        val transports = mutableListOf<ConnectionType>()
        transports.add(ConnectionType.ONE_PHONE)
        
        if (SameWifiTransport.isOnSameNetwork(context)) {
            transports.add(ConnectionType.SAME_WIFI)
        }
        
        if (WifiDirectTransport.isWifiDirectSupported(context)) {
            transports.add(ConnectionType.WIFI_DIRECT)
        }
        
        if (BluetoothTransport.isBluetoothSupported() && BluetoothTransport.isBluetoothEnabled()) {
            transports.add(ConnectionType.BLUETOOTH)
        }
        
        return transports
    }
}

class OnePhoneTransport : TransportInterface {
    override val connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Idle)
    override val incomingMessages = Channel<TransportMessage>(100)
    override val currentRoom = MutableStateFlow<GameRoom?>(null)
    override val currentPlayer = MutableStateFlow<Player?>(null)
    override var isHost = true

    override suspend fun initialize() {
        connectionState.value = ConnectionState.Connected("local", "One Phone Mode")
    }

    override suspend fun createRoom(room: GameRoom, player: Player): Result<String> {
        currentRoom.value = room
        currentPlayer.value = player
        isHost = true
        connectionState.value = ConnectionState.Connected(room.code, "One Phone Mode")
        return Result.Success(room.code)
    }

    override suspend fun joinRoom(roomCode: String, player: Player): Result<GameRoom> {
        currentPlayer.value = player
        isHost = false
        connectionState.value = ConnectionState.Connected(roomCode, "One Phone Mode")
        return Result.Success(GameRoom(code = roomCode, hostId = ""))
    }

    override suspend fun leaveRoom() {
        connectionState.value = ConnectionState.Idle
    }

    override suspend fun sendMessage(message: TransportMessage) {
        // In one-phone mode, messages are handled locally
        incomingMessages.trySend(message)
    }

    override suspend fun updateRoomState(room: GameRoom) {
        currentRoom.value = room
    }

    override suspend fun sendChallenge(challenge: ChallengeMessage) {
        incomingMessages.trySend(TransportMessage.Challenge(challenge))
    }

    override suspend fun sendTurnChange(nextPlayerId: String) {
        incomingMessages.trySend(TransportMessage.TurnChange(nextPlayerId, currentRoom.value?.roundNumber ?: 1))
    }

    override suspend fun sendChatMessage(message: ChatMessage) {
        incomingMessages.trySend(TransportMessage.Chat(message))
    }

    override suspend fun requestSync() {
        // No-op for one-phone mode
    }

    override fun shutdown() {
        connectionState.value = ConnectionState.Idle
    }
}

object WifiDirectTransport {
    fun isWifiDirectSupported(context: Context): Boolean {
        return context.packageManager.hasSystemFeature("android.hardware.wifi.direct")
    }
}