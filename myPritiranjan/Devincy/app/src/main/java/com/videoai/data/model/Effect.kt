package com.videoai.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class Effect(
    val id: String = UUID.randomUUID().toString(),
    val type: EffectType,
    val parameters: Map<String, Any> = emptyMap(),
    val enabled: Boolean = true,
    val keyframes: List<Keyframe> = emptyList(),
    val order: Int = 0,
    val mix: Float = 1.0f
) {
    fun getParameter<T>(key: String, default: T): T {
        return parameters[key] as? T ?: default
    }
    
    fun withParameter(key: String, value: Any): Effect {
        return copy(parameters = parameters + (key to value))
    }
    
    fun withParameters(newParams: Map<String, Any>): Effect {
        return copy(parameters = parameters + newParams)
    }
}

@Serializable
enum class EffectType {
    // Color Correction
    BRIGHTNESS("brightness", -1f, 1f, 0f),
    CONTRAST("contrast", 0f, 4f, 1f),
    SATURATION("saturation", 0f, 3f, 1f),
    EXPOSURE("exposure", -2f, 2f, 0f),
    HIGHLIGHTS("highlights", -1f, 1f, 0f),
    SHADOWS("shadows", -1f, 1f, 0f),
    TEMPERATURE("temperature", -1f, 1f, 0f),
    TINT("tint", -1f, 1f, 0f),
    VIBRANCE("vibrance", -1f, 1f, 0f),
    GAMMA("gamma", 0.1f, 3f, 1f),
    CURVES("curves"),
    COLOR_WHEELS("colorWheels"),
    LUT("lut"),
    
    // Blur & Sharpen
    GAUSSIAN_BLUR("gaussianBlur", 0f, 100f, 0f),
    MOTION_BLUR("motionBlur", 0f, 100f, 0f),
    BOX_BLUR("boxBlur", 0f, 100f, 0f),
    SHARPEN("sharpen", 0f, 2f, 0f),
    UNSHARP_MASK("unsharpMask", 0f, 5f, 0f),
    
    // Stylize
    VIGNETTE("vignette", 0f, 2f, 0f),
    FILM_GRAIN("filmGrain", 0f, 1f, 0f),
    CHROMATIC_ABERRATION("chromaticAberration", 0f, 10f, 0f),
    HALFTONE("halftone", 0f, 50f, 0f),
    POSTERIZE("posterize", 2f, 256f, 256f),
    SOLARIZE("solarize", 0f, 1f, 0f),
    THRESHOLD("threshold", 0f, 1f, 0.5f),
    
    // Transform
    CROP("crop"),
    ROTATE("rotate", -180f, 180f, 0f),
    FLIP_H("flipH"),
    FLIP_V("flipV"),
    PERSPECTIVE("perspective"),
    LENS_CORRECTION("lensCorrection"),
    
    // Audio
    VOLUME("volume", 0f, 4f, 1f),
    FADE_IN("fadeIn"),
    FADE_OUT("fadeOut"),
    EQUALIZER("equalizer"),
    NOISE_REDUCTION("noiseReduction"),
    COMPRESSOR("compressor"),
    LIMITER("limiter"),
    REVERB("reverb"),
    DELAY("delay"),
    CHORUS("chorus"),
    FLANGER("flanger"),
    PHASER("phaser"),
    DISTORTION("distortion"),
    PITCH_SHIFT("pitchShift", -12f, 12f, 0f),
    TIME_STRETCH("timeStretch", 0.25f, 4f, 1f),
    
    // Advanced
    CHROMA_KEY("chromaKey"),
    BACKGROUND_REMOVAL("backgroundRemoval"),
    MASK("mask"),
    MOTION_TRACKING("motionTracking"),
    STABILIZATION("stabilization"),
    OPTICAL_FLOW("opticalFlow"),
    SUPER_RESOLUTION("superResolution"),
    FRAME_INTERPOLATION("frameInterpolation"),
    
