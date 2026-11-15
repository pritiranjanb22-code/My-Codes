package com.videoai.ui.export

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

@Composable
fun ExportScreen(project: com.videoai.data.model.Project?) {
    var selectedPreset by remember { mutableStateOf(ExportPreset.InstagramReel) }
    var isExporting by remember { mutableStateOf(false) }
    var progress by remember { mutableStateOf(0f) }
    
    TopAppBar(
        title = { Text("Export Video", fontWeight = FontWeight.Bold) },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
    
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Preset selector
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Export Preset", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(16.dp))
                
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    ExportPreset.values().forEach { preset ->
                        val selected = selectedPreset == preset
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp)
                                .background(if (selected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent)
                                .clickable { selectedPreset = preset },
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(preset.name, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal)
                                Text(preset.description, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            if (selected) {
                                Icon(androidx.compose.material.icons.filled.CheckCircle, contentDescription = "Selected", tint = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                }
            }
        }
        
        // Custom settings (expandable)
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Custom Settings", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(16.dp))
                
                // Resolution, FPS, Bitrate, Codec would go here
                Text("Custom settings coming soon...", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        
        // Export queue
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Export Queue", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("0 pending", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(16.dp))
                
                Text("No exports in queue", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        
        // Export button
        if (!isExporting) {
            Button(
                onClick = { startExport() },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Text("Start Export", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        } else {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = androidx.compose.material3.CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Exporting...", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                        Text("${(progress * 100).toInt()}%", color = MaterialTheme.colorScheme.onPrimaryContainer)
                    }
                    androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(8.dp))
                    androidx.compose.material3.LinearProgressIndicator(progress = progress)
                    androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.height(8.dp))
                    Button(onClick = { /* Cancel export */ }) {
                        Text("Cancel")
                    }
                }
            }
        }
    }
    
    fun startExport() {
        isExporting = true
        progress = 0f
        // Start export service
    }
}

enum class ExportPreset(val name: String, val description: String) {
    InstagramReel("Instagram Reel", "1080x1920, 30fps, H.264"),
    TikTok("TikTok", "1080x1920, 30fps, H.264"),
    YouTubeShorts("YouTube Shorts", "1080x1920, 60fps, H.264"),
    YouTube1080p("YouTube 1080p", "1920x1080, 30fps, H.264"),
    YouTube4K("YouTube 4K", "3840x2160, 30fps, H.265"),
    Custom("Custom", "Custom resolution and settings")
}