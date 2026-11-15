package com.videoai.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.videoai.mcp.auth.AuthManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(authManager: AuthManager) {
    var port by remember { mutableStateOf(authManager.getPort()) }
    var automationMode by remember { mutableStateOf(authManager.isAutomationMode()) }
    var proxyQuality by remember { mutableStateOf("Medium") }
    var showToken by remember { mutableStateOf(false) }
    var token by remember { mutableStateOf("") }
    
    TopAppBar(
        title = { Text("Settings", fontWeight = FontWeight.Bold) },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
    
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Server Settings
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Server Settings", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Port")
                        Text("Server port for MCP connections", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    androidx.compose.material3.TextField(
                        value = port.toString(),
                        onValueChange = { port = it.toIntOrNull() ?: 8765 },
                        modifier = Modifier.width(120.dp),
                        singleLine = true,
                        keyboardOptions = androidx.compose.ui.text.input.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Number)
                    )
                }
                
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Automation Mode")
                        Text("Allow destructive operations without confirmation", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Switch(
                        checked = automationMode,
                        onCheckedChange = { automationMode = it; authManager.setAutomationMode(it) }
                    )
                }
                
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Auth Token")
                        Text("Token for MCP client authentication", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Button(onClick = { showToken = !showToken }) {
                        Text(if (showToken) "Hide" else "Show")
                    }
                }
                
                if (showToken) {
                    androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        androidx.compose.material3.TextField(
                            value = token.isBlank() ? authManager.getOrCreateToken() : token,
                            onValueChange = { token = it },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            readOnly = true
                        )
                        Button(onClick = {
                            // Copy to clipboard
                        }) {
                            Text("Copy")
                        }
                    }
                    
                    androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(8.dp))
                    
                    Button(onClick = { regenerateToken() }) {
                        Text("Regenerate Token")
                    }
                }
            }
        }
        
        // Proxy Settings
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Proxy Settings", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Proxy Quality")
                        Text("Lower quality = faster timeline scrubbing", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    androidx.compose.material3.DropdownMenu(
                        expanded = true, // Would use proper dropdown state
                        onDismissRequest = {},
                        modifier = Modifier.width(150.dp)
                    ) {
                        listOf("Low (360p)", "Medium (480p)", "High (720p)").forEach { quality ->
                            androidx.compose.material3.DropdownMenuItem(
                                text = { Text(quality) },
                                onClick = { proxyQuality = quality }
                            )
                        }
                    }
                }
            }
        }
        
        // AI Providers
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("AI Providers", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(16.dp))
                
                AiProviderRow("Local (MediaPipe/ML Kit)", "On-device analysis", true)
                AiProviderRow("Ollama (Local LLM)", "Requires Ollama server", false)
                AiProviderRow("Cloud API", "OpenAI/Anthropic compatible", false)
            }
        }
        
        // Storage
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Storage", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Cache Size")
                        Text("~2.5 GB", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(8.dp))
                
                Button(onClick = { /* Clear cache */ }) {
                    Text("Clear Cache")
                }
            }
        }
        
        // About
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("About", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Version")
                    Text("1.0.0")
                }
                
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(8.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("License")
                    Text("GPL-3.0 (FFmpeg)")
                }
            }
        }
    }
    
    fun regenerateToken() {
        CoroutineScope(Dispatchers.IO).launch {
            val newToken = authManager.regenerateToken()
            token = newToken
        }
    }
}

@Composable
fun AiProviderRow(name: String, description: String, enabled: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(name, fontWeight = FontWeight.Medium)
            Text(description, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(
            checked = enabled,
            onCheckedChange = { /* Toggle provider */ }
        )
    }
}