package com.couplequest.ui.screens

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.assertExists
import com.couplequest.ui.theme.CoupleQuestTheme
import org.junit.Rule
import org.junit.Test

class WelcomeScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun welcomeScreenDisplaysCorrectContent() {
        composeRule.setContent {
            CoupleQuestTheme {
                WelcomeScreen(onGetStarted = {}, onSettings = {})
            }
        }

        composeRule.onNodeWithText("Welcome to Couple Quest").assertExists()
        composeRule.onNodeWithText("Playful games, intimate challenges, and meaningful conversations to strengthen your relationship.").assertExists()
        composeRule.onNodeWithText("Start Playing").assertExists()
        composeRule.onNodeWithText("Settings & Privacy").assertExists()
    }

    @Test
    fun welcomeScreenButtonsAreClickable() {
        var getStartedClicked = false
        var settingsClicked = false

        composeRule.setContent {
            CoupleQuestTheme {
                WelcomeScreen(
                    onGetStarted = { getStartedClicked = true },
                    onSettings = { settingsClicked = true }
                )
            }
        }

        composeRule.onNodeWithText("Start Playing").performClick()
        assertTrue(getStartedClicked)

        composeRule.onNodeWithText("Settings & Privacy").performClick()
        assertTrue(settingsClicked)
    }
}