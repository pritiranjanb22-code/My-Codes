package com.couplequest.data.model

import androidx.annotation.Keep
import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Keep
@Serializable
@Entity(tableName = "game_rooms")
data class GameRoom(
    @PrimaryKey val id: String = java.util.UUID.randomUUID().toString(),
    val code: String,
    val hostId: String,
    val player1Id: String? = null,
    val player2Id: String? = null,
    val player1Name: String = "Player 1",
    val player2Name: String = "Player 2",
    val player1Avatar: String = "default",
    val player2Avatar: String = "default",
    val gameMode: GameMode = GameMode.TRUTH_OR_DARE,
    val connectionType: ConnectionType = ConnectionType.ONE_PHONE,
    val status: RoomStatus = RoomStatus.WAITING,
    val currentTurn: String = "", // player ID whose turn it is
    val roundNumber: Int = 1,
    val maxRounds: Int = 10,
    val createdAt: Long = System.currentTimeMillis(),
    val startedAt: Long? = null,
    val endedAt: Long? = null,
    val lastActivityAt: Long = System.currentTimeMillis()
)

@Serializable
enum class ConnectionType {
    ONE_PHONE,
    WIFI_DIRECT,
    BLUETOOTH,
    SAME_WIFI
}

@Serializable
enum class RoomStatus {
    WAITING,
    IN_PROGRESS,
    PAUSED,
    ENDED,
    EXPIRED
}

@Serializable
data class RoomState(
    val room: GameRoom,
    val player1: Player? = null,
    val player2: Player? = null,
    val currentChallenge: ChallengeCard? = null,
    val challengeHistory: List<ChallengeCard> = emptyList(),
    val completedChallenges: List<String> = emptyList(),
    val skippedChallenges: List<String> = emptyList(),
    val isPlayer1Turn: Boolean = true,
    val turnStartTime: Long = 0
)