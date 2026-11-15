package com.videoai.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@Entity(tableName = "clips")
data class Clip(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val mediaId: String,
    val trackId: String,
    val startTime: Long = 0, // position on timeline (microseconds)
    val duration: Long, // visible duration on timeline
    val sourceIn: Long = 0, // source media in-point
    val sourceOut: Long = 0, // source media out-point (0 = media duration)
    val speed: Float = 1.0f,
    val transform: Transform = Transform(),
    val opacity: Float = 1.0f,
    val blendMode: BlendMode = BlendMode.NORMAL,
    val effects: List<Effect> = emptyList(),
    val keyframes: List<Keyframe> = emptyList(),
    val audioConfig: AudioConfig = AudioConfig(),
    val textConfig: TextConfig? = null,
    val captionConfig: CaptionConfig? = null,
    val transitionIn: Transition? = null,
    val transitionOut: Transition? = null,
    val metadata: Map<String, String> = emptyMap()
) {
    val sourceDuration: Long
        get() = if (sourceOut > 0) sourceOut - sourceIn else duration
    
    val endTime: Long
        get() = startTime + duration
    
    fun getSourceTime(timelineTime: Long): Long {
        val localTime = timelineTime - startTime
        return sourceIn + (localTime / speed).toLong()
    }
    
    fun getTimelineTime(sourceTime: Long): Long {
        val localSourceTime = sourceTime - sourceIn
        return startTime + (localSourceTime * speed).toLong()
    }
    
    fun withStartTime(newStartTime: Long): Clip = copy(startTime = newStartTime)
    fun withDuration(newDuration: Long): Clip = copy(duration = newDuration)
    fun withSourceIn(newSourceIn: Long): Clip = copy(sourceIn = newSourceIn)
    fun withSourceOut(newSourceOut: Long): Clip = copy(sourceOut = newSourceOut)
    fun withSpeed(newSpeed: Float): Clip = copy(speed = newSpeed)
    fun withTransform(newTransform: Transform): Clip = copy(transform = newTransform)
    fun withEffects(newEffects: List<Effect>): Clip = copy(effects = newEffects)
    fun withKeyframes(newKeyframes: List<Keyframe>): Clip = copy(keyframes = newKeyframes)
    fun addEffect(effect: Effect): Clip = copy(effects = effects + effect)
    fun removeEffect(effectId: String): Clip = copy(effects = effects.filter { it.id != effectId })
    fun addKeyframe(keyframe: Keyframe): Clip = copy(keyframes = (keyframes + keyframe).sortedBy { it.time })
    fun removeKeyframe(keyframeId: String): Clip = copy(keyframes = keyframes.filter { it.id != keyframeId })
}

@Serializable
data class Transform(
    val x: Float = 0f,
    val y: Float = 0f,
    val scaleX: Float = 1f,
    val scaleY: Float = 1f,
    val rotation: Float = 0f,
    val anchorX: Float = 0.5f,
    val anchorY: Float = 0.5f,
    val skewX: Float = 0f,
    val skewY: Float = 0f
) {
    fun copy(
        x: Float = this.x,
        y: Float = this.y,
        scaleX: Float = this.scaleX,
        scaleY: Float = this.scaleY,
        rotation: Float = this.rotation,
        anchorX: Float = this.anchorX,
        anchorY: Float = this.anchorY,
        skewX: Float = this.skewX,
        skewY: Float = this.skewY
    ): Transform = Transform(x, y, scaleX, scaleY, rotation, anchorX, anchorY, skewX, skewY)
}

@Serializable
enum class BlendMode {
    NORMAL,
    MULTIPLY,
    SCREEN,
    OVERLAY,
    DARKEN,
    LIGHTEN,
    COLOR_DODGE,
    COLOR_BURN,
    HARD_LIGHT,
    SOFT_LIGHT,
    DIFFERENCE,
    EXCLUSION,
    HUE,
    SATURATION,
    COLOR,
    LUMINOSITY,
    ADD,
    SUBTRACT
}

@Serializable
data class AudioConfig(
    val volume: Float = 1.0f,
    val pan: Float = 0f,
    val fadeIn: Long = 0,
    val fadeOut: Long = 0,
    val eq: EqualizerConfig = EqualizerConfig(),
    val noiseReduction: NoiseReductionConfig = NoiseReductionConfig(),
    val ducking: DuckingConfig = DuckingConfig(),
    val pitchCorrection: Boolean = false,
    val maintainPitch: Boolean = true
)

