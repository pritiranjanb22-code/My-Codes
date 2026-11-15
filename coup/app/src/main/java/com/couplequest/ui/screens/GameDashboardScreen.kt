package com.couplequest.ui.screens

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SkipNext
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
import com.couplequest.data.model.Challenge
import com.couplequest.data.model.ChallengeCard
import com.couplequest.data.model.GameRoom
import com.couplequest.data.model.Player
import com.couplequest.game.engine.TurnManager
import com.couplequest.ui.theme.CoupleQuestColors
import com.couplequest.ui.theme.CoupleQuestTheme
import com.couplequest.ui.theme.Typography

@Composable
fun GameDashboardScreen(
    gameState: TurnManager.GameState,
    onRevealChallenge: () -> Unit,
    onCompleteChallenge: () -> Unit,
    onSkipChallenge: () -> Unit,
    onRerollChallenge: () -> Unit,
    onHideChallenge: () -> Unit,
    onOpenChat: () -> Unit,
    onEndGame: () -> Unit
) {
    val currentChallenge = gameState.currentChallenge
    val isPlayer1Turn = gameState.isPlayer1Turn
    val player1 = gameState.player1
    val player2 = gameState.player2

    var showCard by remember { mutableStateOf(true) }
    val cardScale by animateFloatAsState(
        targetValue = if (showCard && currentChallenge != null) 1f else 0.9f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumStiff, stiffness = Spring.StiffnessLow)
    )
    val cardAlpha by animateFloatAsState(
        targetValue = if (showCard && currentChallenge != null) 1f else 0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumStiff, stiffness = Spring.StiffnessLow)
    )

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Top bar with game info
        TopGameBar(
            room = gameState.room!!,
            player1 = player1!!,
            player2 = player2!!,
            currentTurn = gameState.currentTurnPlayerId,
            roundNumber = gameState.roundNumber,
            maxRounds = gameState.maxRounds,
            onChatClick = onOpenChat,
            onEndGame = onEndGame
        )

        // Turn indicator
        TurnIndicator(
            currentPlayerId = gameState.currentTurnPlayerId,
            player1 = player1!!,
            player2 = player2!!,
            isPlayer1Turn = isPlayer1Turn
        )

        // Challenge card area
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            if (currentChallenge != null) {
                ChallengeCardView(
                    challengeCard = currentChallenge,
                    isCurrentPlayerTurn = (isPlayer1Turn && currentChallenge.revealedBy == player1?.id) ||
                                        (!isPlayer1Turn && currentChallenge.revealedBy == player2?.id),
                    onComplete = onCompleteChallenge,
                    onSkip = onSkipChallenge,
                    onReroll = onRerollChallenge,
                    onHide = onHideChallenge,
                    scale = cardScale,
                    alpha = cardAlpha
                )
            } else {
                // No challenge revealed yet
                RevealPromptView(
                    currentPlayerName = if (isPlayer1Turn) player1?.name ?: "Player 1" else player2?.name ?: "Player 2",
                    onReveal = onRevealChallenge
                )
            }
        }

        // Progress indicator
        ProgressIndicator(
            currentRound = gameState.roundNumber,
            maxRounds = gameState.maxRounds,
            completedChallenges = gameState.completedChallenges.size,
            skippedChallenges = gameState.skippedChallenges.size
        )
    }
}

@Composable
fun TopGameBar(
    room: GameRoom,
    player1: Player,
    player2: Player,
    currentTurn: String,
    roundNumber: Int,
    maxRounds: Int,
    onChatClick: () -> Unit,
    onEndGame: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Round info
            Column {
                Text(
                    text = "Round $roundNumber of $maxRounds",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = CoupleQuestColors.OnSurface
                )
                Text(
                    text = room.gameMode.name.replace("_", " "),
                    fontSize = 12.sp,
                    color = CoupleQuestColors.OnSurfaceVariant
                )
            }

            // Connection status
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(CoupleQuestColors.Success, shape = androidx.compose.foundation.shape.CircleShape)
            )

            // Chat button
            IconButton(onClick = onChatClick) {
                Icon(
                    imageVector = Icons.Default.ChatBubbleOutline,
                    contentDescription = "Open chat",
                    tint = CoupleQuestColors.Primary
                )
            }

            // End game button
            IconButton(onClick = onEndGame) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "End game",
                    tint = CoupleQuestColors.Error
                )
            }
        }
    }
}

