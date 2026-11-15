package com.videoai.data.model

import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class VideoAnalysis(
    val mediaId: String,
    val scenes: List<Scene> = emptyList(),
    val silences: List<SilenceSegment> = emptyList(),
    val speechSegments: List<SpeechSegment> = emptyList(),
    val faces: List<FaceDetection> = emptyList(),
    val objects: List<ObjectDetection> = emptyList(),
    val highlights: List<Highlight> = emptyList(),
    val blurrySegments: List<TimeRange> = emptyList(),
    val duration: Long,
    val analyzedAt: Long = System.currentTimeMillis(),
    val analyzerVersion: String = "1.0"
)

@Serializable
data class Scene(
    val id: String = UUID.randomUUID().toString(),
    val startTime: Long,
    val endTime: Long,
    val confidence: Float = 1.0f,
    val thumbnailTime: Long? = null,
    val features: SceneFeatures = SceneFeatures()
) {
    val duration: Long
        get() = endTime - startTime
}

@Serializable
data class SceneFeatures(
    val avgBrightness: Float = 0f,
    val avgColor: Int = 0,
    val motionLevel: Float = 0f,
    val hasFaces: Boolean = false,
    val hasText: Boolean = false,
    val dominantColors: List<Int> = emptyList()
)

@Serializable
data class SilenceSegment(
    val id: String = UUID.randomUUID().toString(),
    val startTime: Long,
    val endTime: Long,
    val levelDb: Float,
    val confidence: Float = 1.0f
) {
    val duration: Long
        get() = endTime - startTime
}

@Serializable
data class SpeechSegment(
    val id: String = UUID.randomUUID().toString(),
    val startTime: Long,
    val endTime: Long,
    val text: String = "",
    val confidence: Float = 1.0f,
    val language: String = "en",
    val speakerId: String? = null,
    val words: List<WordTiming> = emptyList()
) {
    val duration: Long
        get() = endTime - startTime
}

@Serializable
data class WordTiming(
    val word: String,
    val startTime: Long,
    val endTime: Long,
    val confidence: Float = 1.0f
)

@Serializable
data class FaceDetection(
    val id: String = UUID.randomUUID().toString(),
    val time: Long,
    val boundingBox: BoundingBox,
    val confidence: Float = 1.0f,
    val landmarks: List<FaceLandmark> = emptyList(),
    val attributes: FaceAttributes = FaceAttributes(),
    val trackId: String? = null
)

@Serializable
data class BoundingBox(
    val left: Float,
    val top: Float,
    val right: Float,
    val bottom: Float
) {
    val width: Float = right - left
    val height: Float = bottom - top
    val centerX: Float = (left + right) / 2
    val centerY: Float = (top + bottom) / 2
}

@Serializable
data class FaceLandmark(
    val type: LandmarkType,
    val x: Float,
    val y: Float,
    val confidence: Float = 1.0f
)

@Serializable
enum class LandmarkType {
    LEFT_EYE,
    RIGHT_EYE,
    NOSE,
    MOUTH_LEFT,
    MOUTH_RIGHT,
    LEFT_EAR,
    RIGHT_EAR,
    LEFT_CHEEK,
    RIGHT_CHEEK,
    CHIN,
    FOREHEAD
}

@Serializable
data class FaceAttributes(
    val smileProbability: Float = 0f,
    val leftEyeOpenProbability: Float = 1f,
    val rightEyeOpenProbability: Float = 1f,
    val headEulerX: Float = 0f,
    val headEulerY: Float = 0f,
    val headEulerZ: Float = 0f,
    val age: Int? = null,
    val gender: Gender? = null
)

@Serializable
enum class Gender {
    MALE,
    FEMALE,
    UNKNOWN
}

@Serializable
data class ObjectDetection(
    val id: String = UUID.randomUUID().toString(),
    val time: Long,
    val className: String,
    val classId: Int,
    val confidence: Float = 1.0f,
    val boundingBox: BoundingBox,
    val trackId: String? = null
)

@Serializable
data class Highlight(
    val id: String = UUID.randomUUID().toString(),
    val startTime: Long,
    val endTime: Long,
    val score: Float,
    val type: HighlightType,
    val reason: String = "",
    val thumbnailTime: Long? = null
) {
    val duration: Long
        get() = endTime - startTime
}

@Serializable
enum class HighlightType {
    ACTION,
    EMOTION,
    SCENE_CHANGE,
    AUDIO_PEAK,
    FACE_CLOSEUP,
    OBJECT_APPEARANCE,
    MOTION_BURST,
    COLOR_CHANGE,
    COMPOSITION_CHANGE,
    CUSTOM
}

@Serializable
data class HighlightCriteria(
    val minDuration: Long = 1_000_000, // 1 second
    val maxDuration: Long = 10_000_000, // 10 seconds
    val preferredTypes: List<HighlightType> = emptyList(),
    val minScore: Float = 0.5f,
    val maxHighlights: Int = 20,
    val requireAudio: Boolean = false,
    val requireFaces: Boolean = false,
    val requireMotion: Boolean = false
)

@Serializable
data class AnalysisResult(
    val success: Boolean,
    val analysis: VideoAnalysis? = null,
    val error: String? = null,
    val progress: Float = 0f,
    val stage: String = ""
)

@Serializable
enum class AnalysisType {
    SCENES,
    SILENCE,
    SPEECH,
    FACES,
    OBJECTS,
    HIGHLIGHTS,
    BLUR,
    ALL
}