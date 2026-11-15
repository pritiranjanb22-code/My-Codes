package com.videoai.data.model

import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class PhotoProject(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val sourceMediaId: String,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val edits: PhotoEdits = PhotoEdits(),
    val outputWidth: Int? = null,
    val outputHeight: Int? = null,
    val outputPath: String? = null
)

@Serializable
data class PhotoEdits(
    // Basic adjustments
    val brightness: Float = 0f,        // -1 to 1
    val contrast: Float = 1f,          // 0 to 4
    val saturation: Float = 1f,        // 0 to 3
    val exposure: Float = 0f,          // -2 to 2
    val highlights: Float = 0f,        // -1 to 1
    val shadows: Float = 0f,           // -1 to 1
    val temperature: Float = 0f,       // -1 to 1
    val tint: Float = 0f,              // -1 to 1
    val vibrance: Float = 0f,          // -1 to 1
    val gamma: Float = 1f,             // 0.1 to 3
    val clarity: Float = 0f,           // -1 to 1
    val dehaze: Float = 0f,            // -1 to 1
    
    // Tone curve
    val toneCurve: ToneCurve = ToneCurve(),
    
    // Color grading
    val colorGrading: ColorGrading = ColorGrading(),
    
    // Sharpening/Blur
    val sharpening: Sharpening = Sharpening(),
    val blur: BlurConfig = BlurConfig(),
    
    // Vignette
    val vignette: VignetteConfig = VignetteConfig(),
    
    // Grain
    val grain: GrainConfig = GrainConfig(),
    
    // Transform
    val crop: CropConfig? = null,
    val rotation: Float = 0f,          // degrees
    val flipHorizontal: Boolean = false,
    val flipVertical: Boolean = false,
    val perspective: PerspectiveConfig? = null,
    
    // Effects
    val filter: FilterConfig? = null,
    val lut: LutConfig? = null,
    
    // Text/Stickers
    val textLayers: List<PhotoTextLayer> = emptyList(),
    val stickerLayers: List<PhotoStickerLayer> = emptyList(),
    val drawingLayers: List<PhotoDrawingLayer> = emptyList(),
    
    // Background removal
    val backgroundRemoval: BackgroundRemovalConfig = BackgroundRemovalConfig(),
    
    // Lens correction
    val lensCorrection: LensCorrectionConfig = LensCorrectionConfig(),
    
    // Noise reduction
    val noiseReduction: NoiseReductionConfig = NoiseReductionConfig()
)

@Serializable
data class ToneCurve(
    val points: List<CurvePoint> = emptyList(),
    val preset: CurvePreset = CurvePreset.LINEAR
)

@Serializable
data class CurvePoint(
    val x: Float,  // 0-1
    val y: Float   // 0-1
)

@Serializable
enum class CurvePreset {
    LINEAR,
    CONTRAST,
    FILM,
    MATTE,
    CUSTOM
}

@Serializable
data class ColorGrading(
    val shadows: ColorWheel = ColorWheel(),
    val midtones: ColorWheel = ColorWheel(),
    val highlights: ColorWheel = ColorWheel(),
    val global: ColorWheel = ColorWheel(),
    val blending: Float = 0.5f,
    val balance: Float = 0f
)

@Serializable
data class ColorWheel(
    val hue: Float = 0f,       // -180 to 180
    val saturation: Float = 0f // -1 to 1
)

@Serializable
data class Sharpening(
    val amount: Float = 0f,      // 0 to 3
    val radius: Float = 1f,      // 0.5 to 3
    val detail: Float = 0f,      // 0 to 1
    val masking: Float = 0f      // 0 to 1
)

@Serializable
data class BlurConfig(
    val enabled: Boolean = false,
    val type: BlurType = BlurType.GAUSSIAN,
    val radius: Float = 10f,
    val mask: BlurMask? = null
)

@Serializable
enum class BlurType {
    GAUSSIAN,
    MOTION,
    RADIAL,
    ZOOM,
    TILT_SHIFT
}

@Serializable
data class BlurMask(
    val type: MaskType = MaskType.ELLIPSE,
    val centerX: Float = 0.5f,
    val centerY: Float = 0.5f,
    val radiusX: Float = 0.3f,
    val radiusY: Float = 0.3f,
    val feather: Float = 0.1f
)

@Serializable
enum class MaskType {
    ELLIPSE,
    RECTANGLE,
    GRADIENT,
    BRUSH
}

@Serializable
data class VignetteConfig(
    val enabled: Boolean = false,
    val amount: Float = 0f,        // -1 to 1
    val midpoint: Float = 0.5f,    // 0 to 1
    val roundness: Float = 0f,     // -1 to 1
    val feather: Float = 0.5f,     // 0 to 1
    val highlights: Float = 0f     // 0 to 1
)

