package com.couplequest.data.model

import androidx.annotation.Keep
import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Keep
@Serializable
@Entity(tableName = "players")
data class Player(
    @PrimaryKey val id: String = java.util.UUID.randomUUID().toString(),
    val name: String = "",
    val avatarId: String = "default",
    val isPlayer1: Boolean = false,
    val identity: PlayerIdentity = PlayerIdentity.UNSPECIFIED,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
enum class PlayerIdentity {
    UNSPECIFIED,
    MALE,
    FEMALE,
    NON_BINARY,
    PREFER_NOT_TO_SAY,
    CUSTOM
}

@Serializable
data class PlayerProfile(
    val player: Player,
    val partnerName: String? = null,
    val partnerAvatarId: String? = null
)