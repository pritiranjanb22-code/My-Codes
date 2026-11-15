package com.videoai.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@Entity(tableName = "media")
data class Media(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val uri: String,
    val type: MediaType,
    val name: String,
    val displayName: String,
    val width: Int = 0,
    val height: Int = 0,
    val duration: Long = 0, // microseconds
    val fps: Float = 30f,
    val hasAudio: Boolean = false,
    val audioChannels: Int = 0,
    val audioSampleRate: Int = 0,
    val fileSize: Long = 0,
    val mimeType: String = "",
    val dateAdded: Long = System.currentTimeMillis(),
    val dateModified: Long = 0,
    val metadata: Map<String, String> = emptyMap(),
    val thumbnailPath: String? = null,
    val proxyPath: String? = null,
    val waveformPath: String? = null,
    val analysisPath: String? = null,
    val tags: List<String> = emptyList(),
    val isFavorite: Boolean = false,
    val folder: String? = null
) {
    val aspectRatio: Float
        get() = if (height > 0) width.toFloat() / height else 1f
    
    val aspectRatioEnum: AspectRatio
        get() = AspectRatio.fromDimensions(width, height)
    
    val isVideo: Boolean = type == MediaType.VIDEO
    val isImage: Boolean = type == MediaType.IMAGE
    val isAudio: Boolean = type == MediaType.AUDIO
    
    val durationFormatted: String
        get() = formatDuration(duration)
    
    val fileSizeFormatted: String
        get() = formatFileSize(fileSize)
    
    companion object {
        fun fromUri(uri: String, type: MediaType): Media {
            val name = uri.substringAfterLast("/").substringBeforeLast(".")
            return Media(
                uri = uri,
                type = type,
                name = name,
                displayName = name
            )
        }
        
        private fun formatDuration(us: Long): String {
            val totalSeconds = us / 1_000_000
            val hours = totalSeconds / 3600
            val minutes = (totalSeconds % 3600) / 60
            val seconds = totalSeconds % 60
            return if (hours > 0) "%02d:%02d:%02d".format(hours, minutes, seconds)
            else "%02d:%02d".format(minutes, seconds)
        }
        
        private fun formatFileSize(bytes: Long): String {
            return when {
                bytes < 1024 -> "$bytes B"
                bytes < 1024 * 1024 -> "%.1f KB".format(bytes / 1024.0)
                bytes < 1024 * 1024 * 1024 -> "%.1f MB".format(bytes / (1024.0 * 1024))
                else -> "%.1f GB".format(bytes / (1024.0 * 1024 * 1024))
            }
        }
    }
}

@Serializable
enum class MediaType {
    VIDEO,
    IMAGE,
    AUDIO
}

@Serializable
data class MediaMetadata(
    val codec: String? = null,
    val bitrate: Long = 0,
    val colorSpace: String? = null,
    val colorTransfer: String? = null,
    val colorPrimaries: String? = null,
    val hdrFormat: HdrFormat? = null,
    val rotation: Int = 0,
    val hasAlpha: Boolean = false,
    val audioCodec: String? = null,
    val audioBitrate: Long = 0,
    val chapters: List<Chapter> = emptyList(),
    val streams: List<StreamInfo> = emptyList()
)

@Serializable
enum class HdrFormat {
    NONE,
    HDR10,
    HDR10_PLUS,
    DOLBY_VISION,
    HLG
}

@Serializable
data class Chapter(
    val startTime: Long,
    val endTime: Long,
    val title: String
)

@Serializable
data class StreamInfo(
    val index: Int,
    val type: StreamType,
    val codec: String,
    val width: Int? = null,
    val height: Int? = null,
    val fps: Float? = null,
    val channels: Int? = null,
    val sampleRate: Int? = null,
    val language: String? = null,
    val bitrate: Long = 0,
    val disposition: Map<String, Boolean> = emptyMap()
)

@Serializable
enum class StreamType {
    VIDEO,
    AUDIO,
    SUBTITLE,
    DATA,
    ATTACHMENT
}

@Serializable
data class MediaSummary(
    val id: String,
    val name: String,
    val displayName: String,
    val type: MediaType,
    val duration: Long,
    val width: Int,
    val height: Int,
    val thumbnailPath: String?,
    val dateAdded: Long,
    val folder: String?
)