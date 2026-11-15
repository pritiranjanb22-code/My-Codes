package com.couplequest.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.couplequest.data.model.AppSettings
import com.couplequest.data.model.ConsentRecord
import com.couplequest.data.model.PrivacySettings
import com.couplequest.data.repository.SettingsRepository
import com.couplequest.game.engine.ChatManager
import com.couplequest.game.engine.TurnManager
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _appSettings = MutableStateFlow<AppSettings>(AppSettings())
    val appSettings: StateFlow<AppSettings> = _appSettings

    private val _privacySettings = MutableStateFlow<PrivacySettings>(PrivacySettings())
    val privacySettings: StateFlow<PrivacySettings> = _privacySettings

    private val _consentRecord = MutableStateFlow<ConsentRecord>(ConsentRecord())
    val consentRecord: StateFlow<ConsentRecord> = _consentRecord

    init {
        loadSettings()
    }

    private fun loadSettings() {
        viewModelScope.launch {
            settingsRepository.appSettingsFlow()
                .subscribe { settings ->
                    _appSettings.value = settings
                }

            settingsRepository.privacySettingsFlow()
                .subscribe { settings ->
                    _privacySettings.value = settings
                }

            settingsRepository.consentRecordFlow()
                .subscribe { record ->
                    _consentRecord.value = record
                }
        }
    }

    fun updateAppSettings(settings: AppSettings) {
        _appSettings.value = settings
        viewModelScope.launch {
            settingsRepository.updateAppSettings(settings).subscribe()
        }
    }

    fun updatePrivacySettings(settings: PrivacySettings) {
        _privacySettings.value = settings
        viewModelScope.launch {
            settingsRepository.updatePrivacySettings(settings).subscribe()
        }
    }

    fun updateConsentRecord(record: ConsentRecord) {
        _consentRecord.value = record
        viewModelScope.launch {
            settingsRepository.updateConsentRecord(record).subscribe()
        }
    }

    fun giveAdultContentConsent() {
        val newRecord = ConsentRecord(
            hasConsentedToAdultContent = true,
            consentDate = System.currentTimeMillis(),
            consentVersion = "1.0",
            ageVerified = true
        )
        updateConsentRecord(newRecord)
        updateAppSettings(_appSettings.value.copy(
            isAdultContentEnabled = true,
            adultContentConsentGiven = true,
            adultContentConsentDate = System.currentTimeMillis()
        ))
    }
}

@HiltViewModel
class GameViewModel @Inject constructor(
    private val turnManager: TurnManager,
    private val chatManager: ChatManager
) : ViewModel() {

    val gameState = turnManager.gameState
    val chatState = chatManager.chatState

    fun initializeGame(
        room: com.couplequest.data.model.GameRoom,
        player1: com.couplequest.data.model.Player,
        player2: com.couplequest.data.model.Player,
        isAdultContentEnabled: Boolean
    ) {
        turnManager.initialize(room, player1, player2, isAdultContentEnabled)
        chatManager.initialize(room.id)
    }

    fun startGame() {
        turnManager.startGame()
    }

    fun revealChallenge(playerId: String) {
        turnManager.revealChallenge(playerId)
    }

    fun completeChallenge() {
        turnManager.completeCurrentChallenge()
    }

    fun skipChallenge() {
        turnManager.skipCurrentChallenge()
    }

    fun rerollChallenge() {
        turnManager.rerollCurrentChallenge()
    }

    fun hideChallenge() {
        turnManager.hideCurrentChallenge()
    }

    fun nextTurn() {
        turnManager.nextTurn()
    }

    fun endGame() {
        turnManager.endGame()
        chatManager.endChat()
    }

    fun sendChatMessage(senderId: String, senderName: String, content: String) {
        chatManager.sendMessage(senderId, senderName, content)
    }

    fun receiveChatMessage(message: com.couplequest.data.model.ChatMessage) {
        chatManager.receiveMessage(message)
    }
}