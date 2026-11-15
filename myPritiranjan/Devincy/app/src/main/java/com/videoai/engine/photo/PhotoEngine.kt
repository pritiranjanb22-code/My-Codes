package com.videoai.engine.photo

import com.videoai.data.model.Media
import com.videoai.data.model.PhotoEdits
import com.videoai.data.model.PhotoExportSettings
import com.videoai.data.model.PhotoProject
import com.videoai.engine.ffmpeg.FFmpegWrapper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class PhotoEngine(
    private val proxyGenerator: com.videoai.engine.ffmpeg.ProxyGenerator
) {
    private val scope = kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.SupervisorJob() + Dispatchers.IO)
    
    suspend fun applyEdits(
        project: PhotoProject,
        media: Media,
        outputPath: String,
        settings: PhotoExportSettings = PhotoExportSettings()
    ): Boolean = withContext(Dispatchers.IO) {
        val command = buildEditCommand(project, media, outputPath, settings)
        val result = FFmpegWrapper.execute(command)
        result == 0
    }
    
    private fun buildEditCommand(
        project: PhotoProject,
        media: Media,
        outputPath: String,
        settings: PhotoExportSettings
    ): String {
        val edits = project.edits
        val filters = mutableListOf<String>()
        
        var filterChain = "[0:v]"
        
        // Basic adjustments
        val eqFilters = mutableListOf<String>()
        if (edits.brightness != 0f) eqFilters.add("brightness=${edits.brightness}")
        if (edits.contrast != 1f) eqFilters.add("contrast=${edits.contrast}")
        if (edits.saturation != 1f) eqFilters.add("saturation=${edits.saturation}")
        if (edits.gamma != 1f) eqFilters.add("gamma=${edits.gamma}")
        
        if (eqFilters.isNotEmpty()) {
            filterChain += eqFilters.joinToString(":") { ",eq=$it" }
        }
        
        // Exposure, highlights, shadows
        val colorFilters = mutableListOf<String>()
        if (edits.exposure != 0f) colorFilters.add("exposure=${edits.exposure}")
        if (edits.highlights != 0f) colorFilters.add("highlights=${edits.highlights}")
        if (edits.shadows != 0f) colorFilters.add("shadows=${edits.shadows}")
        
        if (colorFilters.isNotEmpty()) {
            filterChain += colorFilters.joinToString(":") { ",colorbalance=$it" }
        }
        
        // Temperature and tint
        if (edits.temperature != 0f || edits.tint != 0f) {
            // White balance adjustment
            filterChain += ",whitebalance=temperature=${(edits.temperature * 10000).toInt()}:tint=${(edits.tint * 100).toInt()}"
        }
        
        // Vibrance
        if (edits.vibrance != 0f) {
            filterChain += ",vibrance=${edits.vibrance}"
        }
        
        // Clarity and dehaze
        if (edits.clarity != 0f) {
            filterChain += ",unsharp=5:5:${edits.clarity}:5:5:0"
        }
        if (edits.dehaze != 0f) {
            filterChain += ",defog=${edits.dehaze}"
        }
        
        // Tone curve
        if (edits.toneCurve.preset != com.videoai.data.model.CurvePreset.LINEAR && edits.toneCurve.points.isNotEmpty()) {
            val curveStr = edits.toneCurve.points.joinToString(" ") { "${it.x}/${it.y}" }
            filterChain += ",curves=preset=custom:coordinates=\"$curveStr\""
        }
        
        // Color grading (3-way color wheels)
        if (edits.colorGrading != com.videoai.data.model.ColorGrading()) {
            filterChain += buildColorGradingFilter(edits.colorGrading)
        }
        
        // Sharpening
        if (edits.sharpening.amount > 0f) {
            filterChain += ",unsharp=${edits.sharpening.radius}:${edits.sharpening.radius}:${edits.sharpening.amount}:${edits.sharpening.masking}"
        }
        
        // Blur
        if (edits.blur.enabled) {
            filterChain += buildBlurFilter(edits.blur)
        }
        
        // Vignette
        if (edits.vignette.enabled) {
            filterChain += ",vignette=angle=${edits.vignette.amount}:scale=${edits.vignette.midpoint}"
        }
        
        // Grain
        if (edits.grain.enabled) {
            filterChain += ",noise=alls=${edits.grain.amount}:allf=t+u"
        }
        
        // Transform
        if (edits.rotation != 0f) {
            filterChain += ",rotate=${Math.toRadians(edits.rotation.toDouble())}"
        }
        
        if (edits.flipHorizontal) {
            filterChain += ",hflip"
        }
        
        if (edits.flipVertical) {
            filterChain += ",vflip"
        }
        
        if (edits.crop != null) {
            val crop = edits.crop!!
            val w = (media.width * crop.width).toInt()
            val h = (media.height * crop.height).toInt()
            val x = (media.width * crop.x).toInt()
            val y = (media.height * crop.y).toInt()
            filterChain += ",crop=$w:$h:$x:$y"
        }
        
        if (edits.perspective != null) {
            val p = edits.perspective!!
            filterChain += ",perspective=" +
                "${p.topLeft.x}:${p.topLeft.y}:" +
                "${p.topRight.x}:${p.topRight.y}:" +
                "${p.bottomLeft.x}:${p.bottomLeft.y}:" +
                "${p.bottomRight.x}:${p.bottomRight.y}"
        }
        
        // Lens correction
        if (edits.lensCorrection.enabled) {
            filterChain += ",lenscorrection=k1=${edits.lensCorrection.distortion}:k2=${edits.lensCorrection.vignetting}"
        }
        
        // Noise reduction
        if (edits.noiseReduction.luminance > 0f || edits.noiseReduction.color > 0f) {
            filterChain += ",hqdn3d=${edits.noiseReduction.luminance * 10}:${edits.noiseReduction.color * 10}"
        }
        
        // Filter/LUT
        if (edits.filter != null) {
            if (edits.filter!!.lutPath != null) {
                filterChain += ",lut3d='${edits.filter!!.lutPath}'"
            }
        }
        
        if (edits.lut != null) {
            filterChain += ",lut3d='${edits.lut!!.path}'"
        }
        
        // Text overlays
        for (textLayer in edits.textLayers) {
            filterChain += buildTextFilter(textLayer, media.width, media.height)
        }
        
        // Sticker overlays
        for (stickerLayer in edits.stickerLayers) {
            filterChain += buildStickerFilter(stickerLayer)
        }
        
        // Final output
        val format = settings.format.name.lowercase()
        val quality = settings.quality
        
        var command = "ffmpeg -y -i \"${media.uri}\" -filter_complex \"$filterChain\""
        
        // Output settings
        when (settings.format) {
            com.videoai.data.model.PhotoFormat.JPEG -> {
                command += " -c:v mjpeg -q:v ${100 - quality}"
            }
            com.videoai.data.model.PhotoFormat.PNG -> {
                command += " -c:v png -compression_level ${10 - quality / 10}"
            }
            com.videoai.data.model.PhotoFormat.WEBP -> {
                command += " -c:v libwebp -quality $quality"
            }
            com.videoai.data.model.PhotoFormat.HEIC -> {
                command += " -c:v libheif -quality $quality"
            }
            com.videoai.data.model.PhotoFormat.TIFF -> {
                command += " -c:v tiff -compression lzw"
            }
        }
        
        if (settings.width != null && settings.height != null) {
            command += " -vf \"scale=${settings.width}:${settings.height}\""
        }
        
        // Color space
        when (settings.colorSpace) {
            com.videoai.data.model.PhotoColorSpace.SRGB -> command += " -colorspace srgb"
            com.videoai.data.model.PhotoColorSpace.ADOBE_RGB -> command += " -colorspace adobergb"
            com.videoai.data.model.PhotoColorSpace.DCI_P3 -> command += " -colorspace dcip3"
            com.videoai.data.model.PhotoColorSpace.REC2020 -> command += " -colorspace bt2020"
        }
        
        command += " \"$outputPath\""
        
        return command
    }
    
    private fun buildColorGradingFilter(grading: com.videoai.data.model.ColorGrading): String {
        val filters = mutableListOf<String>()
        
        // Shadows
        if (grading.shadows.hue != 0f || grading.shadows.saturation != 0f) {
            filters.add("colorbalance=sh=${grading.shadows.hue}:ss=${grading.shadows.saturation}")
        }
        
        // Midtones
        if (grading.midtones.hue != 0f || grading.midtones.saturation != 0f) {
            filters.add("colorbalance=mh=${grading.midtones.hue}:ms=${grading.midtones.saturation}")
        }
        
        // Highlights
        if (grading.highlights.hue != 0f || grading.highlights.saturation != 0f) {
            filters.add("colorbalance=hh=${grading.highlights.hue}:hs=${grading.highlights.saturation}")
        }
        
        return if (filters.isNotEmpty()) filters.joinToString(":") { ",$it" } else ""
    }
    
    private fun buildBlurFilter(blur: com.videoai.data.model.BlurConfig): String {
        return when (blur.type) {
            com.videoai.data.model.BlurType.GAUSSIAN -> ",gblur=sigma=${blur.radius}"
            com.videoai.data.model.BlurType.MOTION -> ",motionblur=radius=${blur.radius}"
            com.videoai.data.model.BlurType.RADIAL -> ",radialblur=angle=${blur.radius}"
            com.videoai.data.model.BlurType.ZOOM -> ",zoomblur=amount=${blur.radius}"
            com.videoai.data.model.BlurType.TILT_SHIFT -> ",tiltshift=radius=${blur.radius}"
        }
    }
    
    private fun buildTextFilter(layer: com.videoai.data.model.PhotoTextLayer, width: Int, height: Int): String {
        val text = layer.text.replace("'", "\\'").replace(":", "\\:")
        val x = (layer.x * width).toInt()
        val y = (layer.y * height).toInt()
        val color = formatColor(layer.color)
        val strokeColor = formatColor(layer.strokeColor)
        
        var filter = ",drawtext=text='$text':x=$x:y=$y:fontsize=${layer.fontSize}:fontcolor=$color"
        
        if (layer.strokeWidth > 0) {
            filter += ":borderw=${layer.strokeWidth}:bordercolor=$strokeColor"
        }
        
        if (layer.shadowColor != 0x80000000) {
            val shadowColor = formatColor(layer.shadowColor)
            filter += ":shadowcolor=$shadowColor:shadowx=${layer.shadowOffsetX}:shadowy=${layer.shadowOffsetY}"
        }
        
        if (layer.rotation != 0f) {
            filter += ":rotation=${Math.toRadians(layer.rotation.toDouble())}"
        }
        
        return filter
    }
    
    private fun buildStickerFilter(layer: com.videoai.data.model.PhotoStickerLayer): String {
        // This would overlay another image
        // For simplicity, returning empty - would need additional input
        return ""
    }
    
    private fun formatColor(color: Int): String {
        val r = (color shr 16 and 0xFF).toString(16).padStart(2, '0')
        val g = (color shr 8 and 0xFF).toString(16).padStart(2, '0')
        val b = (color and 0xFF).toString(16).padStart(2, '0')
        return "0x$r$g$b"
    }
    
    suspend fun generateThumbnail(project: PhotoProject, media: Media): String? = withContext(Dispatchers.IO) {
        // Generate a small preview with edits applied
        null // Placeholder
    }
    
    suspend fun exportPhoto(
        project: PhotoProject,
        media: Media,
        outputPath: String,
        settings: PhotoExportSettings
    ): Boolean = withContext(Dispatchers.IO) {
        applyEdits(project, media, outputPath, settings)
    }
}

