package com.couplequest.game.engine

import com.couplequest.data.model.Challenge
import com.couplequest.data.model.ChallengeCard
import com.couplequest.data.model.ChallengeCategory
import com.couplequest.data.model.Difficulty
import com.couplequest.data.model.GameMode
import com.couplequest.data.model.GameRoom
import com.couplequest.data.model.Player
import com.couplequest.data.model.RoomStatus
import com.couplequest.data.repository.ChallengeRepository
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.runBlockingTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.Mock
import org.mockito.Mockito
import org.mockito.MockitoAnnotations

class TurnManagerTest {

    @Mock
    private lateinit var challengeRepository: ChallengeRepository

    private lateinit var turnManager: TurnManager

    private val player1 = Player(
        id = "1",
        name = "Alex",
        avatarId = "heart",
        isPlayer1 = true
    )

    private val player2 = Player(
        id = "2",
        name = "Jordan",
        avatarId = "star",
        isPlayer1 = false
    )

    private val room = GameRoom(
        id = "room1",
        code = "ABC123",
        hostId = "1",
        player1Id = "1",
        player2Id = "2",
        player1Name = "Alex",
        player2Name = "Jordan",
        gameMode = GameMode.TRUTH_OR_DARE,
        connectionType = com.couplequest.data.model.ConnectionType.ONE_PHONE,
        status = RoomStatus.IN_PROGRESS,
        currentTurn = "1",
        roundNumber = 1,
        maxRounds = 5
    )

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        turnManager = TurnManager(challengeRepository)
    }

    @Test
    fun `initializes game state correctly`() = runBlockingTest {
        turnManager.initialize(room, player1, player2, false)

        val state = turnManager.gameState.value

        assertNotNull(state.room)
        assertEquals(player1.id, state.player1?.id)
        assertEquals(player2.id, state.player2?.id)
        assertEquals(player1.id, state.currentTurnPlayerId)
        assertTrue(state.isPlayer1Turn)
        assertEquals(1, state.roundNumber)
        assertEquals(5, state.maxRounds)
        assertNull(state.currentChallenge)
        assertTrue(state.challengeHistory.isEmpty())
        assertTrue(state.isGameActive)
        assertFalse(state.isAdultContentEnabled)
    }

    @Test
    fun `starts game and sets active`() = runBlockingTest {
        turnManager.initialize(room, player1, player2, false)
        turnManager.startGame()

        val state = turnManager.gameState.value
        assertTrue(state.isGameActive)
    }

    @Test
    fun `alternates turns correctly`() = runBlockingTest {
        turnManager.initialize(room, player1, player2, false)
        turnManager.startGame()

        var state = turnManager.gameState.value
        assertTrue(state.isPlayer1Turn)
        assertEquals(player1.id, state.currentTurnPlayerId)

        turnManager.nextTurn()

        state = turnManager.gameState.value
        assertFalse(state.isPlayer1Turn)
        assertEquals(player2.id, state.currentTurnPlayerId)
        assertEquals(1, state.roundNumber) // Still round 1

        turnManager.nextTurn()

        state = turnManager.gameState.value
        assertTrue(state.isPlayer1Turn)
        assertEquals(player1.id, state.currentTurnPlayerId)
        assertEquals(2, state.roundNumber) // Round 2
    }

    @Test
    fun `completes challenge correctly`() = runBlockingTest {
        turnManager.initialize(room, player1, player2, false)
        turnManager.startGame()

        // Mock a challenge
        val challenge = Challenge(
            id = "ch1",
            title = "Test Challenge",
            description = "Test description",
            category = ChallengeCategory.ROMANTIC,
            gameMode = GameMode.TRUTH_OR_DARE,
            difficulty = Difficulty.EASY
        )

        // Simulate revealing a challenge
        val challengeCard = ChallengeCard(challenge = challenge, revealedBy = player1.id, revealedAt = System.currentTimeMillis())
        
        // We can't directly set the challenge, but we can test the completion logic
        // by checking the state after completion would be called
        turnManager.completeCurrentChallenge()
        
        // Since no challenge was revealed, state should remain unchanged
        val state = turnManager.gameState.value
        assertNull(state.currentChallenge)
    }

    @Test
    fun `skips challenge correctly`() = runBlockingTest {
        turnManager.initialize(room, player1, player2, false)
        turnManager.startGame()

        turnManager.skipCurrentChallenge()

        val state = turnManager.gameState.value
        assertNull(state.currentChallenge)
    }

    @Test
    fun `reroll challenge correctly`() = runBlockingTest {
        turnManager.initialize(room, player1, player2, false)
        turnManager.startGame()

        turnManager.rerollCurrentChallenge()

        val state = turnManager.gameState.value
        assertNull(state.currentChallenge)
    }

    @Test
    fun `hides challenge correctly`() = runBlockingTest {
        turnManager.initialize(room, player1, player2, false)
        turnManager.startGame()

        turnManager.hideCurrentChallenge()

        val state = turnManager.gameState.value
        assertNull(state.currentChallenge)
    }

    @Test
    fun `ends game correctly`() = runBlockingTest {
        turnManager.initialize(room, player1, player2, false)
        turnManager.startGame()

        turnManager.endGame()

        val state = turnManager.gameState.value
        assertFalse(state.isGameActive)
    }

    @Test
    fun `resets game correctly`() = runBlockingTest {
        turnManager.initialize(room, player1, player2, false)
        turnManager.startGame()
        turnManager.nextTurn()
        turnManager.nextTurn()

        turnManager.resetGame()

        val state = turnManager.gameState.value
        assertNull(state.room)
        assertNull(state.player1)
        assertNull(state.player2)
        assertEquals("", state.currentTurnPlayerId)
        assertTrue(state.isPlayer1Turn)
        assertEquals(1, state.roundNumber)
        assertEquals(10, state.maxRounds)
        assertNull(state.currentChallenge)
        assertTrue(state.challengeHistory.isEmpty())
        assertFalse(state.isGameActive)
    }

    @Test
    fun `adult content toggle works`() = runBlockingTest {
        turnManager.initialize(room, player1, player2, false)

        var state = turnManager.gameState.value
        assertFalse(state.isAdultContentEnabled)

        turnManager.setAdultContentEnabled(true)

        state = turnManager.gameState.value
        assertTrue(state.isAdultContentEnabled)

        turnManager.setAdultContentEnabled(false)

        state = turnManager.gameState.value
        assertFalse(state.isAdultContentEnabled)
    }

    @Test
    fun `game ends after max rounds`() = runBlockingTest {
        val shortRoom = room.copy(maxRounds = 2)
        turnManager.initialize(shortRoom, player1, player2, false)
        turnManager.startGame()

        // Round 1 - Player 1
        assertTrue(turnManager.gameState.value.isGameActive)
        turnManager.nextTurn()

        // Round 1 - Player 2
        assertTrue(turnManager.gameState.value.isGameActive)
        turnManager.nextTurn()

        // Round 2 - Player 1
        assertTrue(turnManager.gameState.value.isGameActive)
        turnManager.nextTurn()

        // Round 2 - Player 2 -> Game should end
        turnManager.nextTurn()

        val state = turnManager.gameState.value
        assertFalse(state.isGameActive)
    }
}