@Composable
fun TurnIndicator(
    currentPlayerId: String,
    player1: Player,
    player2: Player,
    isPlayer1Turn: Boolean
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = if (isPlayer1Turn) CoupleQuestColors.PrimaryContainer else CoupleQuestColors.TertiaryContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Current player avatar
            Box(
                modifier = Modifier.size(48.dp),
                contentAlignment = Alignment.Center
            ) {
                androidx.compose.foundation.Canvas(modifier = Modifier.size(48.dp)) {
                    val color = if (isPlayer1Turn) CoupleQuestColors.Primary else CoupleQuestColors.Tertiary
                    drawCircle(color.copy(alpha = 0.2f), 24f, 24f, 24f)
                    drawCircle(color, 24f, 24f, 20f, style = androidx.compose.ui.graphics.Stroke(3f))
                    
                    val initial = if (isPlayer1Turn) player1.name.firstOrNull() ?: "1" else player2.name.firstOrNull() ?: "2"
                    drawText(
                        textMeasurer = androidx.compose.ui.text.TextMeasurer(),
                        text = androidx.compose.ui.text.AnnotatedString(initial.toString().uppercase()),
                        topLeft = androidx.compose.ui.graphics.Point(18f, 12f),
                        color = color
                    )
                }
            }

            Column {
                Text(
                    text = "Current Turn",
                    fontSize = 12.sp,
                    color = if (isPlayer1Turn) CoupleQuestColors.Primary else CoupleQuestColors.Tertiary
                )
                Text(
                    text = if (isPlayer1Turn) player1.name else player2.name,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = CoupleQuestColors.OnSurface
                )
            }
        }
    }
}

@Composable
fun ChallengeCardView(
    challengeCard: ChallengeCard,
    isCurrentPlayerTurn: Boolean,
    onComplete: () -> Unit,
    onSkip: () -> Unit,
    onReroll: () -> Unit,
    onHide: () -> Unit,
    scale: Float,
    alpha: Float
) {
    val challenge = challengeCard.challenge
    val categoryColor = getCategoryColor(challenge.category)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
                this.alpha = alpha
            },
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.Surface
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp),
        elevation = androidx.compose.material3.CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Category badge
            androidx.compose.material3.Chip(
                onClick = { },
                colors = androidx.compose.material3.ChipDefaults.chipColors(
                    containerColor = categoryColor.copy(alpha = 0.15f),
                    contentColor = categoryColor
                ),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = challenge.category.name.replace("_", " "),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            // Challenge title
            Text(
                text = challenge.title,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = CoupleQuestColors.OnSurface,
                textAlign = androidx.compose.ui.text.TextAlign.Center
            )

            // Challenge description
            Text(
                text = challenge.description,
                fontSize = 16.sp,
                color = CoupleQuestColors.OnSurfaceVariant,
                textAlign = androidx.compose.ui.text.TextAlign.Center,
                lineHeight = 24.sp
            )

            // Difficulty and timer
            if (challenge.difficulty != null || challenge.timerSeconds != null) {
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (challenge.difficulty != null) {
                        DifficultyBadge(difficulty = challenge.difficulty!!)
                    }
                    if (challenge.timerSeconds != null) {
                        TimerBadge(seconds = challenge.timerSeconds!!)
                    }
                }
            }

            // Tips
            challenge.tips?.let { tips ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = androidx.compose.material3.CardDefaults.cardColors(
                        containerColor = CoupleQuestColors.SecondaryContainer
                    ),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "💡 $tips",
                        fontSize = 13.sp,
                        color = CoupleQuestColors.OnSecondaryContainer,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }

            // Adult content warning
            if (challenge.isAdultContent) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = androidx.compose.material3.CardDefaults.cardColors(
                        containerColor = CoupleQuestColors.WarningContainer
                    ),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "⚠️ Adult content - Both partners must consent. Skip anytime.",
                        fontSize = 12.sp,
                        color = CoupleQuestColors.OnWarningContainer,
                        textAlign = androidx.compose.ui.text.TextAlign.Center,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }

            // Action buttons
            if (isCurrentPlayerTurn && !challengeCard.isCompleted && !challengeCard.isSkipped) {
                ActionButtons(
                    onComplete = onComplete,
                    onSkip = onSkip,
                    onReroll = onReroll,
                    onHide = onHide
                )
            } else if (challengeCard.isCompleted) {
                CompletedBadge()
            } else if (challengeCard.isSkipped) {
                SkippedBadge()
            } else {
                WaitingBadge()
            }
        }
    }
}

