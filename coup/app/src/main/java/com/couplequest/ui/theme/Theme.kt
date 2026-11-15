package com.couplequest.ui.theme

import android.content.Context
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat

private val DarkColorScheme = darkColorScheme(
    primary = CoupleQuestColors.Dark.Primary,
    primaryContainer = CoupleQuestColors.Dark.PrimaryContainer,
    onPrimary = CoupleQuestColors.Dark.OnPrimary,
    onPrimaryContainer = CoupleQuestColors.Dark.OnPrimaryContainer,
    secondary = CoupleQuestColors.Dark.Secondary,
    secondaryContainer = CoupleQuestColors.Dark.SecondaryContainer,
    onSecondary = CoupleQuestColors.Dark.OnSecondary,
    onSecondaryContainer = CoupleQuestColors.Dark.OnSecondaryContainer,
    tertiary = CoupleQuestColors.Dark.Tertiary,
    tertiaryContainer = CoupleQuestColors.Dark.TertiaryContainer,
    onTertiary = CoupleQuestColors.Dark.OnTertiary,
    onTertiaryContainer = CoupleQuestColors.Dark.OnTertiaryContainer,
    surface = CoupleQuestColors.Dark.Surface,
    surfaceVariant = CoupleQuestColors.Dark.SurfaceVariant,
    surfaceContainer = CoupleQuestColors.Dark.SurfaceContainer,
    onSurface = CoupleQuestColors.Dark.OnSurface,
    onSurfaceVariant = CoupleQuestColors.Dark.OnSurfaceVariant,
    background = CoupleQuestColors.Dark.Background,
    onBackground = CoupleQuestColors.Dark.OnBackground,
    error = CoupleQuestColors.Dark.Error,
    errorContainer = CoupleQuestColors.Dark.ErrorContainer,
    onError = CoupleQuestColors.Dark.OnError,
    onErrorContainer = CoupleQuestColors.Dark.OnErrorContainer,
    outline = CoupleQuestColors.Dark.Outline,
    outlineVariant = CoupleQuestColors.Dark.OutlineVariant
)

private val LightColorScheme = lightColorScheme(
    primary = CoupleQuestColors.Primary,
    primaryContainer = CoupleQuestColors.PrimaryContainer,
    onPrimary = CoupleQuestColors.OnPrimary,
    onPrimaryContainer = CoupleQuestColors.OnPrimaryContainer,
    secondary = CoupleQuestColors.Secondary,
    secondaryContainer = CoupleQuestColors.SecondaryContainer,
    onSecondary = CoupleQuestColors.OnSecondary,
    onSecondaryContainer = CoupleQuestColors.OnSecondaryContainer,
    tertiary = CoupleQuestColors.Tertiary,
    tertiaryContainer = CoupleQuestColors.TertiaryContainer,
    onTertiary = CoupleQuestColors.OnTertiary,
    onTertiaryContainer = CoupleQuestColors.OnTertiaryContainer,
    surface = CoupleQuestColors.Surface,
    surfaceVariant = CoupleQuestColors.SurfaceVariant,
    surfaceContainer = CoupleQuestColors.SurfaceContainer,
    onSurface = CoupleQuestColors.OnSurface,
    onSurfaceVariant = CoupleQuestColors.OnSurfaceVariant,
    background = CoupleQuestColors.Background,
    onBackground = CoupleQuestColors.OnBackground,
    error = CoupleQuestColors.Error,
    errorContainer = CoupleQuestColors.ErrorContainer,
    onError = CoupleQuestColors.OnError,
    onErrorContainer = CoupleQuestColors.OnErrorContainer,
    outline = CoupleQuestColors.Outline,
    outlineVariant = CoupleQuestColors.OutlineVariant
)

@Composable
fun CoupleQuestTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val context = androidx.compose.ui.platform.LocalContext.current

    SideEffect {
        val window = (context as? androidx.appcompat.app.AppCompatActivity)?.window
        val view = window?.decorView
        val controller = view?.let { WindowInsetsControllerCompat(window, it) }
        controller?.isAppearanceLightStatusBars = !darkTheme
        controller?.isAppearanceLightNavigationBars = !darkTheme
        window?.statusBarColor = colorScheme.background.toArgb()
        window?.navigationBarColor = colorScheme.background.toArgb()
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

object Typography {
    // Using Material3 default typography with custom font family
    // Font family would be loaded via FontFamily in a real app
    val fontFamily = androidx.compose.ui.text.font.FontFamily.Default
}