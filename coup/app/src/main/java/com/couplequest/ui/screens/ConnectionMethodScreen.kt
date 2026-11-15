package com.couplequest.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.couplequest.data.model.ConnectionType
import com.couplequest.ui.theme.CoupleQuestColors
import com.couplequest.ui.theme.CoupleQuestTheme
import com.couplequest.ui.theme.Typography

@Composable
fun ConnectionMethodScreen(
    onConnectionSelected: (ConnectionType) -> Unit,
    onBack: () -> Unit,
    availableTypes: List<ConnectionType>
) {
    var selectedType by remember { mutableStateOf<ConnectionType?>(null) }

    val connectionOptions = listOf(
        ConnectionOption(
            type = ConnectionType.ONE_PHONE,
            title = "One Phone (Pass & Play)",
            description = "Both players use the same phone, taking turns",
            icon = Icons.Default.PhoneAndroid,
            color = CoupleQuestColors.Primary,
            isAvailable = availableTypes.contains(ConnectionType.ONE_PHONE),
            features = listOf("No setup required", "Perfect for date night", "Private by default")
        ),
        ConnectionOption(
            type = ConnectionType.SAME_WIFI,
            title = "Same Wi-Fi Network",
            description = "Two phones connected on the same Wi-Fi network",
            icon = Icons.Default.Wifi,
            color = CoupleQuestColors.Secondary,
            isAvailable = availableTypes.contains(ConnectionType.SAME_WIFI),
            features = listOf("Real-time sync", "Private chat", "No internet needed")
        ),
        ConnectionOption(
            type = ConnectionType.BLUETOOTH,
            title = "Bluetooth",
            description = "Direct phone-to-phone connection via Bluetooth",
            icon = Icons.Default.Bluetooth,
            color = CoupleQuestColors.Tertiary,
            isAvailable = availableTypes.contains(ConnectionType.BLUETOOTH),
            features = listOf("Works anywhere", "No Wi-Fi needed", "Secure pairing")
        )
    ).filter { it.isAvailable }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "How to Play Together",
                fontSize = 28.sp,
                fontWeight = FontWeight.Light,
                color = CoupleQuestColors.OnSurface
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
            Text(
                text = "Choose how you want to connect",
                fontSize = 16.sp,
                color = CoupleQuestColors.OnSurfaceVariant,
                textAlign = androidx.compose.ui.text.TextAlign.Center
            )
        }

        // Connection option cards
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 8.dp)
        ) {
            items(connectionOptions) { option ->
                ConnectionOptionCard(
                    option = option,
                    isSelected = selectedType == option.type,
                    onClick = { selectedType = option.type }
                )
            }
        }

        // Continue button
        Button(
            onClick = {
                selectedType?.let { onConnectionSelected(it) }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = selectedType != null,
            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                containerColor = CoupleQuestColors.Primary,
                contentColor = CoupleQuestColors.OnPrimary,
                disabledContainerColor = CoupleQuestColors.OutlineVariant
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
        ) {
            androidx.compose.foundation.layout.Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Continue",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium
                )
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
                Icon(
                    imageVector = Icons.Default.ArrowForward,
                    contentDescription = null,
                    tint = CoupleQuestColors.OnPrimary
                )
            }
        }

        // Back button
        Text(
            text = "Back",
            fontSize = 16.sp,
            color = CoupleQuestColors.Primary,
            fontWeight = FontWeight.Medium,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
                .wrapContentWidth(Alignment.CenterHorizontally)
                .clickable { onBack() }
        )
    }
}

data class ConnectionOption(
    val type: ConnectionType,
    val title: String,
    val description: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val color: Color,
    val isAvailable: Boolean,
    val features: List<String>
)

@Composable
fun ConnectionOptionCard(
    option: ConnectionOption,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 4.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = if (isSelected) option.color.copy(alpha = 0.1f) else CoupleQuestColors.SurfaceContainer
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        border = if (isSelected) androidx.compose.ui.graphics.Stroke(2.dp, option.color) else null
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier.padding(20.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Box(
                modifier = Modifier.size(56.dp),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = option.icon,
                    contentDescription = null,
                    tint = option.color,
                    modifier = Modifier.size(28.dp)
                )
            }

            // Content
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = option.title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    color = CoupleQuestColors.OnSurface
                )

                Text(
                    text = option.description,
                    fontSize = 14.sp,
                    color = CoupleQuestColors.OnSurfaceVariant,
                    maxLines = 2,
                    overflow = androidx.compose.ui.text.TextOverflow.Ellipsis
                )

                // Features
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    option.features.forEach { feature ->
                        androidx.compose.material3.Chip(
                            onClick = { },
                            modifier = Modifier.padding(vertical = 2.dp),
                            colors = androidx.compose.material3.ChipDefaults.chipColors(
                                containerColor = option.color.copy(alpha = 0.1f),
                                contentColor = option.color
                            ),
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = feature,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // Selection indicator
            if (isSelected) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = option.color,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}

@Composable
fun ConnectionMethodScreenPreview() {
    CoupleQuestTheme {
        ConnectionMethodScreen(
            onConnectionSelected = {},
            onBack = {},
            availableTypes = listOf(
                ConnectionType.ONE_PHONE,
                ConnectionType.SAME_WIFI,
                ConnectionType.BLUETOOTH
            )
        )
    }
}