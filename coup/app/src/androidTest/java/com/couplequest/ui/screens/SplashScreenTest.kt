package com.couplequest.ui.screens

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.assertExists
import androidx.compose.ui.test.assertDoesNotExist
import com.couplequest.ui.theme.CoupleQuestTheme
import org.junit.Rule
import org.junit.Test

class SplashScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun splashScreenDisplaysLogoAndTitle() {
        composeRule.setContent {
            CoupleQuestTheme {
                SplashScreen(onComplete = {})
            }
        }

        composeRule.onNodeWithText("Couple Quest").assertExists()
        composeRule.onNodeWithText("Strengthen your bond through play").assertExists()
    }
}