@Serializable
data class EqualizerConfig(
    val bands: Map<Int, Float> = emptyMap(), // frequency -> gain
    val preset: EqualizerPreset = EqualizerPreset.FLAT
)

@Serializable
enum class EqualizerPreset {
    FLAT,
    BASS_BOOST,
    TREBLE_BOOST,
    VOCAL,
    ROCK,
    POP,
    JAZZ,
    CLASSICAL,
    CUSTOM
}

@Serializable
data class NoiseReductionConfig(
    val enabled: Boolean = false,
    val strength: Float = 0.5f,
    val sensitivity: Float = 0.5f,
    val frequencySmoothing: Int = 3
)

@Serializable
data class DuckingConfig(
    val enabled: Boolean = false,
    val threshold: Float = -20f,
    val ratio: Float = 4f,
    val attack: Long = 10000, // microseconds
    val release: Long = 100000, // microseconds
    val knee: Float = 6f
)

@Serializable
data class TextConfig(
    val text: String = "",
    val fontFamily: String = "sans-serif",
    val fontSize: Float = 48f,
    val fontWeight: Int = 400,
    val fontStyle: FontStyle = FontStyle.NORMAL,
    val color: Int = 0xFFFFFFFF,
    val strokeColor: Int = 0xFF000000,
    val strokeWidth: Float = 0f,
    val shadowColor: Int = 0x80000000,
    val shadowOffsetX: Float = 2f,
    val shadowOffsetY: Float = 2f,
    val shadowBlur: Float = 4f,
    val backgroundColor: Int = 0x00000000,
    val backgroundPadding: Float = 8f,
    val alignment: TextAlignment = TextAlignment.CENTER,
    val lineHeight: Float = 1.2f,
    val letterSpacing: Float = 0f,
    val transform: TextTransform = TextTransform.NONE,
    val animation: TextAnimation? = null
)

@Serializable
enum class FontStyle {
    NORMAL,
    ITALIC,
    BOLD,
    BOLD_ITALIC
}

@Serializable
enum class TextAlignment {
    LEFT,
    CENTER,
    RIGHT,
    JUSTIFY
}

@Serializable
enum class TextTransform {
    NONE,
    UPPERCASE,
    LOWERCASE,
    CAPITALIZE
}

@Serializable
data class TextAnimation(
    val type: TextAnimationType = TextAnimationType.NONE,
    val duration: Long = 1000000,
    val delay: Long = 0,
    val easing: Easing = Easing.LINEAR
)

@Serializable
enum class TextAnimationType {
    NONE,
    FADE_IN,
    FADE_OUT,
    SLIDE_IN_LEFT,
    SLIDE_IN_RIGHT,
    SLIDE_IN_TOP,
    SLIDE_IN_BOTTOM,
    ZOOM_IN,
    ZOOM_OUT,
    TYPEWRITER,
    BOUNCE
}

@Serializable
data class CaptionConfig(
    val segments: List<CaptionSegment> = emptyList(),
    val style: CaptionStyle = CaptionStyle(),
    val language: String = "en"
)

@Serializable
data class CaptionSegment(
    val id: String = UUID.randomUUID().toString(),
    val startTime: Long,
    val endTime: Long,
    val text: String,
    val confidence: Float = 1.0f,
    val speakerId: String? = null
)

@Serializable
data class CaptionStyle(
    val fontFamily: String = "sans-serif",
    val fontSize: Float = 32f,
    val fontWeight: Int = 500,
    val color: Int = 0xFFFFFFFF,
    val strokeColor: Int = 0xFF000000,
    val strokeWidth: Float = 2f,
    val backgroundColor: Int = 0x80000000,
    val backgroundPadding: Float = 8f,
    val alignment: TextAlignment = TextAlignment.CENTER,
    val position: CaptionPosition = CaptionPosition.BOTTOM_CENTER,
    val maxLines: Int = 2
)

@Serializable
enum class CaptionPosition {
    TOP_LEFT,
    TOP_CENTER,
    TOP_RIGHT,
    MIDDLE_LEFT,
    MIDDLE_CENTER,
    MIDDLE_RIGHT,
    BOTTOM_LEFT,
    BOTTOM_CENTER,
    BOTTOM_RIGHT
}