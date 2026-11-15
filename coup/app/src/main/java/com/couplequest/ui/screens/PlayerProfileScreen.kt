package com.couplequest.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
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
import com.couplequest.data.model.Player
import com.couplequest.data.model.PlayerIdentity
import com.couplequest.ui.theme.CoupleQuestColors
import com.couplequest.ui.theme.CoupleQuestTheme
import com.couplequest.ui.theme.Typography

@Composable
fun PlayerProfileScreen(
    playerNumber: Int,
    totalPlayers: Int,
    onComplete: (Player) -> Unit,
    onBack: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var selectedAvatar by remember { mutableStateOf("default") }
    var selectedIdentity by remember { mutableStateOf(PlayerIdentity.UNSPECIFIED) }

    val avatars = listOf(
        "default", "heart", "star", "moon", "sun", "flower",
        "gem", "crown", "key", "lock", "anchor", "wing"
    )

    val isPlayer1 = playerNumber == 1
    val title = if (isPlayer1) "Player 1 Setup" else "Player 2 Setup"
    val subtitle = if (isPlayer1) "Enter your name and choose your avatar" else "Enter your partner's name and choose their avatar"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Progress indicator
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            repeat(totalPlayers) { index ->
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .padding(horizontal = 4.dp)
                        .background(
                            if (index < playerNumber - 1) CoupleQuestColors.Primary
                            else if (index == playerNumber - 1) CoupleQuestColors.Primary.copy(alpha = 0.5f)
                            else CoupleQuestColors.OutlineVariant,
                            shape = androidx.compose.foundation.shape.CircleShape
                        )
                )
            }
        }

        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))

        // Title
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                fontSize = 28.sp,
                fontWeight = FontWeight.Light,
                color = CoupleQuestColors.OnSurface
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
            Text(
                text = subtitle,
                fontSize = 16.sp,
                color = CoupleQuestColors.OnSurfaceVariant,
                textAlign = androidx.compose.ui.text.TextAlign.Center
            )
        }

        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))

        // Name field
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Name",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = CoupleQuestColors.OnSurfaceVariant
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
            TextField(
                value = name,
                onValueChange = { name = it },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                placeholder = { Text("Enter name") },
                colors = TextFieldDefaults.textFieldColors(
                    containerColor = CoupleQuestColors.SurfaceContainer,
                    focusedContainerColor = CoupleQuestColors.SurfaceContainer,
                    unfocusedContainerColor = CoupleQuestColors.SurfaceContainer
                )
            )
        }

        // Avatar selection
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Avatar",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = CoupleQuestColors.OnSurfaceVariant
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))
            
            androidx.compose.foundation.lazy.LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp)
            ) {
                items(avatars) { avatar ->
                    AvatarOption(
                        avatarId = avatar,
                        isSelected = selectedAvatar == avatar,
                        onClick = { selectedAvatar = avatar }
                    )
                }
            }
        }

        // Identity selection
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Identity (Optional)",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = CoupleQuestColors.OnSurfaceVariant
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))
            
            androidx.compose.foundation.lazy.LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp)
            ) {
                items(PlayerIdentity.values()) { identity ->
                    IdentityOption(
                        identity = identity,
                        isSelected = selectedIdentity == identity,
                        onClick = { selectedIdentity = identity }
                    )
                }
            }
        }

        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(32.dp))

        // Continue button
        Button(
            onClick = {
                val player = Player(
                    name = name.ifBlank { if (isPlayer1) "Player 1" else "Player 2" },
                    avatarId = selectedAvatar,
                    isPlayer1 = isPlayer1,
                    identity = selectedIdentity
                )
                onComplete(player)
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = name.isNotBlank(),
            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                containerColor = CoupleQuestColors.Primary,
                contentColor = CoupleQuestColors.OnPrimary,
                disabledContainerColor = CoupleQuestColors.OutlineVariant
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
        ) {
            Text(
                text = if (playerNumber == totalPlayers) "Start Game" else "Continue",
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(vertical = 16.dp)
            )
        }

        // Back button
        if (playerNumber > 1) {
            Text(
                text = "Back",
                fontSize = 16.sp,
                color = CoupleQuestColors.Primary,
                fontWeight = FontWeight.Medium,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp)
                    .wrapContentWidth(Alignment.CenterHorizontally)
            )
        }
    }
}

