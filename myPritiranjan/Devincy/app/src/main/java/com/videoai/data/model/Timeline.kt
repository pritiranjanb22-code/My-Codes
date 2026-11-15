package com.videoai.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@Entity(tableName = "timelines")
data class Timeline(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val tracks: List<Track> = emptyList(),
    val duration: Long = 0, // microseconds
    val playbackSpeed: Float = 1.0f,
    val markers: List<Marker> = emptyList(),
    val selection: Selection? = null
) {
    fun getTrack(trackId: String): Track? = tracks.find { it.id == trackId }
    
    fun getClipsAtTime(timeUs: Long): List<Clip> {
        return tracks.flatMap { it.clips }.filter { clip ->
            clip.startTime <= timeUs && timeUs < clip.startTime + clip.duration
        }
    }
    
    fun getTotalDuration(): Long {
        return tracks.flatMap { it.clips }
            .map { it.startTime + it.duration }
            .maxOrNull() ?: 0
    }
}

@Serializable
@Entity(tableName = "tracks")
data class Track(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val type: TrackType,
    val index: Int,
    val name: String = "",
    val clips: List<Clip> = emptyList(),
    val isEnabled: Boolean = true,
    val isLocked: Boolean = false,
    val isMuted: Boolean = false,
    val volume: Float = 1.0f,
    val color: Int = 0xFFBB86FC
) {
    fun addClip(clip: Clip): Track {
        val newClips = (clips + clip).sortedBy { it.startTime }
        return copy(clips = newClips)
    }
    
    fun removeClip(clipId: String): Track {
        return copy(clips = clips.filter { it.id != clipId })
    }
    
    fun updateClip(updatedClip: Clip): Track {
        return copy(clips = clips.map { if (it.id == updatedClip.id) updatedClip else it })
    }
}

@Serializable
enum class TrackType {
    VIDEO(0),
    AUDIO(1),
    TEXT(2),
    EFFECT(3),
    OVERLAY(4);
    
    val priority: Int
    
    companion object {
        fun fromString(str: String): TrackType = values().firstOrNull { it.name.equals(str, ignoreCase = true) } ?: VIDEO
    }
}

@Serializable
data class Selection(
    val clipIds: List<String> = emptyList(),
    val trackIds: List<String> = emptyList(),
    val timeRange: TimeRange? = null
)

@Serializable
data class TimeRange(
    val start: Long,
    val end: Long
) {
    val duration: Long
        get() = end - start
    
    fun contains(time: Long): Boolean = start <= time && time < end
    
    fun intersects(other: TimeRange): Boolean =
        start < other.end && other.start < end
}