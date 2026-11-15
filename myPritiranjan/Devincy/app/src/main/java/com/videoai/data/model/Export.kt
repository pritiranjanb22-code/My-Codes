package com.videoai.data.model

import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class ExportSettings(
    val width: Int = 1920,
    val height: Int = 1080,
    val fps: Int = 30,
    val videoCodec: VideoCodec = VideoCodec.H264,
    val videoBitrate: Long = 10_000_000, // 10 Mbps
    val videoBitrateMode: BitrateMode = BitrateMode.CBR,
    val profile: VideoProfile = VideoProfile.HIGH,
    val level: String = "4.1",
    val preset: EncodingPreset = EncodingPreset.MEDIUM,
    val audioCodec: AudioCodec = AudioCodec.AAC,
    val audioBitrate: Long = 256_000, // 256 kbps
    val audioSampleRate: Int = 48000,
    val audioChannels: Int = 2,
    val container: ContainerFormat = ContainerFormat.MP4,
    val colorRange: ColorRange = ColorRange.LIMITED,
    val colorSpace: ColorSpace = ColorSpace.BT709,
    val hdrMetadata: HdrMetadata? = null,
    val fastStart: Boolean = true,
    val hardwareAcceleration: Boolean = true,
    val threads: Int = 0 // 0 = auto
)

@Serializable
enum class VideoCodec {
    H264("libx264", "H.264"),
    H265("libx265", "H.265/HEVC"),
    VP9("libvpx-vp9", "VP9"),
    AV1("libaom-av1", "AV1"),
    PRORES("prores_ks", "ProRes"),
    PRORES_KS("prores_ks", "ProRes KS");
    
    val ffmpegName: String
    val displayName: String
}

@Serializable
enum class AudioCodec {
    AAC("aac", "AAC"),
    MP3("libmp3lame", "MP3"),
    OPUS("libopus", "Opus"),
    FLAC("flac", "FLAC"),
    PCM("pcm_s16le", "PCM");
    
    val ffmpegName: String
    val displayName: String
}

@Serializable
enum class ContainerFormat {
    MP4("mp4", "MP4"),
    MOV("mov", "MOV"),
    MKV("matroska", "MKV"),
    WEBM("webm", "WebM"),
    TS("mpegts", "MPEG-TS");
    
    val ffmpegName: String
    val displayName: String
}

@Serializable
enum class BitrateMode {
    CBR,
    VBR,
    CQP,
    CRF
}

@Serializable
enum class VideoProfile {
    BASELINE,
    MAIN,
    HIGH,
    HIGH_10,
    HIGH_422,
    HIGH_444
}

@Serializable
enum class EncodingPreset {
    ULTRAFAST,
    SUPERFAST,
    VERYFAST,
    FASTER,
    FAST,
    MEDIUM,
    SLOW,
    SLOWER,
    VERYSLOW,
    PLACEBO
}

@Serializable
enum class ColorRange {
    LIMITED,
    FULL
}

@Serializable
enum class ColorSpace {
    BT709,
    BT601,
    BT2020,
    SRGB,
    DCI_P3
}

@Serializable
data class HdrMetadata(
    val maxCLL: Int = 0,
    val maxFALL: Int = 0,
    val masteringDisplay: MasteringDisplay? = null,
    val contentLightLevel: ContentLightLevel? = null
)

@Serializable
data class MasteringDisplay(
    val primaries: List<Float> = emptyList(), // 6 values: R,G,B x,y
    val whitePoint: List<Float> = emptyList(), // 2 values: x,y
    val maxLuminance: Int = 1000,
    val minLuminance: Int = 0
)

@Serializable
data class ContentLightLevel(
    val maxContentLightLevel: Int = 1000,
    val maxPicAverageLightLevel: Int = 400
)

@Serializable
data class ExportPreset(
    val id: String,
    val name: String,
    val description: String,
    val settings: ExportSettings,
    val thumbnail: String? = null,
    val platform: Platform? = null
)

@Serializable
enum class Platform {
    INSTAGRAM_REEL,
    TIKTOK,
    YOUTUBE_SHORTS,
    YOUTUBE,
    FACEBOOK_REEL,
    TWITTER,
    LINKEDIN,
    GENERIC
}

@Serializable
data class ExportJob(
    val id: String = UUID.randomUUID().toString(),
    val projectId: String,
    val settings: ExportSettings,
    val outputPath: String,
    val status: ExportStatus = ExportStatus.PENDING,
    val progress: Float = 0f,
    val currentStage: String = "",
    val startedAt: Long = System.currentTimeMillis(),
    val completedAt: Long = 0,
    val error: String? = null,
    val outputFileSize: Long = 0,
    val renderTimeMs: Long = 0
)

@Serializable
enum class ExportStatus {
    PENDING,
    QUEUED,
    PREPARING,
    RENDERING,
    ENCODING,
    FINALIZING,
    COMPLETED,
    FAILED,
    CANCELLED
}

@Serializable
data class ExportProgress(
    val jobId: String,
    val status: ExportStatus,
    val progress: Float, // 0-1
    val currentStage: String,
    val framesRendered: Long = 0,
    val totalFrames: Long = 0,
    val fps: Float = 0f,
    val etaMs: Long = 0,
    val error: String? = null
)

@Serializable
data class RenderStats(
    val framesRendered: Long = 0,
    val framesDropped: Long = 0,
    val averageFrameTimeMs: Float = 0f,
    val peakMemoryMb: Long = 0,
    val currentMemoryMb: Long = 0,
    val cpuUsage: Float = 0f,
    val gpuUsage: Float = 0f
)