class PhotoEditorCommands {
    // MCP tool implementations for photo editing
    
    fun photoCrop(args: Map<String, Any>): Map<String, Any> {
        val projectId = args.getString("projectId") ?: return mapOf("error" to "projectId required")
        val x = args.getFloat("x") ?: 0f
        val y = args.getFloat("y") ?: 0f
        val width = args.getFloat("width") ?: 1f
        val height = args.getFloat("height") ?: 1f
        val aspectRatio = args.getString("aspectRatio")?.let { com.videoai.data.model.AspectRatio.valueOf(it) }
        
        // Apply crop to project
        return mapOf("success" to true)
    }
    
    fun photoRotate(args: Map<String, Any>): Map<String, Any> {
        val projectId = args.getString("projectId") ?: return mapOf("error" to "projectId required")
        val degrees = args.getFloat("degrees") ?: 0f
        
        return mapOf("success" to true)
    }
    
    fun photoAdjust(args: Map<String, Any>): Map<String, Any> {
        val projectId = args.getString("projectId") ?: return mapOf("error" to "projectId required")
        val adjustments = args.getJsonObject("adjustments") ?: return mapOf("error" to "adjustments required")
        
        // Apply adjustments
        return mapOf("success" to true)
    }
    
    fun photoFilter(args: Map<String, Any>): Map<String, Any> {
        val projectId = args.getString("projectId") ?: return mapOf("error" to "projectId required")
        val filterId = args.getString("filterId") ?: return mapOf("error" to "filterId required")
        val intensity = args.getFloat("intensity") ?: 1f
        
        return mapOf("success" to true)
    }
    
    fun photoAddText(args: Map<String, Any>): Map<String, Any> {
        val projectId = args.getString("projectId") ?: return mapOf("error" to "projectId required")
        val text = args.getString("text") ?: return mapOf("error" to "text required")
        val x = args.getFloat("x") ?: 0.5f
        val y = args.getFloat("y") ?: 0.5f
        
        return mapOf("success" to true)
    }
    
    fun photoRemoveBackground(args: Map<String, Any>): Map<String, Any> {
        val projectId = args.getString("projectId") ?: return mapOf("error" to "projectId required")
        
        return mapOf("success" to true)
    }
    
    fun photoExport(args: Map<String, Any>): Map<String, Any> {
        val projectId = args.getString("projectId") ?: return mapOf("error" to "projectId required")
        val outputPath = args.getString("outputPath")
        val format = args.getString("format")?.let { com.videoai.data.model.PhotoFormat.valueOf(it) }
        val quality = args.getInt("quality") ?: 90
        
        return mapOf("success" to true)
    }
}