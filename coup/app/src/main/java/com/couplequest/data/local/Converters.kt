package com.couplequest.data.local

import androidx.room.TypeConverter
import com.couplequest.data.model.ChallengeCategory
import com.couplequest.data.model.ChallengeType
import com.couplequest.data.model.ConnectionType
import com.couplequest.data.model.Difficulty
import com.couplequest.data.model.GameMode
import com.couplequest.data.model.MessageType
import com.couplequest.data.model.PlayerIdentity
import com.couplequest.data.model.RoomStatus

class Converters {
    @TypeConverter
    fun fromGameMode(value: String): GameMode = GameMode.valueOf(value)

    @TypeConverter
    fun fromGameMode(value: GameMode): String = value.name

    @TypeConverter
    fun fromConnectionType(value: String): ConnectionType = ConnectionType.valueOf(value)

    @TypeConverter
    fun fromConnectionType(value: ConnectionType): String = value.name

    @TypeConverter
    fun fromRoomStatus(value: String): RoomStatus = RoomStatus.valueOf(value)

    @TypeConverter
    fun fromRoomStatus(value: RoomStatus): String = value.name

    @TypeConverter
    fun fromChallengeCategory(value: String): ChallengeCategory = ChallengeCategory.valueOf(value)

    @TypeConverter
    fun fromChallengeCategory(value: ChallengeCategory): String = value.name

    @TypeConverter
    fun fromDifficulty(value: String): Difficulty = Difficulty.valueOf(value)

    @TypeConverter
    fun fromDifficulty(value: Difficulty): String = value.name

    @TypeConverter
    fun fromPlayerIdentity(value: String): PlayerIdentity = PlayerIdentity.valueOf(value)

    @TypeConverter
    fun fromPlayerIdentity(value: PlayerIdentity): String = value.name

    @TypeConverter
    fun fromChallengeType(value: String): ChallengeType = ChallengeType.valueOf(value)

    @TypeConverter
    fun fromChallengeType(value: ChallengeType): String = value.name

    @TypeConverter
    fun fromMessageType(value: String): MessageType = MessageType.valueOf(value)

    @TypeConverter
    fun fromMessageType(value: MessageType): String = value.name
}