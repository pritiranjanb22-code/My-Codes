package com.wifichat.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@Entity(tableName = "messages")
data class Message(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val conversationId: String,
    val senderId: String,
    val recipientId: String,
    val type: MessageType,
    val content: String, // Encrypted content or plain text for system messages
    val mediaUrl: String? = null,
    val mediaType: MediaType? = null,
    val mediaSize: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val status: MessageStatus = MessageStatus.SENDING,
    val replyToId: String? = null,
    val isEncrypted: Boolean = true,
    val encryptionNonce: String? = null
) {
    val isSentByMe: Boolean
        get() = senderId == getCurrentUserId()
    
    private fun getCurrentUserId(): String {
        // This would be injected from preferences
        return ""
    }
}

@Serializable
enum class MessageType {
    TEXT,
    IMAGE,
    VIDEO,
    AUDIO,
    FILE,
    LOCATION,
    CONTACT,
    SYSTEM,
    CALL_LOG
}

@Serializable
enum class MediaType {
    IMAGE,
    VIDEO,
    AUDIO,
    DOCUMENT
}

@Serializable
enum class MessageStatus {
    SENDING,
    SENT,
    DELIVERED,
    READ,
    FAILED
}

@Serializable
@Entity(tableName = "conversations")
data class Conversation(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val participantIds: List<String>, // For group chats, multiple IDs
    val type: ConversationType = ConversationType.DIRECT,
    val title: String? = null, // For group chats
    val avatarUrl: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val lastMessageId: String? = null,
    val lastMessagePreview: String? = null,
    val lastMessageTimestamp: Long = 0,
    val unreadCount: Int = 0,
    val isMuted: Boolean = false,
    val isArchived: Boolean = false,
    val encryptionKey: String // Shared encryption key for this conversation
) {
    val isGroup: Boolean
        get() = type == ConversationType.GROUP || participantIds.size > 2
    
    fun getOtherParticipantId(currentUserId: String): String? {
        return participantIds.find { it != currentUserId }
    }
}

@Serializable
enum class ConversationType {
    DIRECT,
    GROUP
}

@Serializable
data class CallLog(
    val id: String = UUID.randomUUID().toString(),
    val conversationId: String,
    val callerId: String,
    val calleeId: String,
    val type: CallType,
    val status: CallStatus,
    val startedAt: Long = System.currentTimeMillis(),
    val endedAt: Long = 0,
    val duration: Long = 0
)

@Serializable
enum class CallType {
    VIDEO,
    AUDIO
}

@Serializable
enum class CallStatus {
    INITIATED,
    RINGING,
    CONNECTED,
    ENDED,
    MISSED,
    DECLINED,
    FAILED
}