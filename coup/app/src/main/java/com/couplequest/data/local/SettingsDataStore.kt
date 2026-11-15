package com.couplequest.data.local

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.PreferencesKeys
import androidx.datastore.preferences.core.boolPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.rxjava3.RxPreferenceDataStoreBuilder
import androidx.datastore.rxjava3.RxDataStore
import com.couplequest.data.model.AppSettings
import com.couplequest.data.model.ConnectionType
import com.couplequest.data.model.GameMode
import com.couplequest.data.model.PrivacySettings
import io.reactivex.rxjava3.core.Completable
import io.reactivex.rxjava3.core.Flowable
import io.reactivex.rxjava3.core.Single
import kotlinx.coroutines.tasks.await

object SettingsDataStore {
    // App Settings Keys
    private val IS_DARK_THEME = booleanPreferencesKey("is_dark_theme")
    private val IS_HAPTIC_FEEDBACK = booleanPreferencesKey("is_haptic_feedback")
    private val IS_SOUND_ENABLED = booleanPreferencesKey("is_sound_enabled")
    private val IS_ADULT_CONTENT_ENABLED = booleanPreferencesKey("is_adult_content_enabled")
    private val ADULT_CONTENT_CONSENT_GIVEN = booleanPreferencesKey("adult_content_consent_given")
    private val ADULT_CONTENT_CONSENT_DATE = longPreferencesKey("adult_content_consent_date")
    private val DEFAULT_GAME_MODE = stringPreferencesKey("default_game_mode")
    private val DEFAULT_MAX_ROUNDS = intPreferencesKey("default_max_rounds")
    private val AUTO_SAVE_GAME = booleanPreferencesKey("auto_save_game")
    private val CLEAR_CHAT_ON_EXIT = booleanPreferencesKey("clear_chat_on_exit")
    private val SHOW_CONSENT_REMINDER = booleanPreferencesKey("show_consent_reminder")
    private val PREFERRED_CONNECTION_TYPE = stringPreferencesKey("preferred_connection_type")
    private val LANGUAGE = stringPreferencesKey("language")

    // Privacy Settings Keys
    private val SHARE_ANALYTICS = booleanPreferencesKey("share_analytics")
    private val SHARE_CRASH_REPORTS = booleanPreferencesKey("share_crash_reports")
    private val ALLOW_LOCAL_DISCOVERY = booleanPreferencesKey("allow_local_discovery")
    private val REQUIRE_PIN_FOR_ADULT = booleanPreferencesKey("require_pin_for_adult")
    private val PIN_HASH = stringPreferencesKey("pin_hash")
    private val DATA_RETENTION_DAYS = intPreferencesKey("data_retention_days")

    // Consent Record Keys
    private val HAS_CONSENTED_ADULT = booleanPreferencesKey("has_consented_adult")
    private val CONSENT_DATE = longPreferencesKey("consent_date")
    private val CONSENT_VERSION = stringPreferencesKey("consent_version")
    private val AGE_VERIFIED = booleanPreferencesKey("age_verified")

    @Suppress("UNUSED_PARAMETER")
    fun getDataStore(context: Context): RxDataStore<Preferences> {
        return RxPreferenceDataStoreBuilder(context, "settings_datastore").build()
    }

    // App Settings Flow
    fun appSettingsFlow(dataStore: RxDataStore<Preferences>): Flowable<AppSettings> {
        return dataStore.data().map { prefs ->
            AppSettings(
                isDarkTheme = prefs[IS_DARK_THEME] ?: false,
                isHapticFeedbackEnabled = prefs[IS_HAPTIC_FEEDBACK] ?: true,
                isSoundEnabled = prefs[IS_SOUND_ENABLED] ?: true,
                isAdultContentEnabled = prefs[IS_ADULT_CONTENT_ENABLED] ?: false,
                adultContentConsentGiven = prefs[ADULT_CONTENT_CONSENT_GIVEN] ?: false,
                adultContentConsentDate = prefs[ADULT_CONTENT_CONSENT_DATE]?.let { if (it > 0) it else null },
                defaultGameMode = GameMode.valueOf(prefs[DEFAULT_GAME_MODE] ?: GameMode.TRUTH_OR_DARE.name),
                defaultMaxRounds = prefs[DEFAULT_MAX_ROUNDS] ?: 10,
                autoSaveGame = prefs[AUTO_SAVE_GAME] ?: true,
                clearChatOnExit = prefs[CLEAR_CHAT_ON_EXIT] ?: true,
                showConsentReminder = prefs[SHOW_CONSENT_REMINDER] ?: true,
                preferredConnectionType = ConnectionType.valueOf(prefs[PREFERRED_CONNECTION_TYPE] ?: ConnectionType.ONE_PHONE.name),
                language = prefs[LANGUAGE] ?: "en"
            )
        }
    }

