package com.couplequest.data.repository

import com.couplequest.data.local.AppDatabase
import com.couplequest.data.local.ChallengeHistoryDao
import com.couplequest.data.local.GameSessionDao
import com.couplequest.data.model.ChallengeHistoryEntry
import com.couplequest.data.model.GameSession
import com.couplequest.data.model.GameStats
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GameSessionRepository @Inject constructor(
    private val database: AppDatabase
) {
    private val sessionDao: GameSessionDao = database.gameSessionDao()
    private val historyDao: ChallengeHistoryDao = database.challengeHistoryDao()

    suspend fun saveSession(session: GameSession) {
        sessionDao.insert(session)
    }

    fun getSessionsForPlayer(playerId: String): Flow<List<GameSession>> {
        return sessionDao.getSessionsForPlayer(playerId)
    }

    fun getRecentSessions(limit: Int): Flow<List<GameSession>> {
        return sessionDao.getRecentSessions(limit)
    }

    suspend fun saveChallengeHistory(entries: List<ChallengeHistoryEntry>) {
        historyDao.insertAll(entries)
    }

    suspend fun saveChallengeHistoryEntry(entry: ChallengeHistoryEntry) {
        historyDao.insert(entry)
    }

    suspend fun getHistoryForSession(sessionId: String): List<ChallengeHistoryEntry> {
        return historyDao.getHistoryForSession(sessionId)
    }

    suspend fun getLastPlayedForChallenge(challengeId: String): ChallengeHistoryEntry? {
        return historyDao.getLastPlayedForChallenge(challengeId)
    }

    fun getGameStats(playerId: String): Flow<GameStats> {
        return combine(
            sessionDao.getTotalSessions(playerId).asFlow(),
            sessionDao.getTotalRounds(playerId).asFlow(),
            sessionDao.getTotalCompleted(playerId).asFlow(),
            sessionDao.getTotalSkipped(playerId).asFlow(),
            getSessionsForPlayer(playerId)
        ) { totalSessions, totalRounds, totalCompleted, totalSkipped, sessions ->
            val favoriteMode = sessions
                .groupBy { it.gameMode }
                .maxByOrNull { it.value.size }
                ?.key

            val longestSession = sessions.maxByOrNull { it.durationMinutes }?.durationMinutes ?: 0
            val lastPlayed = sessions.firstOrNull()?.startedAt

            GameStats(
                totalSessions = totalSessions,
                totalRounds = totalRounds ?: 0,
                totalChallengesCompleted = totalCompleted ?: 0,
                totalChallengesSkipped = totalSkipped ?: 0,
                favoriteGameMode = favoriteMode,
                longestSessionMinutes = longestSession,
                lastPlayedAt = lastPlayed
            )
        }
    }
}