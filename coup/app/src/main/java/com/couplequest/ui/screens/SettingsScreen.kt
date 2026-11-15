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
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Vibration
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsStateWithLifecycle
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
import com.couplequest.data.model.AppSettings
import com.couplequest.data.model.ConsentRecord
import com.couplequest.data.model.PrivacySettings
import com.couplequest.ui.theme.CoupleQuestColors
import com.couplequest.ui.theme.CoupleQuestTheme
import com.couplequest.ui.theme.Typography

@Composable
fun SettingsScreen(
    appSettings: AppSettings,
    privacySettings: PrivacySettings,
    consentRecord: ConsentRecord,
    onAppSettingsChange: (AppSettings) -> Unit,
    onPrivacySettingsChange: (PrivacySettings) -> Unit,
    onConsentRecordChange: (ConsentRecord) -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        // Header
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = androidx.compose.material3.CardDefaults.cardColors(
                containerColor = CoupleQuestColors.PrimaryContainer
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.Palette,
                    contentDescription = null,
                    tint = CoupleQuestColors.Primary,
                    modifier = Modifier.size(48.dp)
                )
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(12.dp))
                Text(
                    text = "Settings",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Light,
                    color = CoupleQuestColors.Primary
                )
                Text(
                    text = "Customize your experience",
                    fontSize = 14.sp,
                    color = CoupleQuestColors.OnPrimaryContainer
                )
            }
        }

        // Settings content
        androidx.compose.foundation.layout.Column(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Appearance section
            SettingsSection(title = "Appearance") {
                SettingRow(
                    icon = Icons.Default.DarkMode,
                    title = "Dark Theme",
                    subtitle = "Use dark color scheme",
                    color = CoupleQuestColors.Primary
                ) {
                    Switch(
                        checked = appSettings.isDarkTheme,
                        onCheckedChange = { enabled ->
                            onAppSettingsChange(appSettings.copy(isDarkTheme = enabled))
                        },
                        colors = androidx.compose.material3.SwitchDefaults.colors(
                            thumbColor = CoupleQuestColors.Primary,
                            trackColor = CoupleQuestColors.PrimaryContainer
                        )
                    )
                }
            }

            // Gameplay section
            SettingsSection(title = "Gameplay") {
                SettingRow(
                    icon = Icons.Default.Vibration,
                    title = "Haptic Feedback",
                    subtitle = "Vibrate on interactions",
                    color = CoupleQuestColors.Secondary
                ) {
                    Switch(
                        checked = appSettings.isHapticFeedbackEnabled,
                        onCheckedChange = { enabled ->
                            onAppSettingsChange(appSettings.copy(isHapticFeedbackEnabled = enabled))
                        },
                        colors = androidx.compose.material3.SwitchDefaults.colors(
                            thumbColor = CoupleQuestColors.Secondary,
                            trackColor = CoupleQuestColors.SecondaryContainer
                        )
                    )
                }

                SettingRow(
                    icon = Icons.Default.VolumeUp,
                    title = "Sound Effects",
                    subtitle = "Play sounds during gameplay",
                    color = CoupleQuestColors.Tertiary
                ) {
                    Switch(
                        checked = appSettings.isSoundEnabled,
                        onCheckedChange = { enabled ->
                            onAppSettingsChange(appSettings.copy(isSoundEnabled = enabled))
                        },
                        colors = androidx.compose.material3.SwitchDefaults.colors(
                            thumbColor = CoupleQuestColors.Tertiary,
                            trackColor = CoupleQuestColors.TertiaryContainer
                        )
                    )
                }

                SettingRow(
                    icon = Icons.Default.Lock,
                    title = "Adult Content",
                    subtitle = "Enable 18+ intimate content",
                    color = CoupleQuestColors.Error
                ) {
                    Switch(
                        checked = appSettings.isAdultContentEnabled,
                        onCheckedChange = { enabled ->
                            if (enabled && !consentRecord.hasConsentedToAdultContent) {
                                // Show consent dialog
                            } else {
                                onAppSettingsChange(appSettings.copy(isAdultContentEnabled = enabled))
                            }
                        },
                        colors = androidx.compose.material3.SwitchDefaults.colors(
                            thumbColor = CoupleQuestColors.Error,
                            trackColor = CoupleQuestColors.ErrorContainer
                        )
                    )
                }
            }

            // Privacy section
            SettingsSection(title = "Privacy & Safety") {
                SettingRow(
                    icon = Icons.Default.PrivacyTip,
                    title = "Clear Chat on Exit",
                    subtitle = "Automatically delete messages when leaving a game",
                    color = CoupleQuestColors.Success
                ) {
                    Switch(
                        checked = appSettings.clearChatOnExit,
                        onCheckedChange = { enabled ->
                            onAppSettingsChange(appSettings.copy(clearChatOnExit = enabled))
                        },
                        colors = androidx.compose.material3.SwitchDefaults.colors(
                            thumbColor = CoupleQuestColors.Success,
                            trackColor = CoupleQuestColors.SuccessContainer
                        )
                    )
                }

                SettingRow(
                    icon = Icons.Default.Info,
                    title = "Consent Reminders",
                    subtitle = "Show consent notice before adult content",
                    color = CoupleQuestColors.Primary
                ) {
                    Switch(
                        checked = appSettings.showConsentReminder,
                        onCheckedChange = { enabled ->
                            onAppSettingsChange(appSettings.copy(showConsentReminder = enabled))
                        },
                        colors = androidx.compose.material3.SwitchDefaults.colors(
                            thumbColor = CoupleQuestColors.Primary,
                            trackColor = CoupleQuestColors.PrimaryContainer
                        )
                    )
                }

                SettingRow(
                    icon = Icons.Default.Security,
                    title = "Share Analytics",
                    subtitle = "Help improve the app (anonymous)",
                    color = CoupleQuestColors.Warning
                ) {
                    Switch(
                        checked = privacySettings.shareAnalytics,
                        onCheckedChange = { enabled ->
                            onPrivacySettingsChange(privacySettings.copy(shareAnalytics = enabled))
                        },
                        colors = androidx.compose.material3.SwitchDefaults.colors(
                            thumbColor = CoupleQuestColors.Warning,
                            trackColor = CoupleQuestColors.WarningContainer
                        )
                    )
                }

                SettingRow(
                    icon = Icons.Default.Fingerprint,
                    title = "PIN for Adult Content",
                    subtitle = "Require PIN to access 18+ content",
                    color = CoupleQuestColors.Error
                ) {
                    Switch(
                        checked = privacySettings.requirePinForAdultContent,
                        onCheckedChange = { enabled ->
                            onPrivacySettingsChange(privacySettings.copy(requirePinForAdultContent = enabled))
                        },
                        colors = androidx.compose.material3.SwitchDefaults.colors(
                            thumbColor = CoupleQuestColors.Error,
                            trackColor = CoupleQuestColors.ErrorContainer
                        )
                    )
                )
            }

            // Data section
            SettingsSection(title = "Data") {
                SettingCard(
                    icon = Icons.Default.Delete,
                    title = "Clear All Data",
                    subtitle = "Delete all game history, settings, and chat data",
                    color = CoupleQuestColors.Error,
                    onClick = { /* Show confirmation dialog */ }
                )
            }

            // About section
            SettingsSection(title = "About") {
                SettingCard(
                    icon = Icons.Default.Info,
                    title = "Version",
                    subtitle = "1.0.0",
                    color = CoupleQuestColors.OnSurfaceVariant,
                    showArrow = false
                )

                SettingCard(
                    icon = Icons.Default.PrivacyTip,
                    title = "Privacy Policy",
                    subtitle = "Read our privacy policy",
                    color = CoupleQuestColors.Primary,
                    onClick = { /* Open privacy policy */ }
                )

                SettingCard(
                    icon = Icons.Default.Security,
                    title = "Terms of Service",
                    subtitle = "Read our terms of service",
                    color = CoupleQuestColors.Primary,
                    onClick = { /* Open terms */ }
                )

                SettingCard(
                    icon = Icons.Default.Info,
                    title = "Licenses",
                    subtitle = "Open source licenses",
                    color = CoupleQuestColors.Primary,
                    onClick = { /* Open licenses */ }
                )
            }
        }
    }
}

