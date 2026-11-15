package com.couplequest.ui.screens

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
fun SplashScreen(onComplete: () -> Unit) {
    var showContent by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (showContent) 1f else 0.8f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumStiff, stiffness = Spring.StiffnessLow)
    )
    val alpha by animateFloatAsState(
        targetValue = if (showContent) 1f else 0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumStiff, stiffness = Spring.StiffnessLow)
    )

    LaunchedEffect(Unit) {
        delay(1500)
        showContent = true
        delay(1000)
        onComplete()
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo placeholder - would be an actual image in production
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .graphicsLayer { scaleX = scale; scaleY = scale; alpha = alpha }
            ) {
                // Heart icon as logo placeholder
                androidx.compose.foundation.Canvas(
                    modifier = Modifier.size(120.dp)
                ) {
                    val path = androidx.compose.ui.graphics.Path()
                    path.moveTo(60f, 30f)
                    path.cubicTo(60f, 15f, 75f, 0f, 90f, 0f)
                    path.cubicTo(105f, 0f, 120f, 15f, 120f, 30f)
                    path.cubicTo(120f, 45f, 105f, 60f, 90f, 60f)
                    path.cubicTo(75f, 60f, 60f, 45f, 60f, 30f)
                    path.moveTo(60f, 30f)
                    path.cubicTo(60f, 45f, 45f, 60f, 30f, 60f)
                    path.cubicTo(15f, 60f, 0f, 45f, 0f, 30f)
                    path.cubicTo(0f, 15f, 15f, 0f, 30f, 0f)
                    path.cubicTo(45f, 0f, 60f, 15f, 60f, 30f)
                    path.close()
                    drawPath(path, Color.Red, style = androidx.compose.ui.graphics.Stroke(4f))
                    drawPath(path, CoupleQuestColors.Primary.copy(alpha = 0.2f))
                }
            }

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(24.dp))

            Text(
                text = "Couple Quest",
                fontSize = 36.sp,
                fontWeight = FontWeight.Light,
                color = CoupleQuestColors.Primary,
                modifier = Modifier
                    .graphicsLayer { this.alpha = alpha }
            )

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))

            Text(
                text = "Strengthen your bond through play",
                fontSize = 16.sp,
                color = CoupleQuestColors.OnSurfaceVariant.copy(alpha = alpha),
                fontWeight = FontWeight.Normal
            )
        }
    }
}

@Composable
fun SplashScreenPreview() {
    CoupleQuestTheme {
        SplashScreen(onComplete = {})
    }
}