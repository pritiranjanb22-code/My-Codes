package com.couplequest.multiplayer.transport

import com.couplequest.data.model.GameRoom
import com.couplequest.data.model.Player
import kotlinx.coroutines.channels.ReceiveChannel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

interface TransportInterface {
    val connectionState: StateFlow<ConnectionState>
    val incomingMessages: ReceiveChannel<TransportMessage>
    val currentRoom: MutableStateFlow<GameRoom?>
    val currentPlayer: MutableStateFlow<Player?>
    val isHost: Boolean

    suspend fun initialize()
    suspend fun createRoom(room: GameRoom, player: Player): Result<String>
    suspend fun joinRoom(roomCode: String, player: Player): Result<GameRoom>
    suspend fun leaveRoom()
    suspend fun sendMessage(message: TransportMessage)
    suspend fun updateRoomState(room: GameRoom)
    suspend fun sendChallenge(challenge: ChallengeMessage)
    suspend fun sendTurnChange(nextPlayerId: String)
    suspend fun sendChatMessage(message: ChatMessage)
    suspend fun requestSync()
    fun shutdown()
}

sealed class ConnectionState {
    data class Connected(val roomCode: String, val peerName: String) : ConnectionState()
    data class Connecting(val message: String) : ConnectionState()
    data class Disconnected(val reason: String?) : ConnectionState()
    data class Error(val message: String) : ConnectionState()
    object Idle : ConnectionState()
}

sealed class TransportMessage {
    data class RoomState(val room: GameRoom) : TransportMessage()
    data class Challenge(val challenge: ChallengeMessage) : TransportMessage()
    data class TurnChange(val nextPlayerId: String, val roundNumber: Int) : TransportMessage()
    data class Chat(val message: ChatMessage) : TransportMessage()
    data class PlayerJoined(val player: Player) : TransportMessage()
    data class PlayerLeft(val playerId: String) : TransportMessage()
    data class SyncRequest(val requestId: String) : TransportMessage()
    data class SyncResponse(val room: GameRoom, val requestId: String) : TransportMessage()
    data class Error(val message: String) : TransportMessage()
    data class Ping : TransportMessage()
    data class Pong : TransportMessage()
}

data class ChallengeMessage(
    val challengeId: String,
    val title: String,
    val description: String,
    val category: String,
    val gameMode: String,
    val difficulty: String,
    val isAdultContent: Boolean,
    val timerSeconds: Int?,
    val illustrationUrl: String?,
    val tips: String?
)

data class ChatMessage(
    val id: String,
    val roomId: String,
    val senderId: String,
    val senderName: String,
    val content: String,
    val type: String,
    val timestamp: Long
)

sealed class Result<out T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Failure(val exception: Throwable) : Result<Nothing>()
}