@Composable
fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = title,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = CoupleQuestColors.OnSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = androidx.compose.material3.CardDefaults.cardColors(
                containerColor = CoupleQuestColors.SurfaceContainer
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                content()
            }
        }
    }
}

@Composable
fun SettingRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    color: Color,
    trailing: @Composable () -> Unit
) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        androidx.compose.foundation.layout.Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(40.dp),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(24.dp)
                )
            }

            Column {
                Text(
                    text = title,
                    fontSize = 16.sp,
                    color = CoupleQuestColors.OnSurface
                )
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = CoupleQuestColors.OnSurfaceVariant
                )
            }
        }

        trailing()
    }
}

@Composable
fun SettingCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    color: Color,
    showArrow: Boolean = true,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(16.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            androidx.compose.foundation.layout.Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.size(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = color,
                        modifier = Modifier.size(24.dp)
                    )
                }

                Column {
                    Text(
                        text = title,
                        fontSize = 16.sp,
                        color = CoupleQuestColors.OnSurface
                    )
                    Text(
                        text = subtitle,
                        fontSize = 12.sp,
                        color = CoupleQuestColors.OnSurfaceVariant
                    )
                }
            }

            if (showArrow) {
                Icon(
                    imageVector = Icons.Default.ArrowForward,
                    contentDescription = null,
                    tint = CoupleQuestColors.Outline
                )
            }
        }
    }
}

@Composable
fun SettingsScreenPreview() {
    CoupleQuestTheme {
        SettingsScreen(
            appSettings = com.couplequest.data.model.AppSettings(),
            privacySettings = com.couplequest.data.model.PrivacySettings(),
            consentRecord = com.couplequest.data.model.ConsentRecord(),
            onAppSettingsChange = {},
            onPrivacySettingsChange = {},
            onConsentRecordChange = {},
            onBack = {}
        )
    }
}