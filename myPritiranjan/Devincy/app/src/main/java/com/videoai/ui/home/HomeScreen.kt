package com.videoai.ui.home

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp
import com.videoai.mcp.auth.AuthManager
import com.videoai.util.QrCodeGenerator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    authManager: AuthManager,
    onProjectClick: (com.videoai.data.model.Project) -> Unit
) {
    var qrCode by remember { mutableStateOf<Bitmap?>(null) }
    var serverInfo by remember { mutableStateOf<ServerInfo?>(null) }
    var isServerRunning by remember { mutableStateOf(false) }
    var recentProjects by remember { mutableStateOf<List<com.videoai.data.model.Project>>(emptyList()) }
    
    androidx.compose.runtime.LaunchedEffect(Unit) {
        loadServerInfo()
        generateQrCode()
    }
    
    fun loadServerInfo() {
        // Would get from MCP server
        serverInfo = ServerInfo(
            host = "videoai-phone.local",
            port = authManager.getPort(),
            token = authManager.getOrCreateToken()
        )
        isServerRunning = true
    }
    
    fun generateQrCode() {
        CoroutineScope(Dispatchers.IO).launch {
            val generator = QrCodeGenerator(authManager)
            val bitmap = generator.generateConnectionQrCode(512)
            androidx.compose.runtime.Snapshot.sendApplyNotifications()
            qrCode = bitmap
        }
    }
    
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TopAppBar(
            title = { Text("VideoAI", fontWeight = FontWeight.Bold) },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.surface,
                titleContentColor = MaterialTheme.colorScheme.onSurface
            )
        )
        
        // Server Status Card
        Card(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (isServerRunning) 
                    MaterialTheme.colorScheme.primaryContainer 
                else 
                    MaterialTheme.colorScheme.errorContainer
            )
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (isServerRunning) "MCP Server Running" else "MCP Server Stopped",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        serverInfo?.let { info ->
                            Text(
                                text = "ws://${info.host}:${info.port}/mcp",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Button(onClick = { /* Toggle server */ }) {
                        Text(if (isServerRunning) "Stop" else "Start")
                    }
                }
            }
        }
        
        // QR Code Card
        Card(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Connect from Laptop", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.height(16.dp))
                
                qrCode?.let { bitmap ->
                    Box(
                        modifier = Modifier
                            .size(256.dp)
                            .background(Color.White)
                    ) {
                        Image(
                            bitmap = bitmap.asImageBitmap(),
                            contentDescription = "QR Code for connection",
                            contentScale = ContentScale.Fit
                        )
                    }
                }
                
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    "Scan with Claude/OpenCode to connect",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                serverInfo?.let { info ->
                    Text(
                        "Token: ${info.token}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontFamily = "monospace"
                    )
                }
            }
        }
        
        // Quick Actions
        Card(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Quick Actions", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ActionButton("New Project", androidx.compose.material.icons.filled.Add) { 
                        // Create new project
                    }
                    ActionButton("Import Media", androidx.compose.material.icons.filedownload) { 
                        // Navigate to media
                    }
                    ActionButton("Recent Projects", androidx.compose.material.icons.filled.History) { 
                        // Navigate to projects
                    }
                }
            }
        }
        
        // Recent Projects
        if (recentProjects.isNotEmpty()) {
            Card(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Recent Projects", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.height(16.dp))
                    
                    Column {
                        recentProjects.take(5).forEach { project ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp)
                                    .clickable { onProjectClick(project) }
                                    .background(MaterialTheme.colorScheme.surface),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(project.name, fontWeight = FontWeight.Medium)
                                    Text("Modified: ${formatTime(project.updatedAt)}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Icon(androidx.compose.material.icons.filled.ChevronRight, contentDescription = "Open")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ActionButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier.weight(1f).height(48.dp),
        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null)
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(8.dp))
            Text(label, fontSize = 14.sp)
        }
    }
}

private fun formatTime(timestamp: Long): String {
    val date = java.util.Date(timestamp)
    return java.text.SimpleDateFormat("MMM dd, HH:mm").format(date)
}

data class ServerInfo(
    val host: String,
    val port: Int,
    val token: String
)