@Composable
fun AvatarOption(
    avatarId: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val color = when (avatarId) {
        "heart" -> CoupleQuestColors.Primary
        "star" -> CoupleQuestColors.Secondary
        "moon" -> CoupleQuestColors.Tertiary
        "sun" -> Color(0xFFFF9800)
        "flower" -> Color(0xFF4CAF50)
        "gem" -> Color(0xFF9C27B0)
        "crown" -> Color(0xFFFFD700)
        "key" -> Color(0xFF795548)
        "lock" -> Color(0xFF607D8B)
        "anchor" -> Color(0xFF3F51B5)
        "wing" -> Color(0xFFE91E63)
        else -> CoupleQuestColors.OnSurfaceVariant
    }

    Card(
        modifier = Modifier
            .size(64.dp)
            .fillMaxHeight()
            .wrapContentWidth()
            .clickable { onClick() },
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = if (isSelected) color.copy(alpha = 0.2f) else CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        border = if (isSelected) androidx.compose.ui.graphics.Stroke(3.dp, color) else null
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            // Avatar icon placeholder
            androidx.compose.foundation.Canvas(modifier = Modifier.size(32.dp)) {
                val iconColor = if (isSelected) color else CoupleQuestColors.OnSurfaceVariant
                drawCircle(iconColor, 16f, 16f, 16f)
                
                // Draw simple icon based on avatarId
                when (avatarId) {
                    "heart" -> drawHeart(iconColor)
                    "star" -> drawStar(iconColor)
                    "moon" -> drawMoon(iconColor)
                    "sun" -> drawSun(iconColor)
                    "flower" -> drawFlower(iconColor)
                    "gem" -> drawGem(iconColor)
                    "crown" -> drawCrown(iconColor)
                    "key" -> drawKey(iconColor)
                    "lock" -> drawLock(iconColor)
                    "anchor" -> drawAnchor(iconColor)
                    "wing" -> drawWing(iconColor)
                    else -> drawDefault(iconColor)
                }
            }
        }
    }
}

@Composable
fun IdentityOption(
    identity: PlayerIdentity,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val label = when (identity) {
        PlayerIdentity.UNSPECIFIED -> "Unspecified"
        PlayerIdentity.MALE -> "Male"
        PlayerIdentity.FEMALE -> "Female"
        PlayerIdentity.NON_BINARY -> "Non-binary"
        PlayerIdentity.PREFER_NOT_TO_SAY -> "Prefer not to say"
        PlayerIdentity.CUSTOM -> "Custom"
    }

    Card(
        modifier = Modifier
            .wrapContentSize()
            .clickable { onClick() },
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = if (isSelected) CoupleQuestColors.PrimaryContainer else CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp)
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = if (isSelected) FontWeight.Medium else FontWeight.Normal,
            color = if (isSelected) CoupleQuestColors.Primary else CoupleQuestColors.OnSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)
        )
    }
}

// Avatar drawing functions
private fun androidx.compose.ui.graphics.DrawScope.drawHeart(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(16f, 8f)
    path.cubicTo(16f, 0f, 24f, 0f, 24f, 8f)
    path.cubicTo(24f, 16f, 16f, 24f, 16f, 24f)
    path.cubicTo(16f, 24f, 8f, 16f, 8f, 8f)
    path.cubicTo(8f, 0f, 16f, 0f, 16f, 8f)
    path.close()
    drawPath(path, color)
}

private fun androidx.compose.ui.graphics.DrawScope.drawStar(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(16f, 2f)
    path.lineTo(19f, 10f)
    path.lineTo(28f, 10f)
    path.lineTo(21f, 16f)
    path.lineTo(24f, 25f)
    path.lineTo(16f, 20f)
    path.lineTo(8f, 25f)
    path.lineTo(11f, 16f)
    path.lineTo(4f, 10f)
    path.lineTo(13f, 10f)
    path.close()
    drawPath(path, color)
}

private fun androidx.compose.ui.graphics.DrawScope.drawMoon(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(24f, 4f)
    path.cubicTo(24f, 10f, 18f, 16f, 12f, 16f)
    path.cubicTo(6f, 16f, 0f, 10f, 0f, 4f)
    path.cubicTo(0f, -2f, 6f, -8f, 12f, -8f)
    path.cubicTo(18f, -8f, 24f, -2f, 24f, 4f)
    path.close()
    drawPath(path, color)
}