    // Presets/Filters
    CINEMATIC("cinematic"),
    VINTAGE("vintage"),
    BLACK_WHITE("blackWhite"),
    SEPIA("sepia"),
    TEAL_ORANGE("tealOrange"),
    BLEACH_BYPASS("bleachBypass"),
    CROSS_PROCESS("crossProcess"),
    TECHNICOLOR("technicolor"),
    FILM_EMULATION("filmEmulation"),
    HDR_LOOK("hdrLook"),
    NEON("neon"),
    CYBERPUNK("cyberpunk"),
    LOFI("lofi"),
    GLITCH("glitch"),
    VHS("vhs"),
    GLITCH_RGB("glitchRgb"),
    GLITCH_WAVE("glitchWave"),
    RGB_SPLIT("rgbSplit"),
    PIXELATE("pixelate"),
    MOSAIC("mosaic"),
    KALEIDOSCOPE("kaleidoscope"),
    MIRROR("mirror"),
    KALEIDOSCOPE_4("kaleidoscope4"),
    POLAROID("polaroid"),
    INSTANT("instant"),
    RETRO("retro"),
    DREAMY("dreamy"),
    MOODY("moody"),
    VIBRANT("vibrant"),
    MATTE("matte"),
    FADED("faded"),
    HIGH_CONTRAST("highContrast"),
    LOW_CONTRAST("lowContrast"),
    COOL_TONES("coolTones"),
    WARM_TONES("warmTones"),
    MONOCHROME("monochrome"),
    DUOTONE("duotone"),
    TRITONE("tritone");
    
    val paramKey: String
    val min: Float
    val max: Float
    val default: Float
    
    constructor() {
        this.paramKey = name.lowercase()
        this.min = 0f
        this.max = 1f
        this.default = 0f
    }
    
    constructor(paramKey: String) {
        this.paramKey = paramKey
        this.min = 0f
        this.max = 1f
        this.default = 0f
    }
    
    constructor(paramKey: String, min: Float, max: Float, default: Float) {
        this.paramKey = paramKey
        this.min = min
        this.max = max
        this.default = default
    }
    
    val hasParameter: Boolean
        get() = min != 0f || max != 1f || default != 0f
}

@Serializable
data class Keyframe(
    val id: String = UUID.randomUUID().toString(),
    val time: Long, // microseconds on clip timeline
    val property: String, // e.g., "transform.scaleX", "effects[0].parameters.intensity"
    val value: KeyframeValue,
    val easing: Easing = Easing.LINEAR,
    val spatialTension: Float = 0f, // for spatial interpolation
    val spatialContinuity: Float = 0f,
    val spatialBias: Float = 0f
) {
    fun getFloatValue(): Float = when (value) {
        is KeyframeValue.FloatValue -> value.value
        is KeyframeValue.IntValue -> value.value.toFloat()
        is KeyframeValue.DoubleValue -> value.value.toFloat()
        else -> 0f
    }
    
    fun getIntValue(): Int = when (value) {
        is KeyframeValue.IntValue -> value.value
        is KeyframeValue.FloatValue -> value.value.toInt()
        is KeyframeValue.DoubleValue -> value.value.toInt()
        else -> 0
    }
}

@Serializable
sealed class KeyframeValue {
    @Serializable data class FloatValue(val value: Float) : KeyframeValue()
    @Serializable data class IntValue(val value: Int) : KeyframeValue()
    @Serializable data class DoubleValue(val value: Double) : KeyframeValue()
    @Serializable data class StringValue(val value: String) : KeyframeValue()
    @Serializable data class BooleanValue(val value: Boolean) : KeyframeValue()
    @Serializable data class TransformValue(val transform: Transform) : KeyframeValue()
    @Serializable data class ColorValue(val color: Int) : KeyframeValue()
    @Serializable data class PointValue(val x: Float, val y: Float) : KeyframeValue()
}

