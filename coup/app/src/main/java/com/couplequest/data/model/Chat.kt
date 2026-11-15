package com.couplequest.data.model

import androidx.annotation.Keep
import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Keep
@Serializable
@Entity(tableName = "chat_messages")
data class ChatMessage(
    @PrimaryKey val id: String = java.util.UUID.randomUUID().toString(),
    val roomId: String,
    val senderId: String,
    val senderName: String,
    val content: String,
    val type: MessageType = MessageType.TEXT,
    val timestamp: Long = System.currentTimeMillis(),
    val isDelivered: Boolean = false,
    val isRead: Boolean = false
)

@Serializable
enum class MessageType {
    TEXT,
    EMOJI,
    SYSTEM,
    CHALLENGE_REVEAL,
    TURN_CHANGE
}

@Serializable
data class ChatState(
    val messages: List<ChatMessage> = emptyList(),
    val isConnected: Boolean = false,
    val unreadCount: Int = 0
)