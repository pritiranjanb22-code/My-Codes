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
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.History
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
import com.couplequest.data.model.GameSession
import com.couplequest.data.model.GameStats
import com.couplequest.ui.theme.CoupleQuestColors
import com.couplequest.ui.theme.CoupleQuestTheme
import com.couplequest.ui.theme.Typography
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun GameHistoryScreen(
    sessions: List<GameSession>,
    stats: GameStats,
    onSessionClick: (GameSession) -> Unit,
    onClearHistory: () -> Unit
) {
    var selectedSession by remember { mutableStateOf<GameSession?>(null) }
    var showClearConfirmation by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        // Stats header
        StatsHeader(stats = stats)

        // Sessions list
        if (sessions.isEmpty()) {
            EmptyHistoryState(onClearHistory = { showClearConfirmation = true })
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 8.dp)
            ) {
                items(sessions) { session ->
                    SessionCard(
                        session = session,
                        onClick = { onSessionClick(session) }
                    )
                }
            }
        }

        // Clear history button
        if (sessions.isNotEmpty()) {
            Button(
                onClick = { showClearConfirmation = true },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                    containerColor = CoupleQuestColors.ErrorContainer,
                    contentColor = CoupleQuestColors.OnErrorContainer
                ),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
            ) {
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = null,
                        tint = CoupleQuestColors.Error
                    )
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
                    Text(
                        text = "Clear All History",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Clear confirmation dialog
        if (showClearConfirmation) {
            ClearHistoryConfirmation(
                onConfirm = {
                    onClearHistory()
                    showClearConfirmation = false
                },
                onCancel = { showClearConfirmation = false }
            )
        }
    }
}

@Composable
fun StatsHeader(stats: GameStats) {
    val dateFormat = SimpleDateFormat("MMM d, yyyy", Locale.getDefault())

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.PrimaryContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Your Journey Together",
                fontSize = 20.sp,
                fontWeight = FontWeight.Light,
                color = CoupleQuestColors.Primary
            )

            // Main stats grid
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    label = "Games Played",
                    value = stats.totalSessions.toString(),
                    icon = Icons.Default.History,
                    color = CoupleQuestColors.Primary
                )
                StatCard(
                    label = "Rounds",
                    value = stats.totalRounds.toString(),
                    icon = Icons.Default.Refresh,
                    color = CoupleQuestColors.Secondary
                )
                StatCard(
                    label = "Completed",
                    value = stats.totalChallengesCompleted.toString(),
                    icon = Icons.Default.CheckCircle,
                    color = CoupleQuestColors.Success
                )
            }

            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    label = "Skipped",
                    value = stats.totalChallengesSkipped.toString(),
                    icon = Icons.Default.SkipNext,
                    color = CoupleQuestColors.Warning
                )
                StatCard(
                    label = "Favorite",
                    value = stats.favoriteGameMode?.name?.replace("_", " ") ?: "—",
                    icon = Icons.Default.Favorite,
                    color = CoupleQuestColors.Tertiary
                )
                StatCard(
                    label = "Longest",
                    value = "${stats.longestSessionMinutes} min",
                    icon = Icons.Default.Timer,
                    color = Color(0xFF9C27B0)
                )
            }

            stats.lastPlayedAt?.let { lastPlayed ->
                Text(
                    text = "Last played: ${dateFormat.format(Date(lastPlayed))}",
                    fontSize = 12.sp,
                    color = CoupleQuestColors.OnPrimaryContainer.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@Composable
fun StatCard(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color
) {
    Card(
        modifier = Modifier
            .weight(1f)
            .fillMaxWidth(),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.15f)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(24.dp)
            )
            Text(
                text = value,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = label,
                fontSize = 11.sp,
                color = CoupleQuestColors.OnSurfaceVariant,
                textAlign = androidx.compose.ui.text.TextAlign.Center
            )
        }
    }
}

