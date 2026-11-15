package com.couplequest.data.repository

import com.couplequest.data.local.AppDatabase
import com.couplequest.data.local.GameRoomDao
import com.couplequest.data.local.PlayerDao
import com.couplequest.data.model.GameRoom
import com.couplequest.data.model.Player
import com.couplequest.data.model.RoomStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GameRoomRepository @Inject constructor(
    private val database: AppDatabase
) {
    private val roomDao: GameRoomDao = database.gameRoomDao()
    private val playerDao: PlayerDao = database.playerDao()

    suspend fun createRoom(room: GameRoom) {
        roomDao.insert(room)
    }

    suspend fun updateRoom(room: GameRoom) {
        roomDao.update(room)
    }

    suspend fun getRoomByCode(code: String): GameRoom? {
        return roomDao.getRoomByCode(code)
    }

    suspend fun getRoomById(id: String): GameRoom? {
        return roomDao.getRoomById(id)
    }

    fun getActiveRooms(): Flow<List<GameRoom>> {
        return roomDao.getActiveRooms()
    }

    fun getRoomsForPlayer(playerId: String): Flow<List<GameRoom>> {
        return roomDao.getRoomsForPlayer(playerId)
    }

    suspend fun deleteRoom(roomId: String) {
        roomDao.deleteRoom(roomId)
    }

    suspend fun updateRoomStatus(roomId: String, status: RoomStatus) {
        roomDao.updateRoomStatus(roomId, status.name, System.currentTimeMillis())
    }

    suspend fun savePlayer(player: Player) {
        playerDao.insert(player)
    }

    suspend fun updatePlayer(player: Player) {
        playerDao.update(player)
    }

    suspend fun getPlayerById(id: String): Player? {
        return playerDao.getPlayerById(id)
    }

    suspend fun getLastPlayer(): Player? {
        return playerDao.getLastPlayer()
    }
}