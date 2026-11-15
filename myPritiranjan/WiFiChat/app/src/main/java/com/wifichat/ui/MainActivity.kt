package com.wifichat.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.wifichat.data.model.User
import com.wifichat.ui.chat.ChatListScreen
import com.wifichat.ui.call.CallScreen
import com.wifichat.ui.contacts.ContactsScreen
import com.wifichat.ui.settings.SettingsScreen
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject
    lateinit var userRepository: com.wifichat.data.repository.UserRepository
    
    private val viewModel: MainViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = androidx.compose.ui.Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainNavigation(
                        currentScreen = viewModel.currentScreen,
                        onNavigate = viewModel::navigate,
                        currentUser = viewModel.currentUser
                    )
                }
            }
        }
    }
}

@dagger.hilt.android.lifecycle.HiltViewModel
class MainViewModel @Inject constructor(
    private val userRepository: com.wifichat.data.repository.UserRepository
) : ViewModel() {
    
    var currentScreen by mutableStateOf<Screen>(Screen.Chat)
        private set
    
    var currentUser by mutableStateOf<User?>(null)
        private set
    
    enum class Screen {
        Chat, Contacts, Calls, Settings
    }
    
    fun navigate(screen: Screen) {
        currentScreen = screen
    }
    
    fun setCurrentUser(user: User) {
        currentUser = user
    }
    
    init {
        // Load current user
        // This would load from preferences
    }
}

@Composable
fun MainNavigation(
    currentScreen: MainViewModel.Screen,
    onNavigate: (MainViewModel.Screen) -> Unit,
    currentUser: User?
) {
    androidx.compose.material3.NavigationBar {
        val screens = listOf(
            MainViewModel.Screen.Chat to "Chats" to androidx.compose.material.icons.filled.Chat,
            MainViewModel.Screen.Contacts to "Contacts" to androidx.compose.material.icons.filled.Person,
            MainViewModel.Screen.Calls to "Calls" to androidx.compose.material.icons.filled.Call,
            MainViewModel.Screen.Settings to "Settings" to androidx.compose.material.icons.filled.Settings
        )
        
        screens.forEach { (screen, label, icon) ->
            val selected = currentScreen == screen
            androidx.compose.material3.NavigationBarItem(
                icon = { androidx.compose.material.Icon(icon, contentDescription = label) },
                label = { androidx.compose.material3.Text(label) },
                selected = selected,
                onClick = { onNavigate(screen) },
                colors = androidx.compose.material3.NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    }
    
    when (currentScreen) {
        MainViewModel.Screen.Chat -> ChatListScreen(currentUser = currentUser)
        MainViewModel.Screen.Contacts -> ContactsScreen()
        MainViewModel.Screen.Calls -> CallScreen()
        MainViewModel.Screen.Settings -> SettingsScreen()
    }
}