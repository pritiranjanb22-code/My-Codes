package com.couplequest.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.EmojiEmotions
import androidx.compose.material.icons.filled.Send
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.couplequest.data.model.ChatMessage
import com.couplequest.data.model.MessageType
import com.couplequest.game.engine.ChatManager
import com.couplequest.ui.theme.CoupleQuestColors
import com.couplequest.ui.theme.CoupleQuestTheme
import com.couplequest.ui.theme.Typography
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ChatScreen(
    chatState: ChatManager.ChatState,
    currentUserId: String,
    currentUserName: String,
    partnerName: String,
    onSendMessage: (String) -> Unit,
    onCloseChat: () -> Unit,
    onClearChat: () -> Unit,
    isOnePhoneMode: Boolean = false
) {
    var messageText by remember { mutableStateOf("") }
    var showEmojiPicker by remember { mutableStateOf(false) }
    var showClearConfirmation by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        // Chat header
        ChatHeader(
            partnerName = partnerName,
            onClose = onCloseChat,
            onClear = { showClearConfirmation = true },
            isOnePhoneMode = isOnePhoneMode
        )

        // Messages list
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            reverseLayout = true,
            contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 8.dp),
            userScrollEnabled = true
        ) {
            items(chatState.messages.reversed()) { message ->
                MessageBubble(
                    message = message,
                    isCurrentUser = message.senderId == currentUserId,
                    currentUserName = currentUserName
                )
            }
        }

        // Privacy notice
        if (isOnePhoneMode) {
            OnePhoneChatNotice()
        } else {
            TwoPhoneChatNotice()
        }

        // Message input
        MessageInput(
            messageText = messageText,
            onMessageChange = { messageText = it },
            onSend = {
                if (messageText.isNotBlank()) {
                    onSendMessage(messageText)
                    messageText = ""
                }
            },
            onEmojiClick = { showEmojiPicker = !showEmojiPicker },
            onHideMessage = isOnePhoneMode
        )

        // Clear confirmation dialog
        if (showClearConfirmation) {
            ClearChatConfirmation(
                onConfirm = {
                    onClearChat()
                    showClearConfirmation = false
                },
                onCancel = { showClearConfirmation = false }
            )
        }
    }
}

@Composable
fun ChatHeader(
    partnerName: String,
    onClose: () -> Unit,
    onClear: () -> Unit,
    isOnePhoneMode: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(bottomStart = 16.dp, bottomEnd = 16.dp)
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Private Chat",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    color = CoupleQuestColors.OnSurface
                )
                Text(
                    text = "with $partnerName",
                    fontSize = 12.sp,
                    color = CoupleQuestColors.OnSurfaceVariant
                )
            }

            androidx.compose.foundation.layout.Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                IconButton(onClick = onClear) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Clear chat",
                        tint = CoupleQuestColors.OnSurfaceVariant
                    )
                }
                IconButton(onClick = onClose) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close chat",
                        tint = CoupleQuestColors.OnSurface
                    )
                }
            }
        }
    }
}

@Composable
fun MessageBubble(
    message: ChatMessage,
    isCurrentUser: Boolean,
    currentUserName: String
) {
    val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
    val timeString = timeFormat.format(Date(message.timestamp))

    val (bgColor, textColor, alignment) = if (isCurrentUser) {
        CoupleQuestColors.Primary to CoupleQuestColors.OnPrimary to Alignment.End
    } else {
        CoupleQuestColors.SurfaceContainer to CoupleQuestColors.OnSurface to Alignment.Start
    }

    val showName = message.type == MessageType.SYSTEM || !isCurrentUser

    androidx.compose.foundation.layout.Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isCurrentUser) Arrangement.End else Arrangement.Start
    ) {
        Column(
            horizontalAlignment = alignment,
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            if (showName && message.type != MessageType.SYSTEM) {
                Text(
                    text = if (isCurrentUser) "You" else message.senderName,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = textColor.copy(alpha = 0.7f)
                )
            }

            if (message.type == MessageType.SYSTEM) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .wrapContentWidth()
                        .padding(horizontal = 16.dp),
                    colors = androidx.compose.material3.CardDefaults.cardColors(
                        containerColor = CoupleQuestColors.PrimaryContainer
                    ),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = message.content,
                        fontSize = 12.sp,
                        color = CoupleQuestColors.Primary,
                        fontWeight = FontWeight.Medium,
                        textAlign = androidx.compose.ui.text.TextAlign.Center,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            } else {
                Card(
                    modifier = Modifier
                        .wrapContentSize()
                        .padding(horizontal = 16.dp)
                        .constrainMaxWidth(280.dp),
                    colors = androidx.compose.material3.CardDefaults.cardColors(
                        containerColor = bgColor
                    ),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isCurrentUser) 4.dp else 16.dp,
                        bottomEnd = if (isCurrentUser) 16.dp else 4.dp
                    )
                ) {
                    Text(
                        text = message.content,
                        fontSize = 15.sp,
                        color = textColor,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }

            Text(
                text = timeString,
                fontSize = 10.sp,
                color = CoupleQuestColors.OnSurfaceVariant.copy(alpha = 0.6f),
                modifier = Modifier.padding(horizontal = 16.dp, top = 2.dp)
            )
        }
    }
}

