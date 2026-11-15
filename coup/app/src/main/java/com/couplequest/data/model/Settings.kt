package com.couplequest.data.model

import kotlinx.serialization.Serializable

@Serializable
data class AppSettings(
    val isDarkTheme: Boolean = false,
    val isHapticFeedbackEnabled: Boolean = true,
    val isSoundEnabled: Boolean = true,
    val isAdultContentEnabled: Boolean = false,
    val adultContentConsentGiven: Boolean = false,
    val adultContentConsentDate: Long? = null,
    val defaultGameMode: GameMode = GameMode.TRUTH_OR_DARE,
    val defaultMaxRounds: Int = 10,
    val autoSaveGame: Boolean = true,
    val clearChatOnExit: Boolean = true,
    val showConsentReminder: Boolean = true,
    val preferredConnectionType: ConnectionType = ConnectionType.ONE_PHONE,
    val language: String = "en"
)

@Serializable
data class PrivacySettings(
    val shareAnalytics: Boolean = false,
    val shareCrashReports: Boolean = false,
    val allowLocalDiscovery: Boolean = true,
    val requirePinForAdultContent: Boolean = false,
    val pinHash: String? = null,
    val dataRetentionDays: Int = 30
)

@Serializable
data class ConsentRecord(
    val hasConsentedToAdultContent: Boolean = false,
    val consentDate: Long? = null,
    val consentVersion: String = "1.0",
    val ageVerified: Boolean = false
)