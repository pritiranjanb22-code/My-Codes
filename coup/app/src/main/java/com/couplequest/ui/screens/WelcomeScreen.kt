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
import androidx.compose.material3.Text
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
import com.couplequest.ui.theme.CoupleQuestColors
import com.couplequest.ui.theme.CoupleQuestTheme
import com.couplequest.ui.theme.Typography
import kotlinx.coroutines.delay

@Composable
fun WelcomeScreen(
    onGetStarted: () -> Unit,
    onSettings: () -> Unit
) {
    var showContent by remember { mutableStateOf(false) }
    val titleAlpha by animateFloatAsState(
        targetValue = if (showContent) 1f else 0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumStiff, stiffness = Spring.StiffnessLow)
    )
    val subtitleAlpha by animateFloatAsState(
        targetValue = if (showContent) 1f else 0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumStiff, stiffness = Spring.StiffnessLow, delayMillis = 200)
    )
    val buttonAlpha by animateFloatAsState(
        targetValue = if (showContent) 1f else 0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumStiff, stiffness = Spring.StiffnessLow, delayMillis = 400)
    )

    LaunchedEffect(Unit) {
        delay(300)
        showContent = true
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Romantic illustration area
            Box(
                modifier = Modifier
                    .size(200.dp)
                    .graphicsLayer { alpha = titleAlpha }
            ) {
                androidx.compose.foundation.Canvas(modifier = Modifier.size(200.dp)) {
                    // Draw romantic illustration - two figures holding hands
                    val centerX = 100f
                    val centerY = 100f
                    
                    // Left figure
                    drawCircle(
                        Color.LightGray.copy(alpha = 0.3f),
                        centerX - 35f, centerY - 40f,
                        20f
                    )
                    drawRoundRect(
                        CoupleQuestColors.Primary.copy(alpha = 0.2f),
                        androidx.compose.ui.graphics.Rect(centerX - 55f, centerY - 20f, centerX - 15f, centerY + 40f),
                        10f
                    )
                    
                    // Right figure
                    drawCircle(
                        Color.LightGray.copy(alpha = 0.3f),
                        centerX + 35f, centerY - 40f,
                        20f
                    )
                    drawRoundRect(
                        CoupleQuestColors.Tertiary.copy(alpha = 0.2f),
                        androidx.compose.ui.graphics.Rect(centerX + 15f, centerY - 20f, centerX + 55f, centerY + 40f),
                        10f
                    )
                    
                    // Connecting line (hands)
                    drawLine(
                        CoupleQuestColors.Primary,
                        start = androidx.compose.ui.graphics.Point(centerX - 15f, centerY + 10f),
                        end = androidx.compose.ui.graphics.Point(centerX + 15f, centerY + 10f),
                        strokeWidth = 3f
                    )
                    
                    // Heart above
                    val heartPath = androidx.compose.ui.graphics.Path()
                    heartPath.moveTo(centerX, centerY - 70f)
                    heartPath.cubicTo(centerX, centerY - 85f, centerX + 15f, centerY - 100f, centerX + 30f, centerY - 100f)
                    heartPath.cubicTo(centerX + 45f, centerY - 100f, centerX + 60f, centerY - 85f, centerX + 60f, centerY - 70f)
                    heartPath.cubicTo(centerX + 60f, centerY - 55f, centerX + 45f, centerY - 40f, centerX, centerY - 40f)
                    heartPath.cubicTo(centerX - 45f, centerY - 40f, centerX - 60f, centerY - 55f, centerX - 60f, centerY - 70f)
                    heartPath.cubicTo(centerX - 60f, centerY - 85f, centerX - 45f, centerY - 100f, centerX - 30f, centerY - 100f)
                    heartPath.cubicTo(centerX - 15f, centerY - 100f, centerX, centerY - 85f, centerX, centerY - 70f)
                    heartPath.close()
                    drawPath(heartPath, CoupleQuestColors.Primary.copy(alpha = 0.3f))
                    drawPath(heartPath, CoupleQuestColors.Primary, style = androidx.compose.ui.graphics.Stroke(2f))
                }
            }

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(32.dp))

            Text(
                text = "Welcome to Couple Quest",
                fontSize = 32.sp,
                fontWeight = FontWeight.Light,
                color = CoupleQuestColors.OnSurface,
                textAlign = androidx.compose.ui.text.TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .graphicsLayer { alpha = titleAlpha }
            )

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))

            Text(
                text = "Playful games, intimate challenges, and meaningful conversations to strengthen your relationship.",
                fontSize = 16.sp,
                color = CoupleQuestColors.OnSurfaceVariant,
                textAlign = androidx.compose.ui.text.TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .graphicsLayer { alpha = subtitleAlpha }
            )

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(48.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .graphicsLayer { alpha = buttonAlpha }
            ) {
                Button(
                    onClick = onGetStarted,
                    modifier = Modifier.fillMaxWidth(),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = CoupleQuestColors.Primary,
                        contentColor = CoupleQuestColors.OnPrimary
                    ),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
                ) {
                    Text(
                        text = "Start Playing",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(vertical = 16.dp)
                    )
                }

                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))

                androidx.compose.material3.OutlinedButton(
                    onClick = onSettings,
                    modifier = Modifier.fillMaxWidth(),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                    colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                        contentColor = CoupleQuestColors.Primary,
                        outlinedBorderColor = CoupleQuestColors.Primary
                    )
                ) {
                    Text(
                        text = "Settings & Privacy",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(vertical = 16.dp)
                    )
                }
            }

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(32.dp))

            Text(
                text = "For consenting adults 18+ • Private & Secure • Works Offline",
                fontSize = 12.sp,
                color = CoupleQuestColors.OnSurfaceVariant.copy(alpha = 0.6f),
                textAlign = androidx.compose.ui.text.TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .graphicsLayer { alpha = subtitleAlpha }
            )
        }
    }
}

@Composable
fun WelcomeScreenPreview() {
    CoupleQuestTheme {
        WelcomeScreen(onGetStarted = {}, onSettings = {})
    }
}