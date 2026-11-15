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
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Wifi
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
import com.couplequest.data.model.ConnectionType
import com.couplequest.data.model.GameRoom
import com.couplequest.ui.theme.CoupleQuestColors
import com.couplequest.ui.theme.CoupleQuestTheme
import com.couplequest.ui.theme.Typography

@Composable
fun JoinRoomScreen(
    connectionType: ConnectionType,
    onRoomJoined: (GameRoom) -> Unit,
    onBack: () -> Unit
) {
    var roomCode by remember { mutableStateOf("") }
    var isJoining by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showManualEntry by remember { mutableStateOf(true) }

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
                text = "Join Game Room",
                fontSize = 28.sp,
                fontWeight = FontWeight.Light,
                color = CoupleQuestColors.OnSurface
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
            Text(
                text = "Enter the room code from your partner",
                fontSize = 16.sp,
                color = CoupleQuestColors.OnSurfaceVariant,
                textAlign = androidx.compose.ui.text.TextAlign.Center
            )
        }

        // Error message
        errorMessage?.let { error ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = androidx.compose.material3.CardDefaults.cardColors(
                    containerColor = CoupleQuestColors.ErrorContainer
                ),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = error,
                    fontSize = 14.sp,
                    color = CoupleQuestColors.OnErrorContainer,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }

        // Manual entry
        if (showManualEntry) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                TextField(
                    value = roomCode,
                    onValueChange = { roomCode = it.uppercase() },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Enter 6-character code") },
                    keyboardOptions = androidx.compose.ui.text.input.KeyboardOptions(
                        capitalization = androidx.compose.ui.text.input.KeyboardCapitalization.Characters
                    ),
                    colors = TextFieldDefaults.textFieldColors(
                        containerColor = CoupleQuestColors.SurfaceContainer,
                        focusedContainerColor = CoupleQuestColors.SurfaceContainer,
                        unfocusedContainerColor = CoupleQuestColors.SurfaceContainer
                    )
                )

                // Quick entry buttons
                androidx.compose.foundation.layout.Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("A", "B", "C", "D", "E", "F", "G", "H").forEach { char ->
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth()
                                .clickable { roomCode += char },
                            colors = androidx.compose.material3.CardDefaults.cardColors(
                                containerColor = CoupleQuestColors.SurfaceContainer
                            ),
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = char,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Medium,
                                color = CoupleQuestColors.OnSurface,
                                textAlign = androidx.compose.ui.text.TextAlign.Center,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 16.dp)
                            )
                        }
                    }
                }
            }
        }

        // Quick actions
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (connectionType == ConnectionType.SAME_WIFI) {
                Button(
                    onClick = {
                        // Start discovery
                        errorMessage = "Searching for rooms on Wi-Fi..."
                        // In real implementation, start network discovery
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isJoining,
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = CoupleQuestColors.SecondaryContainer,
                        contentColor = CoupleQuestColors.Secondary
                    ),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
                ) {
                    androidx.compose.foundation.layout.Row(
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Wifi,
                            contentDescription = null,
                            tint = CoupleQuestColors.Secondary
                        )
                        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
                        Text(
                            text = "Find Room on Wi-Fi",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = CoupleQuestColors.Secondary
                        )
                    }
                }
            }

            if (connectionType == ConnectionType.BLUETOOTH) {
                Button(
                    onClick = {
                        // Start Bluetooth discovery
                        errorMessage = "Searching for Bluetooth devices..."
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isJoining,
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = CoupleQuestColors.TertiaryContainer,
                        contentColor = CoupleQuestColors.Tertiary
                    ),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
                ) {
                    androidx.compose.foundation.layout.Row(
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bluetooth,
                            contentDescription = null,
                            tint = CoupleQuestColors.Tertiary
                        )
                        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
                        Text(
                            text = "Find Room via Bluetooth",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = CoupleQuestColors.Tertiary
                        )
                    }
                }
            }

            Button(
                onClick = {
                    showManualEntry = true
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isJoining && !showManualEntry,
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                    containerColor = CoupleQuestColors.SurfaceContainer,
                    contentColor = CoupleQuestColors.OnSurface
                ),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
            ) {
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Keyboard,
                        contentDescription = null,
                        tint = CoupleQuestColors.OnSurface
                    )
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
                    Text(
                        text = "Enter Code Manually",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Join button
        Button(
            onClick = {
                if (roomCode.length == 6) {
                    isJoining = true
                    errorMessage = null
                    val room = GameRoom(
                        code = roomCode,
                        hostId = "remote",
                        connectionType = connectionType
                    )
                    onRoomJoined(room)
                    isJoining = false
                } else {
                    errorMessage = "Please enter a valid 6-character room code"
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isJoining && roomCode.length == 6,
            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                containerColor = CoupleQuestColors.Primary,
                contentColor = CoupleQuestColors.OnPrimary,
                disabledContainerColor = CoupleQuestColors.OutlineVariant
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
        ) {
            if (isJoining) {
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
                        text = "Join Room",
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

@Composable
fun JoinRoomScreenPreview() {
    CoupleQuestTheme {
        JoinRoomScreen(
            connectionType = com.couplequest.data.model.ConnectionType.SAME_WIFI,
            onRoomJoined = {},
            onBack = {}
        )
    }
}