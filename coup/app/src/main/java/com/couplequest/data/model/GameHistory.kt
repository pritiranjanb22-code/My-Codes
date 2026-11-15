package com.couplequest.data.model

import androidx.annotation.Keep
import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Keep
@Serializable
@Entity(tableName = "game_sessions")
data class GameSession(
    @PrimaryKey val id: String = java.util.UUID.randomUUID().toString(),
    val roomId: String,
    val player1Id: String,
    val player2Id: String,
    val player1Name: String,
    val player2Name: String,
    val gameMode: GameMode,
    val connectionType: ConnectionType,
    val roundsPlayed: Int,
    val challengesCompleted: Int,
    val challengesSkipped: Int,
    val startedAt: Long,
    val endedAt: Long,
    val durationMinutes: Long
)

@Keep
@Serializable
@Entity(tableName = "challenge_history")
data class ChallengeHistoryEntry(
    @PrimaryKey val id: String = java.util.UUID.randomUUID().toString(),
    val sessionId: String,
    val challengeId: String,
    val challengeTitle: String,
    val challengeCategory: ChallengeCategory,
    val gameMode: GameMode,
    val revealedBy: String,
    val revealedByName: String,
    val isCompleted: Boolean,
    val isSkipped: Boolean,
    val revealedAt: Long,
    val completedAt: Long?
)

@Serializable
data class GameStats(
    val totalSessions: Int,
    val totalRounds: Int,
    val totalChallengesCompleted: Int,
    val totalChallengesSkipped: Int,
    val favoriteGameMode: GameMode?,
    val longestSessionMinutes: Long,
    val lastPlayedAt: Long?
)