private fun androidx.compose.ui.graphics.DrawScope.drawSun(color: Color) {
    drawCircle(color, 16f, 16f, 10f)
    for (i in 0..7) {
        val angle = (i * 45.0).toRadians()
        val x1 = 16f + 14f * cos(angle)
        val y1 = 16f + 14f * sin(angle)
        val x2 = 16f + 20f * cos(angle)
        val y2 = 16f + 20f * sin(angle)
        drawLine(color, androidx.compose.ui.graphics.Point(x1, y1), androidx.compose.ui.graphics.Point(x2, y2), strokeWidth = 2f)
    }
}

private fun androidx.compose.ui.graphics.DrawScope.drawFlower(color: Color) {
    for (i in 0..4) {
        val angle = (i * 72.0 - 90).toRadians()
        val cx = 16f + 12f * cos(angle)
        val cy = 16f + 12f * sin(angle)
        drawCircle(color, cx, cy, 8f)
    }
    drawCircle(color, 16f, 16f, 6f)
}

private fun androidx.compose.ui.graphics.DrawScope.drawGem(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(16f, 2f)
    path.lineTo(28f, 10f)
    path.lineTo(28f, 22f)
    path.lineTo(16f, 30f)
    path.lineTo(4f, 22f)
    path.lineTo(4f, 10f)
    path.close()
    drawPath(path, color)
}

private fun androidx.compose.ui.graphics.DrawScope.drawCrown(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(4f, 28f)
    path.lineTo(4f, 22f)
    path.lineTo(8f, 22f)
    path.lineTo(12f, 14f)
    path.lineTo(16f, 22f)
    path.lineTo(20f, 14f)
    path.lineTo(24f, 22f)
    path.lineTo(28f, 22f)
    path.lineTo(28f, 28f)
    path.close()
    drawPath(path, color)
}

private fun androidx.compose.ui.graphics.DrawScope.drawKey(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(8f, 16f)
    path.lineTo(8f, 24f)
    path.lineTo(12f, 24f)
    path.lineTo(12f, 16f)
    path.lineTo(20f, 16f)
    path.lineTo(20f, 12f)
    path.lineTo(12f, 12f)
    path.lineTo(12f, 4f)
    path.lineTo(8f, 4f)
    path.lineTo(8f, 12f)
    path.lineTo(4f, 12f)
    path.lineTo(4f, 16f)
    path.close()
    drawPath(path, color)
}

private fun androidx.compose.ui.graphics.DrawScope.drawLock(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(8f, 12f)
    path.lineTo(8f, 28f)
    path.lineTo(24f, 28f)
    path.lineTo(24f, 12f)
    path.close()
    drawPath(path, color)
    
    val shackle = androidx.compose.ui.graphics.Path()
    shackle.moveTo(10f, 12f)
    shackle.cubicTo(10f, 6f, 14f, 2f, 22f, 2f)
    shackle.cubicTo(30f, 2f, 34f, 6f, 34f, 12f)
    drawPath(shackle, color, style = androidx.compose.ui.graphics.Stroke(3f))
}

private fun androidx.compose.ui.graphics.DrawScope.drawAnchor(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(16f, 4f)
    path.lineTo(16f, 20f)
    path.lineTo(24f, 20f)
    path.lineTo(24f, 24f)
    path.lineTo(8f, 24f)
    path.lineTo(8f, 20f)
    path.lineTo(16f, 20f)
    path.moveTo(16f, 4f)
    path.cubicTo(20f, 4f, 24f, 8f, 24f, 12f)
    path.cubicTo(24f, 16f, 20f, 20f, 16f, 20f)
    path.moveTo(16f, 4f)
    path.cubicTo(12f, 4f, 8f, 8f, 8f, 12f)
    path.cubicTo(8f, 16f, 12f, 20f, 16f, 20f)
    drawPath(path, color)
}

private fun androidx.compose.ui.graphics.DrawScope.drawWing(color: Color) {
    val path = androidx.compose.ui.graphics.Path()
    path.moveTo(16f, 28f)
    path.cubicTo(16f, 28f, 8f, 20f, 4f, 12f)
    path.cubicTo(0f, 4f, 8f, 0f, 16f, 4f)
    path.cubicTo(24f, 0f, 32f, 4f, 28f, 12f)
    path.cubicTo(24f, 20f, 16f, 28f, 16f, 28f)
    drawPath(path, color)
}

private fun androidx.compose.ui.graphics.DrawScope.drawDefault(color: Color) {
    drawCircle(color, 16f, 16f, 12f)
}

@Composable
fun PlayerProfileScreenPreview() {
    CoupleQuestTheme {
        PlayerProfileScreen(
            playerNumber = 1,
            totalPlayers = 2,
            onComplete = {},
            onBack = {}
        )
    }
}