@Composable
fun SessionCard(
    session: GameSession,
    onClick: () -> Unit
) {
    val dateFormat = SimpleDateFormat("MMM d, yyyy • HH:mm", Locale.getDefault())
    val durationFormat = SimpleDateFormat("mm:ss", Locale.getDefault())

    val gameModeColors = mapOf(
        com.couplequest.data.model.GameMode.TRUTH_OR_DARE to CoupleQuestColors.Primary,
        com.couplequest.data.model.GameMode.INTIMATE_POSITIONS to CoupleQuestColors.Tertiary,
        com.couplequest.data.model.GameMode.ROMANTIC_CHALLENGES to CoupleQuestColors.Secondary,
        com.couplequest.data.model.GameMode.COUPLE_QUESTIONS to Color(0xFF00BCD4)
    )

    val modeColor = gameModeColors[session.gameMode] ?: CoupleQuestColors.Primary

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Mode icon
            Box(
                modifier = Modifier.size(56.dp),
                contentAlignment = Alignment.Center
            ) {
                androidx.compose.foundation.Canvas(modifier = Modifier.size(56.dp)) {
                    drawCircle(modeColor.copy(alpha = 0.2f), 28f, 28f, 28f)
                    // Draw mode-specific icon
                    when (session.gameMode) {
                        com.couplequest.data.model.GameMode.TRUTH_OR_DARE -> drawChatIcon(modeColor)
                        com.couplequest.data.model.GameMode.INTIMATE_POSITIONS -> drawHeartIcon(modeColor)
                        com.couplequest.data.model.GameMode.ROMANTIC_CHALLENGES -> drawRoseIcon(modeColor)
                        com.couplequest.data.model.GameMode.COUPLE_QUESTIONS -> drawQuestionIcon(modeColor)
                    }
                }
            }

            // Session info
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = session.gameMode.name.replace("_", " "),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = CoupleQuestColors.OnSurface
                    )
                    androidx.compose.material3.Badge(
                        backgroundColor = modeColor,
                        contentColor = CoupleQuestColors.OnPrimary
                    ) {
                        Text(
                            text = session.connectionType.name.replace("_", " "),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Text(
                    text = "${session.player1Name} & ${session.player2Name}",
                    fontSize = 13.sp,
                    color = CoupleQuestColors.OnSurfaceVariant
                )

                Text(
                    text = dateFormat.format(Date(session.startedAt)),
                    fontSize = 11.sp,
                    color = CoupleQuestColors.OnSurfaceVariant.copy(alpha = 0.7f)
                )
            }

            // Stats
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "${session.roundsPlayed} rounds",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = modeColor
                )

                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    StatBadge(
                        label = "✓ ${session.challengesCompleted}",
                        color = CoupleQuestColors.Success
                    )
                    StatBadge(
                        label = "⊘ ${session.challengesSkipped}",
                        color = CoupleQuestColors.Warning
                    )
                }

                Text(
                    text = "${session.durationMinutes} min",
                    fontSize = 12.sp,
                    color = CoupleQuestColors.OnSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun StatBadge(label: String, color: Color) {
    Card(
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.15f)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp)
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = color,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun EmptyHistoryState(onClearHistory: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            androidx.compose.foundation.Canvas(modifier = Modifier.size(120.dp)) {
                val path = androidx.compose.ui.graphics.Path()
                path.moveTo(60f, 20f)
                path.cubicTo(60f, 5f, 75f, 0f, 90f, 0f)
                path.cubicTo(105f, 0f, 120f, 15f, 120f, 30f)
                path.cubicTo(120f, 45f, 105f, 60f, 90f, 60f)
                path.cubicTo(75f, 60f, 60f, 45f, 60f, 30f)
                path.moveTo(60f, 30f)
                path.cubicTo(60f, 45f, 45f, 60f, 30f, 60f)
                path.cubicTo(15f, 60f, 0f, 45f, 0f, 30f)
                path.cubicTo(0f, 15f, 15f, 0f, 30f, 0f)
                path.cubicTo(45f, 0f, 60f, 15f, 60f, 30f)
                path.close()
                drawPath(path, CoupleQuestColors.Outline.copy(alpha = 0.3f))
            }

            Text(
                text = "No Games Yet",
                fontSize = 24.sp,
                fontWeight = FontWeight.Light,
                color = CoupleQuestColors.OnSurface
            )

            Text(
                text = "Play your first game to see your journey here",
                fontSize = 16.sp,
                color = CoupleQuestColors.OnSurfaceVariant,
                textAlign = androidx.compose.ui.text.TextAlign.Center
            )
        }
    }
}

