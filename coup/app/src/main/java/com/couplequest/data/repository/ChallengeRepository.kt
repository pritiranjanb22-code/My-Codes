package com.couplequest.data.repository

import com.couplequest.data.local.AppDatabase
import com.couplequest.data.local.ChallengeDao
import com.couplequest.data.model.Challenge
import com.couplequest.data.model.ChallengeCategory
import com.couplequest.data.model.GameMode
import com.couplequest.data.model.Difficulty
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChallengeRepository @Inject constructor(
    private val database: AppDatabase
) {
    private val dao: ChallengeDao = database.challengeDao()

    fun getChallengesByGameMode(gameMode: GameMode): Flow<List<Challenge>> {
        return dao.getChallengesByGameMode(gameMode.name)
    }

    fun getChallengesByGameModeAndCategory(gameMode: GameMode, category: ChallengeCategory): Flow<List<Challenge>> {
        return dao.getChallengesByModeAndCategory(gameMode.name, category.name)
    }

    fun getChallengesByGameModeAndAdultContent(gameMode: GameMode, isAdultContent: Boolean): Flow<List<Challenge>> {
        return dao.getChallengesByGameModeAndAdultContent(gameMode.name, isAdultContent)
    }

    fun getRandomChallenges(
        gameMode: GameMode,
        excludedIds: List<String>,
        limit: Int,
        includeAdultContent: Boolean
    ): Flow<List<Challenge>> {
        if (includeAdultContent) {
            return dao.getRandomChallenges(gameMode.name, excludedIds, limit)
        } else {
            return dao.getRandomChallengesFiltered(gameMode.name, false, excludedIds, limit)
        }
    }

    fun getAllChallenges(): Flow<List<Challenge>> {
        return dao.getAllChallenges()
    }

    suspend fun insertChallenges(challenges: List<Challenge>) {
        dao.insertAll(challenges)
    }

    suspend fun insertChallenge(challenge: Challenge) {
        dao.insert(challenge)
    }

    suspend fun clearAllChallenges() {
        dao.clearAll()
    }

    fun getChallengesByDifficulty(gameMode: GameMode, difficulty: Difficulty): Flow<List<Challenge>> {
        return dao.getChallengesByGameMode(gameMode.name)
            .map { challenges ->
                challenges.filter { it.difficulty == difficulty }
            }
    }
}