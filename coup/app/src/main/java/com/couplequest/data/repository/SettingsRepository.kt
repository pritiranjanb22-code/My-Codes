package com.couplequest.data.repository

import android.content.Context
import com.couplequest.data.local.SettingsDataStore
import com.couplequest.data.model.AppSettings
import com.couplequest.data.model.ConsentRecord
import com.couplequest.data.model.PrivacySettings
import io.reactivex.rxjava3.core.Completable
import io.reactivex.rxjava3.core.Flowable
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(
    private val context: Context
) {
    private val dataStore = SettingsDataStore.getDataStore(context)

    fun appSettingsFlow(): Flowable<AppSettings> {
        return SettingsDataStore.appSettingsFlow(dataStore)
    }

    fun privacySettingsFlow(): Flowable<PrivacySettings> {
        return SettingsDataStore.privacySettingsFlow(dataStore)
    }

    fun consentRecordFlow(): Flowable<ConsentRecord> {
        return SettingsDataStore.consentRecordFlow(dataStore)
    }

    fun updateAppSettings(settings: AppSettings): Completable {
        return SettingsDataStore.updateAppSettings(dataStore, settings)
    }

    fun updatePrivacySettings(settings: PrivacySettings): Completable {
        return SettingsDataStore.updatePrivacySettings(dataStore, settings)
    }

    fun updateConsentRecord(record: ConsentRecord): Completable {
        return SettingsDataStore.updateConsentRecord(dataStore, record)
    }
}