@Serializable
data class GrainConfig(
    val enabled: Boolean = false,
    val amount: Float = 0f,        // 0 to 1
    val size: Float = 0.5f,        // 0 to 1
    val roughness: Float = 0.5f    // 0 to 1
)

@Serializable
data class CropConfig(
    val x: Float = 0f,
    val y: Float = 0f,
    val width: Float = 1f,
    val height: Float = 1f,
    val aspectRatio: AspectRatio? = null
)

@Serializable
data class PerspectiveConfig(
    val topLeft: Point = Point(0f, 0f),
    val topRight: Point = Point(1f, 0f),
    val bottomLeft: Point = Point(0f, 1f),
    val bottomRight: Point = Point(1f, 1f)
)

@Serializable
data class Point(
    val x: Float,
    val y: Float
)

@Serializable
data class FilterConfig(
    val id: String,
    val name: String,
    val intensity: Float = 1f,
    val lutPath: String? = null
)

@Serializable
data class LutConfig(
    val path: String,
    val intensity: Float = 1f
)

@Serializable
data class PhotoTextLayer(
    val id: String = UUID.randomUUID().toString(),
    val text: String,
    val x: Float = 0.5f,
    val y: Float = 0.5f,
    val fontSize: Float = 48f,
    val fontFamily: String = "sans-serif",
    val fontWeight: Int = 400,
    val color: Int = 0xFFFFFFFF,
    val strokeColor: Int = 0xFF000000,
    val strokeWidth: Float = 0f,
    val shadowColor: Int = 0x80000000,
    val shadowOffsetX: Float = 2f,
    val shadowOffsetY: Float = 2f,
    val shadowBlur: Float = 4f,
    val rotation: Float = 0f,
    val scale: Float = 1f,
    val opacity: Float = 1f
)

@Serializable
data class PhotoStickerLayer(
    val id: String = UUID.randomUUID().toString(),
    val mediaId: String,
    val x: Float = 0.5f,
    val y: Float = 0.5f,
    val scale: Float = 1f,
    val rotation: Float = 0f,
    val opacity: Float = 1f
)

@Serializable
data class PhotoDrawingLayer(
    val id: String = UUID.randomUUID().toString(),
    val strokes: List<DrawingStroke> = emptyList(),
    val opacity: Float = 1f
)

@Serializable
data class DrawingStroke(
    val points: List<Point>,
    val color: Int,
    val width: Float,
    val brushType: BrushType = BrushType.NORMAL
)

@Serializable
enum class BrushType {
    NORMAL,
    ERASER,
    HIGHLIGHTER,
    SPRAY
}

@Serializable
data class BackgroundRemovalConfig(
    val enabled: Boolean = false,
    val mode: BackgroundRemovalMode = BackgroundRemovalMode.AUTO,
    val refineEdges: Boolean = true,
    val feather: Float = 1f
)

@Serializable
enum class BackgroundRemovalMode {
    AUTO,
    PERSON,
    OBJECT,
    MANUAL
}

@Serializable
data class LensCorrectionConfig(
    val enabled: Boolean = false,
    val distortion: Float = 0f,      // -1 to 1
    val vignetting: Float = 0f,      // -1 to 1
    val chromaticAberration: Float = 0f // -1 to 1
)

@Serializable
data class NoiseReductionConfig(
    val luminance: Float = 0f,       // 0 to 1
    val color: Float = 0f,           // 0 to 1
    val detail: Float = 0.5f         // 0 to 1
)

@Serializable
data class PhotoExportSettings(
    val format: PhotoFormat = PhotoFormat.JPEG,
    val quality: Int = 90,           // 1-100
    val width: Int? = null,
    val height: Int? = null,
    val colorSpace: PhotoColorSpace = PhotoColorSpace.SRGB,
    val includeMetadata: Boolean = true,
    val stripMetadata: Boolean = false
)

@Serializable
enum class PhotoFormat {
    JPEG,
    PNG,
    WEBP,
    HEIC,
    TIFF
}

@Serializable
enum class PhotoColorSpace {
    SRGB,
    ADOBE_RGB,
    DCI_P3,
    REC2020
}

@Serializable
data class PhotoPreset(
    val id: String,
    val name: String,
    val description: String,
    val edits: PhotoEdits,
    val thumbnail: String? = null,
    val category: PresetCategory = PresetCategory.GENERAL
)

@Serializable
enum class PresetCategory {
    GENERAL,
    PORTRAIT,
    LANDSCAPE,
    CINEMATIC,
    VINTAGE,
    BLACK_WHITE,
    CREATIVE,
    CUSTOM
}