package com.videoai.ui.media

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun MediaScreen(onProjectCreate: (com.videoai.data.model.Project) -> Unit) {
    var selectedTab by remember { mutableStateOf(MediaTab.Videos) }
    
    TopAppBar(
        title = { Text("Media Library", fontWeight = FontWeight.Bold) },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        ),
        actions = {
            Button(onClick = { /* Import media */ }) {
                Icon(androidx.compose.material.icons.filedownload, contentDescription = "Import")
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.foundation.layout.width(8.dp))
                Text("Import")
            }
        }
    )
    
    Column(modifier = Modifier.fillMaxSize()) {
        // Tab row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant)
        ) {
            MediaTab.values().forEach { tab ->
                val selected = selectedTab == tab
                androidx.compose.material3.Text(
                    text = tab.label,
                    modifier = Modifier
                        .fillMaxWidth()
                        .fillMaxHeight()
                        .padding(16.dp)
                        .background(if (selected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent)
                        .clickable { selectedTab = tab },
                    textAlign = androidx.compose.ui.text.TextAlign.Center,
                    color = if (selected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                )
            }
        }
        
        // Media grid
        Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp),
                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(20) { index -> // Placeholder items
                    MediaItem(
                        name = "Video ${index + 1}",
                        duration = "00:30",
                        thumbnail = null,
                        onClick = { /* Select media */ }
                    )
                }
            }
        }
    }
}

@Composable
fun MediaItem(
    name: String,
    duration: String,
    thumbnail: Any?,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(120.dp)
            .clickable { onClick() },
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            // Thumbnail placeholder
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.DarkGray)
            ) {
                Text("📹", fontSize = 32.sp, color = Color.White)
            }
            
            // Duration overlay
            Box(
                modifier = Modifier
                    .align(androidx.compose.ui.Alignment.BottomEnd)
                    .padding(8.dp)
                    .background(Color.Black.copy(alpha = 0.7f))
            ) {
                Text(duration, color = Color.White, fontSize = 12.sp)
            }
            
            // Name
            Box(
                modifier = Modifier
                    .align(androidx.compose.ui.Alignment.BottomStart)
                    .padding(8.dp)
                    .fillMaxWidth()
            ) {
                Text(
                    name,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.TextOverflow.Ellipsis,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

enum class MediaTab(val label: String) {
    Videos("Videos"),
    Images("Images"),
    Audio("Audio"),
    All("All")
}