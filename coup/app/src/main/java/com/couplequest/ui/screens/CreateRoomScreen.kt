package com.couplequest.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.couplequest.data.model.ConnectionType
import com.couplequest.data.model.GameRoom
import com.couplequest.ui.theme.CoupleQuestColors
import com.couplequest.ui.theme.CoupleQuestTheme
import com.couplequest.ui.theme.Typography

@Composable
fun CreateRoomScreen(
    gameMode: String,
    connectionType: ConnectionType,
    onRoomCreated: (GameRoom) -> Unit,
    onBack: () -> Unit
) {
    var roomCode by remember { mutableStateOf("") }
    var maxRounds by remember { mutableStateOf(10) }
    var isCreating by remember { mutableStateOf(false) }
    var showCode = true

    LaunchedEffect(Unit) {
        // Generate room code
        roomCode = generateRoomCode()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Create Game Room",
                fontSize = 28.sp,
                fontWeight = FontWeight.Light,
                color = CoupleQuestColors.OnSurface
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
            Text(
                text = "Share this code with your partner",
                fontSize = 16.sp,
                color = CoupleQuestColors.OnSurfaceVariant,
                textAlign = androidx.compose.ui.text.TextAlign.Center
            )
        }

        // Room code display
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp),
            colors = androidx.compose.material3.CardDefaults.cardColors(
                containerColor = CoupleQuestColors.PrimaryContainer
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "ROOM CODE",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = CoupleQuestColors.Primary,
                    letterSpacing = 2.sp
                )
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = roomCode.chunked(3).joinToString(" "),
                        fontSize = 48.sp,
                        fontWeight = FontWeight.Bold,
                        color = CoupleQuestColors.Primary,
                        letterSpacing = 8.sp
                    )
                    IconButton(
                        onClick = { showCode = !showCode },
                        modifier = Modifier.padding(8.dp)
                    ) {
                        Icon(
                            imageVector = if (showCode) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                            contentDescription = if (showCode) "Hide code" else "Show code",
                            tint = CoupleQuestColors.Primary
                        )
                    }
                }
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = {
                            // Copy to clipboard
                            androidx.compose.ui.platform.LocalContext.current
                                .getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                .setPrimaryClip(android.content.ClipData.newPlainText("Room Code", roomCode))
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.ContentCopy,
                            contentDescription = "Copy code",
                            tint = CoupleQuestColors.Primary
                        )
                    }
                    IconButton(
                        onClick = {
                            // Share code
                            val intent = android.content.Intent().apply {
                                action = android.content.Intent.ACTION_SEND
                                putExtra(android.content.Intent.EXTRA_TEXT, "Join my Couple Quest game! Room code: $roomCode")
                                type = "text/plain"
                            }
                            androidx.compose.ui.platform.LocalContext.current.startActivity(intent)
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Share code",
                            tint = CoupleQuestColors.Primary
                        )
                    }
                    IconButton(
                        onClick = {
                            roomCode = generateRoomCode()
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "New code",
                            tint = CoupleQuestColors.Primary
                        )
                    }
                }
            }
        }

        // Settings
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Max rounds
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Rounds",
                    fontSize = 16.sp,
                    color = CoupleQuestColors.OnSurface,
                    modifier = Modifier.weight(1f)
                )
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { if (maxRounds > 1) maxRounds-- },
                        enabled = maxRounds > 1
                    ) {
                        Icon(
                            imageVector = Icons.Default.Remove,
                            contentDescription = "Decrease rounds",
                            tint = CoupleQuestColors.Primary
                        )
                    }
                    Text(
                        text = maxRounds.toString(),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Medium,
                        color = CoupleQuestColors.Primary,
                        modifier = Modifier.width(48.dp).wrapContentWidth(Alignment.CenterHorizontally)
                    )
                    IconButton(
                        onClick = { if (maxRounds < 20) maxRounds++ },
                        enabled = maxRounds < 20
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Increase rounds",
                            tint = CoupleQuestColors.Primary
                        )
                    }
                }
            }

            // Game mode info
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = androidx.compose.material3.CardDefaults.cardColors(
                    containerColor = CoupleQuestColors.SurfaceContainer
                ),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
            ) {
                androidx.compose.foundation.layout.Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.QrCode,
                        contentDescription = null,
                        tint = CoupleQuestColors.Primary,
                        modifier = Modifier.size(24.dp)
                    )
                    Column {
                        Text(
                            text = "Game Mode",
                            fontSize = 12.sp,
                            color = CoupleQuestColors.OnSurfaceVariant
                        )
                        Text(
                            text = gameMode,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = CoupleQuestColors.OnSurface
                        )
                    }
                }
            }
        }

        // Create button
        Button(
            onClick = {
                isCreating = true
                val room = GameRoom(
                    code = roomCode,
                    hostId = "local",
                    gameMode = com.couplequest.data.model.GameMode.valueOf(gameMode),
                    connectionType = connectionType,
                    maxRounds = maxRounds
                )
                onRoomCreated(room)
                isCreating = false
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isCreating,
            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                containerColor = CoupleQuestColors.Primary,
                contentColor = CoupleQuestColors.OnPrimary
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
        ) {
            if (isCreating) {
                androidx.compose.material.icons.filled.CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = CoupleQuestColors.OnPrimary
                )
            } else {
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Create Room",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium
                    )
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = null,
                        tint = CoupleQuestColors.OnPrimary
                    )
                }
            }
        }

        // Back button
        Text(
            text = "Back",
            fontSize = 16.sp,
            color = CoupleQuestColors.Primary,
            fontWeight = FontWeight.Medium,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
                .wrapContentWidth(Alignment.CenterHorizontally)
                .clickable { onBack() }
        )
    }
}

private fun generateRoomCode(): String {
    val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return (1..6).map { chars.random() }.joinToString("")
}

@Composable
fun CreateRoomScreenPreview() {
    CoupleQuestTheme {
        CreateRoomScreen(
            gameMode = "Truth or Dare",
            connectionType = com.couplequest.data.model.ConnectionType.SAME_WIFI,
            onRoomCreated = {},
            onBack = {}
        )
    }
}