package com.wifichat.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.wifichat.data.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: User)
    
    @Update
    suspend fun update(user: User)
    
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getById(id: String): User?
    
    @Query("SELECT * FROM users WHERE username = :username")
    suspend fun getByUsername(username: String): User?
    
    @Query("SELECT * FROM users WHERE deviceId = :deviceId")
    suspend fun getByDeviceId(deviceId: String): User?
    
    @Query("SELECT * FROM users WHERE isOnline = 1")
    fun getOnlineUsers(): Flow<List<User>>
}

@Dao
interface ContactDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(contact: Contact)
    
    @Update
    suspend fun update(contact: Contact)
    
    @Query("DELETE FROM contacts WHERE id = :id")
    suspend fun deleteById(id: String)
    
    @Query("SELECT * FROM contacts WHERE userId = :userId")
    suspend fun getByUserId(userId: String): Contact?
    
    @Query("SELECT * FROM contacts ORDER BY addedAt DESC")
    fun getAll(): Flow<List<Contact>>
    
    @Query("SELECT * FROM contacts WHERE isFavorite = 1 ORDER BY addedAt DESC")
    fun getFavorites(): Flow<List<Contact>>
    
    @Query("SELECT * FROM contacts WHERE isBlocked = 1")
    fun getBlocked(): Flow<List<Contact>>
}

@Dao
interface ConversationDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(conversation: Conversation)
    
    @Update
    suspend fun update(conversation: Conversation)
    
    @Query("SELECT * FROM conversations WHERE id = :id")
    suspend fun getById(id: String): Conversation?
    
    @Query("SELECT * FROM conversations WHERE id IN (:ids)")
    suspend fun getByIds(ids: List<String>): List<Conversation>
    
    @Query("SELECT * FROM conversations WHERE :userId IN participantIds AND isArchived = 0 ORDER BY updatedAt DESC")
    fun getForUser(userId: String): Flow<List<Conversation>>
    
    @Query("SELECT * FROM conversations WHERE type = :type AND :userId IN participantIds ORDER BY updatedAt DESC")
    fun getByTypeForUser(userId: String, type: ConversationType): Flow<List<Conversation>>
    
    @Query("UPDATE conversations SET unreadCount = unreadCount + 1 WHERE id = :id")
    suspend fun incrementUnreadCount(id: String)
    
    @Query("UPDATE conversations SET unreadCount = 0 WHERE id = :id")
    suspend fun clearUnreadCount(id: String)
}

@Dao
interface MessageDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(message: Message)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(messages: List<Message>)
    
    @Update
    suspend fun update(message: Message)
    
    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY timestamp DESC LIMIT :limit OFFSET :offset")
    suspend fun getByConversation(conversationId: String, limit: Int, offset: Int): List<Message>
    
    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY timestamp ASC")
    fun getByConversationFlow(conversationId: String): Flow<List<Message>>
    
    @Query("SELECT * FROM messages WHERE id = :id")
    suspend fun getById(id: String): Message?
    
    @Query("SELECT * FROM messages WHERE conversationId = :conversationId AND status != :status ORDER BY timestamp ASC")
    suspend fun getUnsentMessages(conversationId: String, status: MessageStatus): List<Message>
    
    @Query("DELETE FROM messages WHERE timestamp < :threshold")
    suspend fun deleteOldMessages(threshold: Long): Int
}

@Dao
interface CallLogDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(callLog: CallLog)
    
    @Query("SELECT * FROM call_logs WHERE conversationId = :conversationId ORDER BY startedAt DESC")
    fun getByConversation(conversationId: String): Flow<List<CallLog>>
    
    @Query("SELECT * FROM call_logs WHERE callerId = :userId OR calleeId = :userId ORDER BY startedAt DESC LIMIT :limit")
    suspend fun getForUser(userId: String, limit: Int): List<CallLog>
}