    // Privacy Settings Flow
    fun privacySettingsFlow(dataStore: RxDataStore<Preferences>): Flowable<PrivacySettings> {
        return dataStore.data().map { prefs ->
            PrivacySettings(
                shareAnalytics = prefs[SHARE_ANALYTICS] ?: false,
                shareCrashReports = prefs[SHARE_CRASH_REPORTS] ?: false,
                allowLocalDiscovery = prefs[ALLOW_LOCAL_DISCOVERY] ?: true,
                requirePinForAdultContent = prefs[REQUIRE_PIN_FOR_ADULT] ?: false,
                pinHash = prefs[PIN_HASH],
                dataRetentionDays = prefs[DATA_RETENTION_DAYS] ?: 30
            )
        }
    }

    // Consent Record Flow
    fun consentRecordFlow(dataStore: RxDataStore<Preferences>): Flowable<ConsentRecord> {
        return dataStore.data().map { prefs ->
            ConsentRecord(
                hasConsentedToAdultContent = prefs[HAS_CONSENTED_ADULT] ?: false,
                consentDate = prefs[CONSENT_DATE]?.let { if (it > 0) it else null },
                consentVersion = prefs[CONSENT_VERSION] ?: "1.0",
                ageVerified = prefs[AGE_VERIFIED] ?: false
            )
        }
    }

    // Update functions
    fun updateAppSettings(dataStore: RxDataStore<Preferences>, settings: AppSettings): Completable {
        return dataStore.updateDataAsync { prefs ->
            prefs[IS_DARK_THEME] = settings.isDarkTheme
            prefs[IS_HAPTIC_FEEDBACK] = settings.isHapticFeedbackEnabled
            prefs[IS_SOUND_ENABLED] = settings.isSoundEnabled
            prefs[IS_ADULT_CONTENT_ENABLED] = settings.isAdultContentEnabled
            prefs[ADULT_CONTENT_CONSENT_GIVEN] = settings.adultContentConsentGiven
            prefs[ADULT_CONTENT_CONSENT_DATE] = settings.adultContentConsentDate ?: 0
            prefs[DEFAULT_GAME_MODE] = settings.defaultGameMode.name
            prefs[DEFAULT_MAX_ROUNDS] = settings.defaultMaxRounds
            prefs[AUTO_SAVE_GAME] = settings.autoSaveGame
            prefs[CLEAR_CHAT_ON_EXIT] = settings.clearChatOnExit
            prefs[SHOW_CONSENT_REMINDER] = settings.showConsentReminder
            prefs[PREFERRED_CONNECTION_TYPE] = settings.preferredConnectionType.name
            prefs[LANGUAGE] = settings.language
        }
    }

    fun updatePrivacySettings(dataStore: RxDataStore<Preferences>, settings: PrivacySettings): Completable {
        return dataStore.updateDataAsync { prefs ->
            prefs[SHARE_ANALYTICS] = settings.shareAnalytics
            prefs[SHARE_CRASH_REPORTS] = settings.shareCrashReports
            prefs[ALLOW_LOCAL_DISCOVERY] = settings.allowLocalDiscovery
            prefs[REQUIRE_PIN_FOR_ADULT] = settings.requirePinForAdultContent
            prefs[PIN_HASH] = settings.pinHash
            prefs[DATA_RETENTION_DAYS] = settings.dataRetentionDays
        }
    }

    fun updateConsentRecord(dataStore: RxDataStore<Preferences>, record: ConsentRecord): Completable {
        return dataStore.updateDataAsync { prefs ->
            prefs[HAS_CONSENTED_ADULT] = record.hasConsentedToAdultContent
            prefs[CONSENT_DATE] = record.consentDate ?: 0
            prefs[CONSENT_VERSION] = record.consentVersion
            prefs[AGE_VERIFIED] = record.ageVerified
        }
    }
}