@Composable
fun OnePhoneChatNotice() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.WarningContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        Text(
            text = "📱 Pass-the-phone mode: Hand the phone to your partner to read/reply. Messages are temporary.",
            fontSize = 12.sp,
            color = CoupleQuestColors.OnWarningContainer,
            textAlign = androidx.compose.ui.text.TextAlign.Center,
            modifier = Modifier.padding(12.dp)
        )
    }
}

@Composable
fun TwoPhoneChatNotice() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.SuccessContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        Text(
            text = "🔒 Messages are encrypted and temporary. They disappear when the game ends.",
            fontSize = 12.sp,
            color = CoupleQuestColors.OnSuccessContainer,
            textAlign = androidx.compose.ui.text.TextAlign.Center,
            modifier = Modifier.padding(12.dp)
        )
    }
}

@Composable
fun MessageInput(
    messageText: String,
    onMessageChange: (String) -> Unit,
    onSend: () -> Unit,
    onEmojiClick: () -> Unit,
    onHideMessage: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (onHideMessage) {
                androidx.compose.foundation.layout.Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Button(
                        onClick = onHideMessage,
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                            containerColor = CoupleQuestColors.ErrorContainer,
                            contentColor = CoupleQuestColors.OnErrorContainer
                        ),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp)
                    ) {
                        Text(
                            text = "🙈 Hide Messages (Pass Phone)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onEmojiClick) {
                    Icon(
                        imageVector = Icons.Default.EmojiEmotions,
                        contentDescription = "Emojis",
                        tint = CoupleQuestColors.Primary
                    )
                }

                TextField(
                    value = messageText,
                    onValueChange = onMessageChange,
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    singleLine = true,
                    placeholder = { Text("Type a message...") },
                    colors = TextFieldDefaults.textFieldColors(
                        containerColor = CoupleQuestColors.Surface,
                        focusedContainerColor = CoupleQuestColors.Surface,
                        unfocusedContainerColor = CoupleQuestColors.Surface
                    ),
                    keyboardActions = androidx.compose.ui.text.input.KeyboardActions(
                        onDone = { onSend() }
                    )
                )

                IconButton(onClick = onSend, enabled = messageText.isNotBlank()) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = "Send",
                        tint = if (messageText.isNotBlank()) CoupleQuestColors.Primary else CoupleQuestColors.Outline
                    )
                }
            }
        }
    }
}

@Composable
fun ClearChatConfirmation(
    onConfirm: () -> Unit,
    onCancel: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.5f))
                .clickable { onCancel() }
        )

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = null,
                    tint = CoupleQuestColors.Error,
                    modifier = Modifier.size(48.dp)
                )

                Text(
                    text = "Clear Chat?",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Medium,
                    color = CoupleQuestColors.OnSurface
                )

                Text(
                    text = "This will permanently delete all messages in this chat. They cannot be recovered.",
                    fontSize = 14.sp,
                    color = CoupleQuestColors.OnSurfaceVariant,
                    textAlign = androidx.compose.ui.text.TextAlign.Center
                )

                androidx.compose.foundation.layout.Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = onCancel,
                        modifier = Modifier.weight(1f),
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                            containerColor = CoupleQuestColors.SurfaceContainer,
                            contentColor = CoupleQuestColors.OnSurface
                        ),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "Cancel",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(vertical = 12.dp)
                        )
                    }

                    Button(
                        onClick = onConfirm,
                        modifier = Modifier.weight(1f),
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                            containerColor = CoupleQuestColors.Error,
                            contentColor = CoupleQuestColors.OnError
                        ),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "Clear Chat",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(vertical = 12.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ChatScreenPreview() {
    CoupleQuestTheme {
        val chatState = com.couplequest.game.engine.ChatManager.ChatState(
            messages = listOf(
                com.couplequest.data.model.ChatMessage(
                    roomId = "room1",
                    senderId = "1",
                    senderName = "Alex",
                    content = "Hey! Ready to play?",
                    type = com.couplequest.data.model.MessageType.TEXT,
                    timestamp = System.currentTimeMillis() - 60000
                ),
                com.couplequest.data.model.ChatMessage(
                    roomId = "room1",
                    senderId = "2",
                    senderName = "Jordan",
                    content = "Absolutely! Let's do this 😊",
                    type = com.couplequest.data.model.MessageType.TEXT,
                    timestamp = System.currentTimeMillis() - 30000
                )
            )
        )

        ChatScreen(
            chatState = chatState,
            currentUserId = "1",
            currentUserName = "Alex",
            partnerName = "Jordan",
            onSendMessage = {},
            onCloseChat = {},
            onClearChat = {}
        )
    }
}