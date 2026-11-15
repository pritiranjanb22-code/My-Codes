package com.couplequest.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.couplequest.data.model.Challenge
import com.couplequest.data.model.ChallengeHistoryEntry
import com.couplequest.data.model.GameRoom
import com.couplequest.data.model.GameSession
import com.couplequest.data.model.Player
import kotlinx.coroutines.flow.Flow

@Dao
interface ChallengeDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(challenges: List<Challenge>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(challenge: Challenge)

    @Query("SELECT * FROM challenges WHERE gameMode = :gameMode AND category = :category")
    fun getChallengesByModeAndCategory(gameMode: String, category: String): Flow<List<Challenge>>

    @Query("SELECT * FROM challenges WHERE gameMode = :gameMode")
    fun getChallengesByGameMode(gameMode: String): Flow<List<Challenge>>

    @Query("SELECT * FROM challenges WHERE gameMode = :gameMode AND isAdultContent = :isAdultContent")
    fun getChallengesByGameModeAndAdultContent(gameMode: String, isAdultContent: Boolean): Flow<List<Challenge>>

    @Query("SELECT * FROM challenges WHERE id IN (:challengeIds)")
    fun getChallengesByIds(challengeIds: List<String>): Flow<List<Challenge>>

    @Query("SELECT * FROM challenges WHERE gameMode = :gameMode AND id NOT IN (:excludedIds) ORDER BY RANDOM() LIMIT :limit")
    fun getRandomChallenges(gameMode: String, excludedIds: List<String>, limit: Int): Flow<List<Challenge>>

    @Query("SELECT * FROM challenges WHERE gameMode = :gameMode AND isAdultContent = :isAdultContent AND id NOT IN (:excludedIds) ORDER BY RANDOM() LIMIT :limit")
    fun getRandomChallengesFiltered(gameMode: String, isAdultContent: Boolean, excludedIds: List<String>, limit: Int): Flow<List<Challenge>>

    @Query("SELECT * FROM challenges")
    fun getAllChallenges(): Flow<List<Challenge>>

    @Query("DELETE FROM challenges")
    suspend fun clearAll()
}

@Dao
interface GameRoomDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(room: GameRoom)

    @Update
    suspend fun update(room: GameRoom)

    @Query("SELECT * FROM game_rooms WHERE code = :code")
    suspend fun getRoomByCode(code: String): GameRoom?

    @Query("SELECT * FROM game_rooms WHERE id = :id")
    suspend fun getRoomById(id: String): GameRoom?

    @Query("SELECT * FROM game_rooms WHERE hostId = :hostId OR player1Id = :hostId OR player2Id = :hostId ORDER BY lastActivityAt DESC")
    fun getRoomsForPlayer(hostId: String): Flow<List<GameRoom>>

    @Query("SELECT * FROM game_rooms WHERE status IN ('WAITING', 'IN_PROGRESS', 'PAUSED') ORDER BY lastActivityAt DESC")
    fun getActiveRooms(): Flow<List<GameRoom>>

    @Query("DELETE FROM game_rooms WHERE id = :id")
    suspend fun deleteRoom(id: String)

    @Query("UPDATE game_rooms SET status = :status, lastActivityAt = :lastActivity WHERE id = :id")
    suspend fun updateRoomStatus(id: String, status: String, lastActivity: Long)
}

@Dao
interface PlayerDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(player: Player)

    @Update
    suspend fun update(player: Player)

    @Query("SELECT * FROM players WHERE id = :id")
    suspend fun getPlayerById(id: String): Player?

    @Query("SELECT * FROM players ORDER BY createdAt DESC LIMIT 1")
    suspend fun getLastPlayer(): Player?

    @Query("DELETE FROM players WHERE id = :id")
    suspend fun deletePlayer(id: String)
}

@Dao
interface GameSessionDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(session: GameSession)

    @Query("SELECT * FROM game_sessions WHERE player1Id = :playerId OR player2Id = :playerId ORDER BY startedAt DESC")
    fun getSessionsForPlayer(playerId: String): Flow<List<GameSession>>

    @Query("SELECT * FROM game_sessions ORDER BY startedAt DESC LIMIT :limit")
    fun getRecentSessions(limit: Int): Flow<List<GameSession>>

    @Query("SELECT COUNT(*) FROM game_sessions WHERE player1Id = :playerId OR player2Id = :playerId")
    suspend fun getTotalSessions(playerId: String): Int

    @Query("SELECT SUM(roundsPlayed) FROM game_sessions WHERE player1Id = :playerId OR player2Id = :playerId")
    suspend fun getTotalRounds(playerId: String): Int?

    @Query("SELECT SUM(challengesCompleted) FROM game_sessions WHERE player1Id = :playerId OR player2Id = :playerId")
    suspend fun getTotalCompleted(playerId: String): Int?

    @Query("SELECT SUM(challengesSkipped) FROM game_sessions WHERE player1Id = :playerId OR player2Id = :playerId")
    suspend fun getTotalSkipped(playerId: String): Int?
}

@Dao
interface ChallengeHistoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(entries: List<ChallengeHistoryEntry>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: ChallengeHistoryEntry)

    @Query("SELECT * FROM challenge_history WHERE sessionId = :sessionId ORDER BY revealedAt")
    suspend fun getHistoryForSession(sessionId: String): List<ChallengeHistoryEntry>

    @Query("SELECT * FROM challenge_history WHERE challengeId = :challengeId ORDER BY revealedAt DESC LIMIT 1")
    suspend fun getLastPlayedForChallenge(challengeId: String): ChallengeHistoryEntry?
}