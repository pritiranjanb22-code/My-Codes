package com.couplequest.game.engine

import com.couplequest.data.model.Challenge
import com.couplequest.data.model.ChallengeCard
import com.couplequest.data.model.ChallengeCategory
import com.couplequest.data.model.GameMode
import com.couplequest.data.model.GameRoom
import com.couplequest.data.model.Player
import com.couplequest.data.repository.ChallengeRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TurnManager @Inject constructor(
    private val challengeRepository: ChallengeRepository
) {
    private val _gameState = MutableStateFlow<GameState>(GameState.initial())
    val gameState: StateFlow<GameState> = _gameState

    private var currentRoom: GameRoom? = null
    private var players: Pair<Player, Player>? = null
    private var excludedChallengeIds: MutableList<String> = mutableListOf()
    private var isAdultContentEnabled = false

    fun initialize(room: GameRoom, player1: Player, player2: Player, isAdultContentEnabled: Boolean) {
        currentRoom = room
        players = player1 to player2
        this.isAdultContentEnabled = isAdultContentEnabled
        excludedChallengeIds.clear()

        val firstPlayerId = if (room.currentTurn.isNotBlank()) room.currentTurn else player1.id
        val isPlayer1Turn = firstPlayerId == player1.id

        _gameState.value = GameState(
            room = room,
            player1 = player1,
            player2 = player2,
            currentTurnPlayerId = firstPlayerId,
            isPlayer1Turn = isPlayer1Turn,
            roundNumber = room.roundNumber,
            maxRounds = room.maxRounds,
            currentChallenge = null,
            challengeHistory = emptyList(),
            completedChallenges = emptyList(),
            skippedChallenges = emptyList(),
            isGameActive = room.status.name == "IN_PROGRESS",
            isAdultContentEnabled = isAdultContentEnabled
        )
    }

    fun startGame() {
        _gameState.update { it.copy(isGameActive = true) }
        nextTurn()
    }

    fun nextTurn() {
        _gameState.update { state ->
            val nextPlayerId = if (state.isPlayer1Turn) state.player2.id else state.player1.id
            val nextRound = if (!state.isPlayer1Turn) state.roundNumber + 1 else state.roundNumber
            val isGameOver = nextRound > state.maxRounds

            state.copy(
                currentTurnPlayerId = nextPlayerId,
                isPlayer1Turn = !state.isPlayer1Turn,
                roundNumber = nextRound,
                currentChallenge = null,
                isGameActive = !isGameOver
            )
        }
    }

    fun revealChallenge(forPlayerId: String): ChallengeCard? {
        val state = _gameState.value
        val room = currentRoom
        val gameMode = room?.gameMode ?: GameMode.TRUTH_OR_DARE

        if (state.currentChallenge != null) {
            return state.currentChallenge
        }

        // Get a random challenge
        val challenge = getRandomChallenge(gameMode)
        challenge?.let { challenge ->
            val card = ChallengeCard(challenge = challenge, revealedBy = forPlayerId, revealedAt = System.currentTimeMillis())
            _gameState.update { it.copy(currentChallenge = card) }
            return card
        }
        return null
    }

    private fun getRandomChallenge(gameMode: GameMode): Challenge? {
        // This would be called from a coroutine context in real usage
        // For now, return null - actual implementation uses Flow
        return null
    }

    suspend fun getRandomChallengeAsync(gameMode: GameMode): Challenge? {
        val excluded = excludedChallengeIds + _gameState.value.completedChallenges + _gameState.value.skippedChallenges
        val challenges = challengeRepository.getRandomChallenges(gameMode, excluded, 1, isAdultContentEnabled)
        return challenges.firstOrNull()
    }

    fun completeCurrentChallenge() {
        _gameState.update { state ->
            val currentChallenge = state.currentChallenge
            if (currentChallenge == null) return@update state

            val updatedChallenge = currentChallenge.copy(isCompleted = true, completedAt = System.currentTimeMillis())
            val newCompleted = state.completedChallenges + currentChallenge.challenge.id
            excludedChallengeIds.add(currentChallenge.challenge.id)

            state.copy(
                currentChallenge = updatedChallenge,
                challengeHistory = state.challengeHistory + updatedChallenge,
                completedChallenges = newCompleted
            )
        }
    }

    fun skipCurrentChallenge() {
        _gameState.update { state ->
            val currentChallenge = state.currentChallenge
            if (currentChallenge == null) return@update state

            val updatedChallenge = currentChallenge.copy(isSkipped = true)
            val newSkipped = state.skippedChallenges + currentChallenge.challenge.id
            excludedChallengeIds.add(currentChallenge.challenge.id)

            state.copy(
                currentChallenge = updatedChallenge,
                challengeHistory = state.challengeHistory + updatedChallenge,
                skippedChallenges = newSkipped
            )
        }
    }

    fun rerollCurrentChallenge() {
        _gameState.update { state ->
            val currentChallenge = state.currentChallenge
            if (currentChallenge == null) return@update state

            val newSkipped = state.skippedChallenges + currentChallenge.challenge.id
            excludedChallengeIds.add(currentChallenge.challenge.id)

            state.copy(
                currentChallenge = null,
                skippedChallenges = newSkipped
            )
        }
        // Next reveal will get a new challenge
    }

    fun hideCurrentChallenge() {
        _gameState.update { state ->
            state.currentChallenge?.let { challenge ->
                state.copy(currentChallenge = challenge.copy(isRevealed = false))
            } ?: state
        }
    }

    fun setAdultContentEnabled(enabled: Boolean) {
        isAdultContentEnabled = enabled
        _gameState.update { it.copy(isAdultContentEnabled = enabled) }
    }

    fun endGame() {
        _gameState.update { it.copy(isGameActive = false) }
    }

    fun resetGame() {
        excludedChallengeIds.clear()
        _gameState.value = GameState.initial()
    }

    data class GameState(
        val room: GameRoom? = null,
        val player1: Player? = null,
        val player2: Player? = null,
        val currentTurnPlayerId: String = "",
        val isPlayer1Turn: Boolean = true,
        val roundNumber: Int = 1,
        val maxRounds: Int = 10,
        val currentChallenge: ChallengeCard? = null,
        val challengeHistory: List<ChallengeCard> = emptyList(),
        val completedChallenges: List<String> = emptyList(),
        val skippedChallenges: List<String> = emptyList(),
        val isGameActive: Boolean = false,
        val isAdultContentEnabled: Boolean = false
    ) {
        companion object {
            fun initial(): GameState = GameState()
        }
    }
}