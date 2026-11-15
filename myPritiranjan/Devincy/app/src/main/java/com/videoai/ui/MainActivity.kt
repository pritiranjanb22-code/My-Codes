package com.videoai.ui

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
import com.videoai.data.model.Project
import com.videoai.mcp.auth.AuthManager
import com.videoai.ui.home.HomeScreen
import com.videoai.ui.editor.EditorScreen
import com.videoai.ui.media.MediaScreen
import com.videoai.ui.export.ExportScreen
import com.videoai.ui.settings.SettingsScreen
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject
    lateinit var authManager: AuthManager
    
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
                        authManager = authManager
                    )
                }
            }
        }
    }
}

@dagger.hilt.android.lifecycle.HiltViewModel
class MainViewModel @Inject constructor(
    private val projectRepository: com.videoai.data.repository.ProjectRepository,
    private val mediaRepository: com.videoai.data.repository.MediaRepository
) : ViewModel() {
    
    var currentScreen by mutableStateOf<Screen>(Screen.Home)
        private set
    
    var currentProject by mutableStateOf<Project?>(null)
        private set
    
    enum class Screen {
        Home, Editor, Media, Export, Settings
    }
    
    fun navigate(screen: Screen) {
        currentScreen = screen
    }
    
    fun openProject(project: Project) {
        currentProject = project
        currentScreen = Screen.Editor
    }
    
    fun closeProject() {
        currentProject = null
        currentScreen = Screen.Home
    }
}

@Composable
fun MainNavigation(
    currentScreen: MainViewModel.Screen,
    onNavigate: (MainViewModel.Screen) -> Unit,
    authManager: AuthManager
) {
    androidx.compose.material3.NavigationBar {
        val screens = listOf(
            Screen.Home to "Home" to androidx.compose.material.icons.filled.Home,
            Screen.Media to "Media" to androidx.compose.material.icons.filled.PhotoLibrary,
            Screen.Export to "Export" to androidx.compose.material.icons.filedownload,
            Screen.Settings to "Settings" to androidx.compose.material.icons.filled.Settings
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
    
    // Screen content
    when (currentScreen) {
        MainViewModel.Screen.Home -> HomeScreen(authManager = authManager, onProjectClick = viewModel::openProject)
        MainViewModel.Screen.Editor -> EditorScreen(project = viewModel.currentProject)
        MainViewModel.Screen.Media -> MediaScreen(onProjectCreate = viewModel::openProject)
        MainViewModel.Screen.Export -> ExportScreen(project = viewModel.currentProject)
        MainViewModel.Screen.Settings -> SettingsScreen(authManager = authManager)
    }
}