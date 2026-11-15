package com.couplequest.data.model

import androidx.annotation.Keep
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Keep
@Serializable
@Entity(
    tableName = "challenges",
    indices = [Index(value = ["category", "gameMode"]), Index(value = ["difficulty"])]
)
data class Challenge(
    @PrimaryKey val id: String = java.util.UUID.randomUUID().toString(),
    val title: String,
    val description: String,
    val category: ChallengeCategory,
    val gameMode: GameMode,
    val difficulty: Difficulty = Difficulty.MEDIUM,
    val timerSeconds: Int? = null,
    val illustrationUrl: String? = null,
    val tips: String? = null,
    val isAdultContent: Boolean = false,
    val tags: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
enum class ChallengeCategory {
    ROMANTIC,
    FUNNY,
    RELATIONSHIP,
    DEEP_QUESTIONS,
    PLAYFUL,
    ADULT_INTIMACY,
    GENTLE,
    SEATED,
    STANDING,
    SIDE_BY_SIDE,
    BEGINNER_FRIENDLY,
    COUPLES_CHOICE,
    DATE_IDEAS,
    COMPLIMENTS,
    AFFECTION,
    THOUGHTFUL_GESTURES,
    SURPRISE_ACTIVITIES,
    COMMUNICATION,
    TRUST_BUILDING,
    FUTURE_PLANNING
}

@Serializable
enum class GameMode {
    TRUTH_OR_DARE,
    INTIMATE_POSITIONS,
    ROMANTIC_CHALLENGES,
    COUPLE_QUESTIONS
}

@Serializable
enum class Difficulty {
    EASY,
    MEDIUM,
    HARD,
    EXPERT
}

@Serializable
enum class ChallengeType {
    TRUTH,
    DARE,
    POSITION,
    QUESTION,
    ACTIVITY
}

@Serializable
data class ChallengeCard(
    val challenge: Challenge,
    val isRevealed: Boolean = false,
    val isCompleted: Boolean = false,
    val isSkipped: Boolean = false,
    val revealedBy: String? = null,
    val revealedAt: Long? = null,
    val completedAt: Long? = null
)

@Serializable
data class ChallengePack(
    val id: String,
    val name: String,
    val description: String,
    val gameMode: GameMode,
    val categories: List<ChallengeCategory>,
    val challengeIds: List<String>,
    val isDefault: Boolean = true
)