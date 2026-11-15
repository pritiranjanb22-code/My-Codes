package com.couplequest.ui.screens

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.assertExists
import androidx.compose.ui.test.assertDoesNotExist
import com.couplequest.data.model.Player
import com.couplequest.ui.theme.CoupleQuestTheme
import org.junit.Rule
import org.junit.Test

class PlayerProfileScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun playerProfileScreenDisplaysCorrectContent() {
        composeRule.setContent {
            CoupleQuestTheme {
                PlayerProfileScreen(
                    playerNumber = 1,
                    totalPlayers = 2,
                    onComplete = {},
                    onBack = {}
                )
            }
        }

        composeRule.onNodeWithText("Player 1 Setup").assertExists()
        composeRule.onNodeWithText("Enter your name and choose your avatar").assertExists()
        composeRule.onNodeWithText("Name").assertExists()
        composeRule.onNodeWithText("Avatar").assertExists()
        composeRule.onNodeWithText("Identity (Optional)").assertExists()
        composeRule.onNodeWithText("Continue").assertExists()
    }

    @Test
    fun playerProfileScreenRequiresName() {
        var completedPlayer: Player? = null

        composeRule.setContent {
            CoupleQuestTheme {
                PlayerProfileScreen(
                    playerNumber = 1,
                    totalPlayers = 2,
                    onComplete = { completedPlayer = it },
                    onBack = {}
                )
            }
        }

        // Try to continue without entering name
        composeRule.onNodeWithText("Continue").performClick()

        // Should not complete (button disabled)
        assertNull(completedPlayer)

        // Enter name
        composeRule.onNodeWithText("Enter name").performTextInput("Alex")

        // Now continue should work
        composeRule.onNodeWithText("Continue").performClick()

        assertNotNull(completedPlayer)
        assertEquals("Alex", completedPlayer?.name)
    }
}