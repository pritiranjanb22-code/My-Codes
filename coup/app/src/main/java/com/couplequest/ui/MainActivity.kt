package com.couplequest.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.material3.Surface
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.couplequest.game.engine.ChatManager
import com.couplequest.game.engine.TurnManager
import com.couplequest.ui.screens.ChatScreen
import com.couplequest.ui.screens.ConnectionMethodScreen
import com.couplequest.ui.screens.CreateRoomScreen
import com.couplequest.ui.screens.GameDashboardScreen
import com.couplequest.ui.screens.GameHistoryScreen
import com.couplequest.ui.screens.GameModeScreen
import com.couplequest.ui.screens.JoinRoomScreen
import com.couplequest.ui.screens.PlayerProfileScreen
import com.couplequest.ui.screens.SettingsScreen
import com.couplequest.ui.screens.SplashScreen
import com.couplequest.ui.screens.WelcomeScreen
import com.couplequest.ui.theme.CoupleQuestTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val turnManager: TurnManager by viewModel()
    private val chatManager: ChatManager by viewModel()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CoupleQuestTheme {
                Surface {
                    val navController = rememberNavController()
                    NavHost(navController, "splash") {
                        composable("splash") {
                            SplashScreen(onComplete = { navController.navigate("welcome") })
                        }
                        composable("welcome") {
                            WelcomeScreen(
                                onGetStarted = { navController.navigate("game_mode") },
                                onSettings = { navController.navigate("settings") }
                            )
                        }
                        composable("game_mode") {
                            GameModeScreen(
                                onGameModeSelected = { mode ->
                                    navController.navigate("player_profile/1?mode=${mode.name}")
                                },
                                onBack = { navController.popBackStack() }
                            )
                        }
                        composable(
                            route = "player_profile/{playerNumber}?mode={gameMode}",
                            arguments = listOf(
                                androidx.navigation.navArgument("playerNumber") { type = androidx.navigation.NavType.IntType },
                                androidx.navigation.navArgument("gameMode") { type = androidx.navigation.NavType.StringType }
                            )
                        ) { backStackEntry ->
                            val playerNumber = backStackEntry.getInt("playerNumber") ?: 1
                            val gameMode = backStackEntry.getString("gameMode") ?: "TRUTH_OR_DARE"
                            PlayerProfileScreen(
                                playerNumber = playerNumber,
                                totalPlayers = 2,
                                onComplete = { player ->
                                    if (playerNumber == 1) {
                                        navController.navigate("player_profile/2?mode=$gameMode")
                                    } else {
                                        navController.navigate("connection_method?mode=$gameMode")
                                    }
                                },
                                onBack = { navController.popBackStack() }
                            )
                        }
                        composable(
                            route = "connection_method?mode={gameMode}",
                            arguments = listOf(androidx.navigation.navArgument("gameMode") { type = androidx.navigation.NavType.StringType })
                        ) { backStackEntry ->
                            val gameMode = backStackEntry.getString("gameMode") ?: "TRUTH_OR_DARE"
                            ConnectionMethodScreen(
                                onConnectionSelected = { connectionType ->
                                    when (connectionType) {
                                        com.couplequest.data.model.ConnectionType.ONE_PHONE -> {
                                            navController.navigate("game_dashboard?mode=$gameMode&connection=ONE_PHONE")
                                        }
                                        com.couplequest.data.model.ConnectionType.SAME_WIFI,
                                        com.couplequest.data.model.ConnectionType.WIFI_DIRECT,
                                        com.couplequest.data.model.ConnectionType.BLUETOOTH -> {
                                            navController.navigate("create_join_room?mode=$gameMode&connection=${connectionType.name}")
                                        }
                                    }
                                },
                                onBack = { navController.popBackStack() },
                                availableTypes = listOf(
                                    com.couplequest.data.model.ConnectionType.ONE_PHONE,
                                    com.couplequest.data.model.ConnectionType.SAME_WIFI,
                                    com.couplequest.data.model.ConnectionType.BLUETOOTH
                                )
                            )
                        }
                        composable(
                            route = "create_join_room?mode={gameMode}&connection={connectionType}",
                            arguments = listOf(
                                androidx.navigation.navArgument("gameMode") { type = androidx.navigation.NavType.StringType },
                                androidx.navigation.navArgument("connectionType") { type = androidx.navigation.NavType.StringType }
                            )
                        ) { backStackEntry ->
                            val gameMode = backStackEntry.getString("gameMode") ?: "TRUTH_OR_DARE"
                            val connectionType = com.couplequest.data.model.ConnectionType.valueOf(
                                backStackEntry.getString("connectionType") ?: "ONE_PHONE"
                            )
                            // In a real app, this would show a choice between create/join
                            CreateRoomScreen(
                                gameMode = gameMode,
                                connectionType = connectionType,
                                onRoomCreated = { room ->
                                    navController.navigate("game_dashboard?mode=$gameMode&connection=${connectionType.name}&roomId=${room.id}")
                                },
                                onBack = { navController.popBackStack() }
                            )
                        }
                        composable(
                            route = "game_dashboard?mode={gameMode}&connection={connectionType}&roomId={roomId}",
                            arguments = listOf(
                                androidx.navigation.navArgument("gameMode") { type = androidx.navigation.NavType.StringType },
                                androidx.navigation.navArgument("connectionType") { type = androidx.navigation.NavType.StringType },
                                androidx.navigation.navArgument("roomId") { type = androidx.navigation.NavType.StringType }
                            )
                        ) { backStackEntry ->
                            val gameMode = backStackEntry.getString("gameMode") ?: "TRUTH_OR_DARE"
                            val connectionType = backStackEntry.getString("connectionType") ?: "ONE_PHONE"
                            val roomId = backStackEntry.getString("roomId") ?: ""
                            
                            GameDashboardScreen(
                                gameState = turnManager.gameState.value,
                                onRevealChallenge = { turnManager.revealChallenge(turnManager.gameState.value.currentTurnPlayerId) },
                                onCompleteChallenge = { turnManager.completeCurrentChallenge() },
                                onSkipChallenge = { turnManager.skipCurrentChallenge() },
                                onRerollChallenge = { turnManager.rerollCurrentChallenge() },
                                onHideChallenge = { turnManager.hideCurrentChallenge() },
                                onOpenChat = { navController.navigate("chat?roomId=$roomId") },
                                onEndGame = { 
                                    turnManager.endGame()
                                    navController.navigate("game_history")
                                }
                            )
                        }
                        composable(
                            route = "chat?roomId={roomId}",
                            arguments = listOf(androidx.navigation.navArgument("roomId") { type = androidx.navigation.NavType.StringType })
                        ) { backStackEntry ->
                            val roomId = backStackEntry.getString("roomId") ?: ""
                            ChatScreen(
                                chatState = chatManager.chatState.value,
                                currentUserId = "1",
                                currentUserName = "Player 1",
                                partnerName = "Player 2",
                                onSendMessage = { text ->
                                    chatManager.sendMessage("1", "Player 1", text)
                                },
                                onCloseChat = { navController.popBackStack() },
                                onClearChat = { chatManager.clearChat() }
                            )
                        }
                        composable("game_history") {
                            GameHistoryScreen(
                                sessions = emptyList(),
                                stats = com.couplequest.data.model.GameStats(
                                    totalSessions = 0,
                                    totalRounds = 0,
                                    totalChallengesCompleted = 0,
                                    totalChallengesSkipped = 0,
                                    favoriteGameMode = null,
                                    longestSessionMinutes = 0,
                                    lastPlayedAt = null
                                ),
                                onSessionClick = {},
                                onClearHistory = {}
                            )
                        }
                        composable("settings") {
                            SettingsScreen(
                                appSettings = com.couplequest.data.model.AppSettings(),
                                privacySettings = com.couplequest.data.model.PrivacySettings(),
                                consentRecord = com.couplequest.data.model.ConsentRecord(),
                                onAppSettingsChange = {},
                                onPrivacySettingsChange = {},
                                onConsentRecordChange = {},
                                onBack = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }
}