package com.wifichat.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@Entity(tableName = "users")
data class User(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val publicKey: String, // For encryption
    val deviceId: String,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val isOnline: Boolean = false,
    val lastSeen: Long = 0,
    val status: UserStatus = UserStatus.AVAILABLE
) {
    companion object {
        fun createLocal(username: String, displayName: String, deviceId: String, keyPair: KeyPair): User {
            return User(
                username = username,
                displayName = displayName,
                publicKey = keyPair.publicKey,
                deviceId = deviceId
            )
        }
    }
}

@Serializable
data class KeyPair(
    val publicKey: String,
    val privateKey: String
)

@Serializable
enum class UserStatus {
    AVAILABLE,
    BUSY,
    AWAY,
    OFFLINE,
    IN_CALL
}

@Serializable
@Entity(tableName = "contacts")
data class Contact(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val userId: String, // Remote user's ID
    val localName: String? = null, // Custom name for this contact
    val addedAt: Long = System.currentTimeMillis(),
    val isFavorite: Boolean = false,
    val isBlocked: Boolean = false
)

@Serializable
data class PeerInfo(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val ipAddress: String,
    val port: Int,
    val publicKey: String,
    val capabilities: PeerCapabilities = PeerCapabilities(),
    val discoveredAt: Long = System.currentTimeMillis()
)

@Serializable
data class PeerCapabilities(
    val supportsVideo: Boolean = true,
    val supportsAudio: Boolean = true,
    val supportsFileTransfer: Boolean = true,
    val maxVideoResolution: String = "1080p",
    val supportedCodecs: List<String> = listOf("VP8", "VP9", "H264")
)