@Composable
fun ClearHistoryConfirmation(
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
                    text = "Clear All History?",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Medium,
                    color = CoupleQuestColors.OnSurface
                )

                Text(
                    text = "This will permanently delete all your game sessions and stats. This action cannot be undone.",
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
                            text = "Clear All",
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

// Icon drawing functions
private fun androidx.compose.ui.graphics.DrawScope.drawChatIcon(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(14f, 10f)
    path.lineTo(14f, 28f)
    path.lineTo(42f, 28f)
    path.lineTo(42f, 10f)
    path.close()
    drawPath(path, color, style = androidx.compose.ui.graphics.Stroke(3f))
    
    val bubble = androidx.compose.ui.graphics.Path()
    bubble.moveTo(20f, 14f)
    bubble.lineTo(20f, 24f)
    bubble.lineTo(36f, 24f)
    bubble.lineTo(36f, 14f)
    bubble.close()
    drawPath(bubble, color, style = androidx.compose.ui.graphics.Stroke(2f))
}

private fun androidx.compose.ui.graphics.DrawScope.drawHeartIcon(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(28f, 14f)
    path.cubicTo(28f, 7f, 35f, 2f, 42f, 2f)
    path.cubicTo(49f, 2f, 56f, 7f, 56f, 14f)
    path.cubicTo(56f, 21f, 42f, 35f, 28f, 35f)
    path.cubicTo(14f, 35f, 0f, 21f, 0f, 14f)
    path.cubicTo(0f, 7f, 7f, 2f, 14f, 2f)
    path.cubicTo(21f, 2f, 28f, 7f, 28f, 14f)
    path.close()
    drawPath(path, color)
}

private fun androidx.compose.ui.graphics.DrawScope.drawRoseIcon(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(28f, 8f)
    path.cubicTo(28f, 8f, 20f, 0f, 12f, 8f)
    path.cubicTo(4f, 16f, 12f, 24f, 28f, 24f)
    path.cubicTo(44f, 24f, 52f, 16f, 44f, 8f)
    path.cubicTo(36f, 0f, 28f, 8f, 28f, 8f)
    path.close()
    drawPath(path, color)
}

private fun androidx.compose.ui.graphics.DrawScope.drawQuestionIcon(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(28f, 8f)
    path.cubicTo(28f, 8f, 20f, 8f, 16f, 14f)
    path.cubicTo(12f, 20f, 16f, 28f, 28f, 28f)
    path.cubicTo(40f, 28f, 44f, 20f, 40f, 14f)
    path.cubicTo(36f, 8f, 28f, 8f, 28f, 8f)
    path.close()
    drawPath(path, color, style = androidx.compose.ui.graphics.Stroke(3f))
    
    drawCircle(color, 28f, 36f, 3f)
}

@Composable
fun GameHistoryScreenPreview() {
    CoupleQuestTheme {
        val sessions = listOf(
            com.couplequest.data.model.GameSession(
                id = "1",
                roomId = "room1",
                player1Id = "1",
                player2Id = "2",
                player1Name = "Alex",
                player2Name = "Jordan",
                gameMode = com.couplequest.data.model.GameMode.TRUTH_OR_DARE,
                connectionType = com.couplequest.data.model.ConnectionType.ONE_PHONE,
                roundsPlayed = 5,
                challengesCompleted = 8,
                challengesSkipped = 2,
                startedAt = System.currentTimeMillis() - 86400000,
                endedAt = System.currentTimeMillis() - 86400000 + 1800000,
                durationMinutes = 30
            )
        )
        val stats = com.couplequest.data.model.GameStats(
            totalSessions = 1,
            totalRounds = 5,
            totalChallengesCompleted = 8,
            totalChallengesSkipped = 2,
            favoriteGameMode = com.couplequest.data.model.GameMode.TRUTH_OR_DARE,
            longestSessionMinutes = 30,
            lastPlayedAt = System.currentTimeMillis() - 86400000
        )

        GameHistoryScreen(
            sessions = sessions,
            stats = stats,
            onSessionClick = {},
            onClearHistory = {}
        )
    }
}