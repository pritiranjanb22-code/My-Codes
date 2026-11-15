package com.videoai.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@Entity(tableName = "projects")
data class Project(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val canvas: CanvasConfig = CanvasConfig(),
    val timeline: Timeline = Timeline(),
    val settings: ProjectSettings = ProjectSettings(),
    val version: Int = 1,
    val thumbnailPath: String? = null
) {
    companion object {
        fun create(name: String, canvas: CanvasConfig = CanvasConfig()): Project {
            return Project(
                name = name,
                canvas = canvas,
                timeline = Timeline(tracks = createDefaultTracks())
            )
        }
        
        private fun createDefaultTracks(): List<Track> {
            return listOf(
                Track(id = "video_main", type = TrackType.VIDEO, index = 0, name = "Video 1"),
                Track(id = "video_overlay", type = TrackType.VIDEO, index = 1, name = "Video 2"),
                Track(id = "audio_main", type = TrackType.AUDIO, index = 2, name = "Audio 1"),
                Track(id = "audio_music", type = TrackType.AUDIO, index = 3, name = "Music"),
                Track(id = "audio_sfx", type = TrackType.AUDIO, index = 4, name = "SFX"),
                Track(id = "text_main", type = TrackType.TEXT, index = 5, name = "Text"),
                Track(id = "effect_main", type = TrackType.EFFECT, index = 6, name = "Effects")
            )
        }
    }
}

@Serializable
data class CanvasConfig(
    val width: Int = 1920,
    val height: Int = 1080,
    val aspectRatio: AspectRatio = AspectRatio.RATIO_16_9,
    val fps: Int = 30,
    val backgroundColor: Int = 0xFF000000,
    val safeAreaInsets: SafeAreaInsets = SafeAreaInsets()
) {
    val aspectRatioFloat: Float
        get() = width.toFloat() / height.toFloat()
}

@Serializable
enum class AspectRatio {
    RATIO_16_9(16f/9f),
    RATIO_9_16(9f/16f),
    RATIO_1_1(1f),
    RATIO_4_5(4f/5f),
    RATIO_4_3(4f/3f),
    RATIO_21_9(21f/9f),
    CUSTOM(0f);
    
    val ratio: Float
    
    companion object {
        fun fromDimensions(width: Int, height: Int): AspectRatio {
            val ratio = width.toFloat() / height.toFloat()
            return values().firstOrNull { it.ratio > 0 && abs(it.ratio - ratio) < 0.01 } ?: CUSTOM
        }
    }
}

@Serializable
data class SafeAreaInsets(
    val top: Float = 0f,
    val bottom: Float = 0f,
    val left: Float = 0f,
    val right: Float = 0f
)

@Serializable
data class ProjectSettings(
    val autoSave: Boolean = true,
    val autoSaveInterval: Long = 30000, // 30 seconds
    val proxyQuality: ProxyQuality = ProxyQuality.MEDIUM,
    val defaultTransition: TransitionType = TransitionType.CROSS_DISSOLVE,
    val defaultTransitionDuration: Long = 500000, // 0.5 seconds in microseconds
    val renderQuality: RenderQuality = RenderQuality.HIGH,
    val hardwareAcceleration: Boolean = true,
    val backgroundRender: Boolean = true
)

@Serializable
enum class ProxyQuality {
    LOW(360, 640),
    MEDIUM(480, 854),
    HIGH(720, 1280);
    
    val height: Int
    val width: Int
}

@Serializable
enum class RenderQuality {
    LOW,
    MEDIUM,
    HIGH,
    ULTRA
}