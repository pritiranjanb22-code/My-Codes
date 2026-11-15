package com.wifichat.data.repository

import com.wifichat.data.dao.*
import com.wifichat.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class UserRepository(private val dao: UserDao) {
    suspend fun insert(user: User) = dao.insert(user)
    suspend fun update(user: User) = dao.update(user)
    suspend fun getById(id: String): User? = dao.getById(id)
    suspend fun getByUsername(username: String): User? = dao.getByUsername(username)
    suspend fun getByDeviceId(deviceId: String): User? = dao.getByDeviceId(deviceId)
    fun getOnlineUsers(): Flow<List<User>> = dao.getOnlineUsers()
    suspend fun setOnlineStatus(userId: String, isOnline: Boolean) {
        dao.getById(userId)?.let { user ->
            dao.update(user.copy(isOnline = isOnline, lastSeen = if (isOnline) 0 else System.currentTimeMillis()))
        }
    }
}

class ContactRepository(private val dao: ContactDao) {
    suspend fun insert(contact: Contact) = dao.insert(contact)
    suspend fun update(contact: Contact) = dao.update(contact)
    suspend fun delete(contactId: String) = dao.deleteById(contactId)
    suspend fun getByUserId(userId: String): Contact? = dao.getByUserId(userId)
    fun getAll(): Flow<List<Contact>> = dao.getAll()
    fun getFavorites(): Flow<List<Contact>> = dao.getFavorites()
    fun getBlocked(): Flow<List<Contact>> = dao.getBlocked()
    suspend fun setFavorite(contactId: String, favorite: Boolean) {
        dao.getByUserId(contactId)?.let { contact ->
            dao.update(contact.copy(isFavorite = favorite))
        }
    }
    suspend fun setBlocked(contactId: String, blocked: Boolean) {
        dao.getByUserId(contactId)?.let { contact ->
            dao.update(contact.copy(isBlocked = blocked))
        }
    }
}

class ConversationRepository(private val dao: ConversationDao) {
    suspend fun insert(conversation: Conversation) = dao.insert(conversation)
    suspend fun update(conversation: Conversation) = dao.update(conversation)
    suspend fun getById(id: String): Conversation? = dao.getById(id)
    suspend fun getByIds(ids: List<String>): List<Conversation> = dao.getByIds(ids)
    fun getForUser(userId: String): Flow<List<Conversation>> = dao.getForUser(userId)
    fun getDirectForUser(userId: String): Flow<List<Conversation>> = dao.getByTypeForUser(userId, ConversationType.DIRECT)
    fun getGroupsForUser(userId: String): Flow<List<Conversation>> = dao.getByTypeForUser(userId, ConversationType.GROUP)
    suspend fun incrementUnread(id: String) = dao.incrementUnreadCount(id)
    suspend fun clearUnread(id: String) = dao.clearUnreadCount(id)
}

class MessageRepository(private val dao: MessageDao) {
    suspend fun insert(message: Message) = dao.insert(message)
    suspend fun insertAll(messages: List<Message>) = dao.insertAll(messages)
    suspend fun update(message: Message) = dao.update(message)
    suspend fun getByConversation(conversationId: String, limit: Int, offset: Int): List<Message> = dao.getByConversation(conversationId, limit, offset)
    fun getByConversationFlow(conversationId: String): Flow<List<Message>> = dao.getByConversationFlow(conversationId)
    suspend fun getById(id: String): Message? = dao.getById(id)
    suspend fun getUnsentMessages(conversationId: String): List<Message> = dao.getUnsentMessages(conversationId, MessageStatus.SENDING)
    suspend fun deleteOldMessages(threshold: Long) = dao.deleteOldMessages(threshold)
}

class CallLogRepository(private val dao: CallLogDao) {
    suspend fun insert(callLog: CallLog) = dao.insert(callLog)
    fun getByConversation(conversationId: String): Flow<List<CallLog>> = dao.getByConversation(conversationId)
    suspend fun getForUser(userId: String, limit: Int): List<CallLog> = dao.getForUser(userId, limit)
}