@Serializable
enum class Easing {
    LINEAR,
    EASE_IN,
    EASE_OUT,
    EASE_IN_OUT,
    EASE_IN_SINE,
    EASE_OUT_SINE,
    EASE_IN_OUT_SINE,
    EASE_IN_QUAD,
    EASE_OUT_QUAD,
    EASE_IN_OUT_QUAD,
    EASE_IN_CUBIC,
    EASE_OUT_CUBIC,
    EASE_IN_OUT_CUBIC,
    EASE_IN_QUART,
    EASE_OUT_QUART,
    EASE_IN_OUT_QUART,
    EASE_IN_QUINT,
    EASE_OUT_QUINT,
    EASE_IN_OUT_QUINT,
    EASE_IN_EXPO,
    EASE_OUT_EXPO,
    EASE_IN_OUT_EXPO,
    EASE_IN_CIRC,
    EASE_OUT_CIRC,
    EASE_IN_OUT_CIRC,
    EASE_IN_BACK,
    EASE_OUT_BACK,
    EASE_IN_OUT_BACK,
    EASE_IN_ELASTIC,
    EASE_OUT_ELASTIC,
    EASE_IN_OUT_ELASTIC,
    EASE_IN_BOUNCE,
    EASE_OUT_BOUNCE,
    EASE_IN_OUT_BOUNCE,
    CUSTOM
}

@Serializable
data class Transition(
    val id: String = UUID.randomUUID().toString(),
    val type: TransitionType,
    val duration: Long = 500000, // microseconds
    val easing: Easing = Easing.EASE_IN_OUT,
    val parameters: Map<String, Any> = emptyMap(),
    val alignment: TransitionAlignment = TransitionAlignment.CENTER
)

@Serializable
enum class TransitionType {
    // Dissolve
    CROSS_DISSOLVE,
    FILM_DISSOLVE,
    ADDITIVE_DISSOLVE,
    
    // Wipe
    WIPE_LEFT,
    WIPE_RIGHT,
    WIPE_UP,
    WIPE_DOWN,
    WIPE_CIRCLE,
    WIPE_RECTANGLE,
    WIPE_HEART,
    WIPE_STAR,
    
    // Slide
    SLIDE_LEFT,
    SLIDE_RIGHT,
    SLIDE_UP,
    SLIDE_DOWN,
    PUSH_LEFT,
    PUSH_RIGHT,
    PUSH_UP,
    PUSH_DOWN,
    
    // Zoom
    ZOOM_IN,
    ZOOM_OUT,
    ZOOM_CROSS,
    
    // 3D
    FLIP_HORIZONTAL,
    FLIP_VERTICAL,
    CUBE_LEFT,
    CUBE_RIGHT,
    PAGE_TURN,
    
    // Creative
    LIGHT_LEAK,
    GLITCH,
    RGB_SHIFT,
    PRISM,
    KALEIDOSCOPE,
    SPIRAL,
    RIPPLE,
    WAVE,
    PIXELATE,
    MOSAIC,
    BLOCKS,
    BARS,
    VENETIAN_BLINDS,
    CHECKERBOARD,
    
    // Shape
    IRIS_ROUND,
    IRIS_RECTANGLE,
    IRIS_DIAMOND,
    IRIS_HEART,
    IRIS_STAR,
    
    // Custom
    CUSTOM_SHADER
}

@Serializable
enum class TransitionAlignment {
    START,    // Transition starts at cut point
    CENTER,   // Transition centered on cut point
    END       // Transition ends at cut point
}

@Serializable
data class Marker(
    val id: String = UUID.randomUUID().toString(),
    val time: Long,
    val name: String,
    val color: Int = 0xFFBB86FC,
    val note: String = "",
    val type: MarkerType = MarkerType.GENERIC
)

@Serializable
enum class MarkerType {
    GENERIC,
    CHAPTER,
    BEAT,
    SCENE_CHANGE,
    IMPORTANT,
    TODO,
    NOTE
}