@Composable
fun RevealPromptView(
    currentPlayerName: String,
    onReveal: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .height(300.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
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
                drawPath(path, CoupleQuestColors.Primary.copy(alpha = 0.3f))
                drawPath(path, CoupleQuestColors.Primary, style = androidx.compose.ui.graphics.Stroke(4f))
            }

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(24.dp))

            Text(
                text = "$currentPlayerName's Turn",
                fontSize = 20.sp,
                fontWeight = FontWeight.Medium,
                color = CoupleQuestColors.OnSurface
            )

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))

            Text(
                text = "Tap to reveal your challenge",
                fontSize = 16.sp,
                color = CoupleQuestColors.OnSurfaceVariant
            )

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(32.dp))

            Button(
                onClick = onReveal,
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                    containerColor = CoupleQuestColors.Primary,
                    contentColor = CoupleQuestColors.OnPrimary
                ),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
            ) {
                Text(
                    text = "Reveal My Challenge",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(horizontal = 32.dp, vertical = 16.dp)
                )
            }
        }
    }
}

@Composable
fun ActionButtons(
    onComplete: () -> Unit,
    onSkip: () -> Unit,
    onReroll: () -> Unit,
    onHide: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = onComplete,
                modifier = Modifier.weight(1f),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                    containerColor = CoupleQuestColors.Success,
                    contentColor = CoupleQuestColors.OnSuccess
                ),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = "Completed",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(vertical = 12.dp)
                )
            }

            Button(
                onClick = onSkip,
                modifier = Modifier.weight(1f),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                    containerColor = CoupleQuestColors.Warning,
                    contentColor = CoupleQuestColors.OnWarning
                ),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = "Skip",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(vertical = 12.dp)
                )
            }
        }

        androidx.compose.foundation.layout.Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            androidx.compose.material3.OutlinedButton(
                onClick = onReroll,
                modifier = Modifier.weight(1f),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                    contentColor = CoupleQuestColors.Primary,
                    outlinedBorderColor = CoupleQuestColors.Primary
                )
            ) {
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = null,
                        tint = CoupleQuestColors.Primary,
                        modifier = Modifier.size(18.dp)
                    )
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(4.dp))
                    Text(
                        text = "Reroll",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            androidx.compose.material3.OutlinedButton(
                onClick = onHide,
                modifier = Modifier.weight(1f),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                    contentColor = CoupleQuestColors.OnSurfaceVariant,
                    outlinedBorderColor = CoupleQuestColors.Outline
                )
            ) {
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.VisibilityOff,
                        contentDescription = null,
                        tint = CoupleQuestColors.OnSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(4.dp))
                    Text(
                        text = "Hide",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
fun DifficultyBadge(difficulty: com.couplequest.data.model.Difficulty) {
    val (label, color) = when (difficulty) {
        com.couplequest.data.model.Difficulty.EASY -> "Easy" to CoupleQuestColors.Success
        com.couplequest.data.model.Difficulty.MEDIUM -> "Medium" to CoupleQuestColors.Warning
        com.couplequest.data.model.Difficulty.HARD -> "Hard" to CoupleQuestColors.Error
        com.couplequest.data.model.Difficulty.EXPERT -> "Expert" to CoupleQuestColors.Tertiary
    }

    androidx.compose.material3.Chip(
        onClick = { },
        colors = androidx.compose.material3.ChipDefaults.chipColors(
            containerColor = color.copy(alpha = 0.15f),
            contentColor = color
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun TimerBadge(seconds: Int) {
    val minutes = seconds / 60
    val secs = seconds % 60
    val timeString = if (minutes > 0) "${minutes}m ${secs}s" else "${secs}s"

    androidx.compose.material3.Chip(
        onClick = { },
        colors = androidx.compose.material3.ChipDefaults.chipColors(
            containerColor = CoupleQuestColors.PrimaryContainer,
            contentColor = CoupleQuestColors.Primary
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        androidx.compose.foundation.layout.Row(
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Timer,
                contentDescription = null,
                tint = CoupleQuestColors.Primary,
                modifier = Modifier.size(16.dp)
            )
            Text(
                text = timeString,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun CompletedBadge() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.SuccessContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = CoupleQuestColors.Success
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
            Text(
                text = "Challenge Completed! 🎉",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = CoupleQuestColors.Success
            )
        }
    }
}

@Composable
fun SkippedBadge() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.WarningContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.SkipNext,
                contentDescription = null,
                tint = CoupleQuestColors.Warning
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
            Text(
                text = "Challenge Skipped",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = CoupleQuestColors.Warning
            )
        }
    }
}

@Composable
fun WaitingBadge() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        Text(
            text = "Waiting for partner...",
            fontSize = 16.sp,
            color = CoupleQuestColors.OnSurfaceVariant,
            textAlign = androidx.compose.ui.text.TextAlign.Center,
            modifier = Modifier.padding(16.dp)
        )
    }
}

