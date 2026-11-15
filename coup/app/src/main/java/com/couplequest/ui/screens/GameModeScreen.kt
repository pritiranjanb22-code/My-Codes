package com.couplequest.ui.screens

import androidx.compose.foundation.layout.Arrangement
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
import com.couplequest.data.model.GameMode
import com.couplequest.ui.theme.CoupleQuestColors
import com.couplequest.ui.theme.CoupleQuestTheme
import com.couplequest.ui.theme.Typography

@Composable
fun GameModeScreen(
    onGameModeSelected: (GameMode) -> Unit,
    onBack: () -> Unit
) {
    var selectedMode by remember { mutableStateOf<GameMode?>(null) }

    val gameModes = listOf(
        GameModeInfo(
            mode = GameMode.TRUTH_OR_DARE,
            title = "Truth or Dare",
            description = "Classic game with romantic, fun, and intimate questions and dares",
            icon = "💬",
            color = CoupleQuestColors.Primary,
            categories = listOf("Romantic", "Funny", "Deep", "Playful", "Adult")
        ),
        GameModeInfo(
            mode = GameMode.INTIMATE_POSITIONS,
            title = "Intimate Positions",
            description = "Educational position guide with comfort tips for consenting adults",
            icon = "💑",
            color = CoupleQuestColors.Tertiary,
            categories = listOf("Romantic", "Gentle", "Beginner", "Advanced"),
            isAdultContent = true
        ),
        GameModeInfo(
            mode = GameMode.ROMANTIC_CHALLENGES,
            title = "Romantic Challenges",
            description = "Date ideas, compliments, affection challenges, and thoughtful gestures",
            icon = "🌹",
            color = CoupleQuestColors.Secondary,
            categories = listOf("Date Ideas", "Compliments", "Affection", "Surprises")
        ),
        GameModeInfo(
            mode = GameMode.COUPLE_QUESTIONS,
            title = "Couple Questions",
            description = "Deep conversation starters to strengthen your connection",
            icon = "💭",
            color = Color(0xFF00BCD4),
            categories = listOf("Communication", "Trust", "Future", "Memories")
        )
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Choose Your Game",
                fontSize = 28.sp,
                fontWeight = FontWeight.Light,
                color = CoupleQuestColors.OnSurface
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
            Text(
                text = "Select a game mode to play together",
                fontSize = 16.sp,
                color = CoupleQuestColors.OnSurfaceVariant,
                textAlign = androidx.compose.ui.text.TextAlign.Center
            )
        }

        // Game mode cards
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 8.dp)
        ) {
            items(gameModes) { gameMode ->
                GameModeCard(
                    gameMode = gameMode,
                    isSelected = selectedMode == gameMode.mode,
                    onClick = { selectedMode = gameMode.mode }
                )
            }
        }

        // Start button
        Button(
            onClick = {
                selectedMode?.let { onGameModeSelected(it) }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = selectedMode != null,
            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                containerColor = CoupleQuestColors.Primary,
                contentColor = CoupleQuestColors.OnPrimary,
                disabledContainerColor = CoupleQuestColors.OutlineVariant
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
        ) {
            androidx.compose.foundation.layout.Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Continue",
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

data class GameModeInfo(
    val mode: GameMode,
    val title: String,
    val description: String,
    val icon: String,
    val color: Color,
    val categories: List<String>,
    val isAdultContent: Boolean = false
)

@Composable
fun GameModeCard(
    gameMode: GameModeInfo,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 4.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = if (isSelected) gameMode.color.copy(alpha = 0.1f) else CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        border = if (isSelected) androidx.compose.ui.graphics.Stroke(2.dp, gameMode.color) else null
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier.padding(20.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Box(
                modifier = Modifier.size(56.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = gameMode.icon,
                    fontSize = 28.sp
                )
            }

            // Content
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = gameMode.title,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium,
                        color = CoupleQuestColors.OnSurface
                    )
                    if (gameMode.isAdultContent) {
                        androidx.compose.material3.Badge(
                            backgroundColor = CoupleQuestColors.Primary,
                            contentColor = CoupleQuestColors.OnPrimary
                        ) {
                            Text(
                                text = "18+",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Text(
                    text = gameMode.description,
                    fontSize = 14.sp,
                    color = CoupleQuestColors.OnSurfaceVariant,
                    maxLines = 2,
                    overflow = androidx.compose.ui.text.TextOverflow.Ellipsis
                )

                // Categories chips
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    gameMode.categories.take(3).forEach { category ->
                        androidx.compose.material3.Chip(
                            onClick = { },
                            modifier = Modifier.padding(vertical = 2.dp),
                            colors = androidx.compose.material3.ChipDefaults.chipColors(
                                containerColor = gameMode.color.copy(alpha = 0.1f),
                                contentColor = gameMode.color
                            ),
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = category,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                    if (gameMode.categories.size > 3) {
                        Text(
                            text = "+${gameMode.categories.size - 3} more",
                            fontSize = 11.sp,
                            color = CoupleQuestColors.OnSurfaceVariant
                        )
                    }
                }
            }

            // Selection indicator
            if (isSelected) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = gameMode.color,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}

@Composable
fun GameModeScreenPreview() {
    CoupleQuestTheme {
        GameModeScreen(onGameModeSelected = {}, onBack = {})
    }
}