package com.couplequest.game.engine

import com.couplequest.data.model.ChatMessage
import com.couplequest.data.model.MessageType
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatManager @Inject constructor() {
    private val _chatState = MutableStateFlow<ChatState>(ChatState())
    val chatState: StateFlow<ChatState> = _chatState

    private val messageChannel = Channel<ChatMessage>(100)
    private var currentRoomId: String? = null
    private var isRoomActive = false

    fun initialize(roomId: String) {
        currentRoomId = roomId
        isRoomActive = true
        _gameState.value = ChatState()
    }

    fun sendMessage(senderId: String, senderName: String, content: String, type: MessageType = MessageType.TEXT) {
        val message = ChatMessage(
            roomId = currentRoomId ?: "",
            senderId = senderId,
            senderName = senderName,
            content = content,
            type = type,
            timestamp = System.currentTimeMillis()
        )

        _gameState.update { state ->
            state.copy(messages = state.messages + message)
        }

        messageChannel.trySend(message)
    }

    fun receiveMessage(message: ChatMessage) {
        _gameState.update { state ->
            if (state.messages.none { it.id == message.id }) {
                state.copy(messages = state.messages + message, unreadCount = state.unreadCount + 1)
            } else {
                state
            }
        }
    }

    fun markAsRead() {
        _gameState.update { state ->
            state.copy(unreadCount = 0)
        }
    }

    fun clearChat() {
        _gameState.update { state ->
            state.copy(messages = emptyList(), unreadCount = 0)
        }
    }

    fun endChat() {
        isRoomActive = false
        // Clear all chat data as per privacy requirements
        clearChat()
        currentRoomId = null
    }

    val outgoingMessages = messageChannel.receiveAsFlow()

    data class ChatState(
        val messages: List<ChatMessage> = emptyList(),
        val isConnected: Boolean = true,
        val unreadCount: Int = 0
    )

    companion object {
        fun createSystemMessage(roomId: String, content: String): ChatMessage {
            return ChatMessage(
                roomId = roomId,
                senderId = "system",
                senderName = "System",
                content = content,
                type = MessageType.SYSTEM,
                timestamp = System.currentTimeMillis()
            )
        }
    }
}