@Composable
fun ProgressIndicator(
    currentRound: Int,
    maxRounds: Int,
    completedChallenges: Int,
    skippedChallenges: Int
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Round progress
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Progress",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = CoupleQuestColors.OnSurface
                )
                Text(
                    text = "$currentRound / $maxRounds rounds",
                    fontSize = 14.sp,
                    color = CoupleQuestColors.Primary
                )
            }

            androidx.compose.material.ProgressIndicator(
                modifier = Modifier.fillMaxWidth(),
                progress = currentRound.toFloat() / maxRounds,
                color = CoupleQuestColors.Primary,
                trackColor = CoupleQuestColors.PrimaryContainer
            )

            // Stats
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                StatItem(
                    label = "Completed",
                    value = completedChallenges.toString(),
                    color = CoupleQuestColors.Success
                )
                StatItem(
                    label = "Skipped",
                    value = skippedChallenges.toString(),
                    color = CoupleQuestColors.Warning
                )
            }
        }
    }
}

@Composable
fun StatItem(label: String, value: String, color: Color) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(
            text = value,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
        Text(
            text = label,
            fontSize = 12.sp,
            color = CoupleQuestColors.OnSurfaceVariant
        )
    }
}

private fun getCategoryColor(category: com.couplequest.data.model.ChallengeCategory): Color {
    return when (category) {
        com.couplequest.data.model.ChallengeCategory.ROMANTIC -> CoupleQuestColors.Primary
        com.couplequest.data.model.ChallengeCategory.FUNNY -> CoupleQuestColors.Secondary
        com.couplequest.data.model.ChallengeCategory.RELATIONSHIP -> CoupleQuestColors.Tertiary
        com.couplequest.data.model.ChallengeCategory.DEEP_QUESTIONS -> Color(0xFF673AB7)
        com.couplequest.data.model.ChallengeCategory.PLAYFUL -> Color(0xFF00BCD4)
        com.couplequest.data.model.ChallengeCategory.ADULT_INTIMACY -> CoupleQuestColors.Primary
        com.couplequest.data.model.ChallengeCategory.GENTLE -> Color(0xFF8BC34A)
        com.couplequest.data.model.ChallengeCategory.SEATED -> Color(0xFF3F51B5)
        com.couplequest.data.model.ChallengeCategory.STANDING -> Color(0xFFFF5722)
        com.couplequest.data.model.ChallengeCategory.SIDE_BY_SIDE -> Color(0xFF009688)
        com.couplequest.data.model.ChallengeCategory.BEGINNER_FRIENDLY -> Color(0xFF4CAF50)
        com.couplequest.data.model.ChallengeCategory.COUPLES_CHOICE -> CoupleQuestColors.Tertiary
        else -> CoupleQuestColors.Primary
    }
}

@Composable
fun GameDashboardScreenPreview() {
    CoupleQuestTheme {
        val player1 = com.couplequest.data.model.Player(
            id = "1",
            name = "Alex",
            avatarId = "heart",
            isPlayer1 = true
        )
        val player2 = com.couplequest.data.model.Player(
            id = "2",
            name = "Jordan",
            avatarId = "star",
            isPlayer1 = false
        )
        val room = com.couplequest.data.model.GameRoom(
            id = "room1",
            code = "ABC123",
            hostId = "1",
            player1Id = "1",
            player2Id = "2",
            player1Name = "Alex",
            player2Name = "Jordan",
            gameMode = com.couplequest.data.model.GameMode.TRUTH_OR_DARE,
            connectionType = com.couplequest.data.model.ConnectionType.ONE_PHONE,
            currentTurn = "1",
            roundNumber = 1,
            maxRounds = 10
        )
        val gameState = com.couplequest.game.engine.TurnManager.GameState(
            room = room,
            player1 = player1,
            player2 = player2,
            currentTurnPlayerId = "1",
            isPlayer1Turn = true,
            roundNumber = 1,
            maxRounds = 10,
            isGameActive = true
        )

        GameDashboardScreen(
            gameState = gameState,
            onRevealChallenge = {},
            onCompleteChallenge = {},
            onSkipChallenge = {},
            onRerollChallenge = {},
            onHideChallenge = {},
            onOpenChat = {},
            onEndGame = {}
        )
    }
}