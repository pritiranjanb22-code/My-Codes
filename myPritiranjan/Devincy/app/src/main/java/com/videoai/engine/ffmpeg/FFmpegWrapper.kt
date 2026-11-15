package com.videoai.engine.ffmpeg

import com.arthenica.mobileffmpeg.FFmpeg
import com.videoai.data.model.*
import com.videoai.engine.ffmpeg.FFmpegCommandBuilder.FilterGraph
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

object FFmpegWrapper {
    private var initialized = false
    
    fun initialize(): Boolean {
        if (!initialized) {
            val config = FFmpeg.getConfig()
            initialized = true
        }
        return true
    }
    
    @Suppress("UNUSED_PARAMETER")
    fun execute(command: String): Int {
        return FFmpeg.execute(command)
    }
    
    @Suppress("UNUSED_PARAMETER")
    fun executeAsync(command: String, callback: (Int) -> Unit): Long {
        return FFmpeg.executeAsync(command) { executionId, returnCode ->
            callback(returnCode)
        }
    }
    
    fun cancel(executionId: Long) {
        FFmpeg.cancel(executionId)
    }
    
    fun getLastOutput(): String = FFmpeg.getLastOutput()
    fun getLastCommand(): String = FFmpeg.getLastCommand()
    
    fun isRunning(): Boolean = FFmpeg.isRunning()
    
    fun getSupportedCodecs(): List<String> {
        // This would query FFmpeg for supported codecs
        return listOf("h264", "h265", "vp9", "av1", "prores", "aac", "mp3", "opus")
    }
    
    fun getHardwareAccelerators(): List<String> {
        // Query available hardware accelerators
        return listOf("mediacodec", "v4l2m2m", "vaapi", "cuda", "videotoolbox")
    }
}

class FFmpegCommandBuilder(
    private val project: Project,
    private val mediaMap: Map<String, Media>
) {
    data class FilterGraph(
        val filters: List<String> = emptyList(),
        val inputs: List<String> = emptyList(),
        val outputs: List<String> = emptyList()
    ) {
        fun addFilter(filter: String): FilterGraph = copy(filters = filters + filter)
        fun addInput(input: String): FilterGraph = copy(inputs = inputs + input)
        fun addOutput(output: String): FilterGraph = copy(outputs = outputs + output)
        fun build(): String = filters.joinToString(";")
    }
    
    fun buildExportCommand(settings: ExportSettings, outputPath: String): String {
        val filterGraph = buildFilterGraph()
        val inputs = buildInputs()
        val output = buildOutput(settings, outputPath, filterGraph)
        
        return ("ffmpeg -y " + inputs.joinToString(" ") + " " + filterGraph.build() + " " + output).trim()
    }
    
    private fun buildInputs(): List<String> {
        val inputs = mutableListOf<String>()
        val usedMedia = mutableSetOf<String>()
        
        for (track in project.timeline.tracks) {
            for (clip in track.clips) {
                if (clip.mediaId !in usedMedia) {
                    val media = mediaMap[clip.mediaId] ?: continue
                    usedMedia.add(clip.mediaId)
                    
                    var input = "-i \"${media.uri}\""
                    
                    // Add hardware acceleration if available
                    if (settings.hardwareAcceleration) {
                        input = "-hwaccel auto $input"
                    }
                    
                    inputs.add(input)
                }
            }
        }
        
        return inputs
    }
    
    private fun buildFilterGraph(): FilterGraph {
        val graph = FilterGraph()
        var filterIndex = 0
        
        // Build video filter chain for each track
        for (track in project.timeline.tracks.filter { it.type == TrackType.VIDEO || it.type == TrackType.OVERLAY }) {
            for (clip in track.clips) {
                val media = mediaMap[clip.mediaId] ?: continue
                val inputIndex = getInputIndex(clip.mediaId)
                
                var filterChain = "[${inputIndex}:v]"
                
                // Trim filter
                if (clip.sourceIn > 0 || clip.sourceOut > 0 && clip.sourceOut < media.duration) {
                    val startSec = clip.sourceIn / 1_000_000.0
                    val endSec = clip.sourceOut / 1_000_000.0
                    filterChain += "trim=start=$startSec:end=$endSec,setpts=PTS-STARTPTS"
                }
                
                // Speed filter
                if (clip.speed != 1.0f) {
                    filterChain += ",setpts=${1.0f / clip.speed}*PTS"
                }
                
                // Transform filter
                if (clip.transform != Transform()) {
                    filterChain += buildTransformFilter(clip.transform)
                }
                
                // Effects filters
                for (effect in clip.effects.filter { it.enabled }) {
                    filterChain += "," + buildEffectFilter(effect)
                }
                
                // Opacity
                if (clip.opacity < 1.0f) {
                    filterChain += ",format=rgba,colorchannelmixer=aa=${clip.opacity}"
                }
                
                // Output label
                val outputLabel = "v${filterIndex++}"
                filterChain += "[$outputLabel]"
                
                graph = graph.addFilter(filterChain)
            }
        }
        
        // Build audio filter chain
        var audioFilterIndex = 0
        for (track in project.timeline.tracks.filter { it.type == TrackType.AUDIO }) {
            for (clip in track.clips) {
                val media = mediaMap[clip.mediaId] ?: continue
                if (!media.hasAudio) continue
                
                val inputIndex = getInputIndex(clip.mediaId)
                var filterChain = "[${inputIndex}:a]"
                
                // Trim
                if (clip.sourceIn > 0 || clip.sourceOut > 0 && clip.sourceOut < media.duration) {
                    val startSec = clip.sourceIn / 1_000_000.0
                    val endSec = clip.sourceOut / 1_000_000.0
                    filterChain += "atrim=start=$startSec:end=$endSec,asetpts=PTS-STARTPTS"
                }
                
                // Speed
                if (clip.speed != 1.0f && clip.audioConfig.maintainPitch) {
                    filterChain += ",atempo=${clip.speed}"
                } else if (clip.speed != 1.0f) {
                    filterChain += ",asetpts=${1.0f / clip.speed}*PTS"
                }
                
                // Volume
                if (clip.audioConfig.volume != 1.0f) {
                    filterChain += ",volume=${clip.audioConfig.volume}"
                }
                
                // Fade in/out
                if (clip.audioConfig.fadeIn > 0) {
                    val durSec = clip.audioConfig.fadeIn / 1_000_000.0
                    filterChain += ",afade=t=in:st=0:d=$durSec"
                }
                if (clip.audioConfig.fadeOut > 0) {
                    val durSec = clip.audioConfig.fadeOut / 1_000_000.0
                    val startTime = (clip.duration - clip.audioConfig.fadeOut) / 1_000_000.0
                    filterChain += ",afade=t=out:st=$startTime:d=$durSec"
                }
                
                // Equalizer
                if (clip.audioConfig.eq.preset != EqualizerPreset.FLAT) {
                    filterChain += buildEqualizerFilter(clip.audioConfig.eq)
                }
                
                val outputLabel = "a${audioFilterIndex++}"
                filterChain += "[$outputLabel]"
                
                graph = graph.addFilter(filterChain)
            }
        }
        
        // Mix video tracks
        val videoOutputs = (0 until filterIndex).map { "v$it" }
        if (videoOutputs.size > 1) {
            var mixFilter = videoOutputs.joinToString("") { "[$it]" }
            mixFilter += "xstack=inputs=${videoOutputs.size}:layout=0_0|0_0|0_0|0_0[vout]"
            graph = graph.addFilter(mixFilter)
        } else if (videoOutputs.size == 1) {
            graph = graph.addFilter("[v0]copy[vout]")
        }
        
        // Mix audio tracks
        val audioOutputs = (0 until audioFilterIndex).map { "a$it" }
        if (audioOutputs.size > 1) {
            var mixFilter = audioOutputs.joinToString("") { "[$it]" }
            mixFilter += "amix=inputs=${audioOutputs.size}:duration=longest:normalize=0[aout]"
            graph = graph.addFilter(mixFilter)
        } else if (audioOutputs.size == 1) {
            graph = graph.addFilter("[a0]anull[aout]")
        }
        
        // Add canvas scaling/padding
        val canvas = project.canvas
        graph = graph.addFilter("[vout]scale=${canvas.width}:${canvas.height}:force_original_aspect_ratio=decrease,pad=${canvas.width}:${canvas.height}:(ow-iw)/2:(oh-ih)/2:color=${formatColor(canvas.backgroundColor)}[vfinal]")
        
        // Add text overlays
        for (track in project.timeline.tracks.filter { it.type == TrackType.TEXT }) {
            for (clip in track.clips) {
                clip.textConfig?.let { textConfig ->
                    val textFilter = buildTextFilter(textConfig, clip)
                    graph = graph.addFilter("[vfinal]$textFilter[vfinal]")
                }
            }
        }
        
        // Final output mapping
        graph = graph.addOutput("[vfinal]").addOutput("[aout]")
        
        return graph
    }
    
    private fun getInputIndex(mediaId: String): Int {
        val usedMedia = project.timeline.tracks.flatMap { it.clips.map { it.mediaId } }.distinct()
        return usedMedia.indexOf(mediaId)
    }
    
    private fun buildTransformFilter(transform: Transform): String {
        val filters = mutableListOf<String>()
        
        if (transform.rotation != 0f) {
            filters.add("rotate=${Math.toRadians(transform.rotation.toDouble())}")
        }
        
        if (transform.scaleX != 1f || transform.scaleY != 1f) {
            filters.add("scale=iw*${transform.scaleX}:ih*${transform.scaleY}")
        }
        
        if (transform.x != 0f || transform.y != 0f) {
            // Position handled by overlay/xstack
        }
        
        return if (filters.isNotEmpty()) "," + filters.joinToString(",") else ""
    }
    
    private fun buildEffectFilter(effect: Effect): String {
        return when (effect.type) {
            EffectType.BRIGHTNESS -> "eq=brightness=${effect.getParameter("value", 0f)}"
            EffectType.CONTRAST -> "eq=contrast=${effect.getParameter("value", 1f)}"
            EffectType.SATURATION -> "eq=saturation=${effect.getParameter("value", 1f)}"
            EffectType.GAMMA -> "eq=gamma=${effect.getParameter("value", 1f)}"
            EffectType.GAUSSIAN_BLUR -> "gblur=sigma=${effect.getParameter("value", 0f)}"
            EffectType.VIGNETTE -> "vignette=angle=${effect.getParameter("value", 0f)}"
            EffectType.LUT -> {
                val lutPath = effect.getParameter<String>("lutPath", "")
                if (lutPath.isNotBlank()) "lut3d='$lutPath'" else "null"
            }
            EffectType.CHROMA_KEY -> {
                val color = effect.getParameter<Int>("color", 0xFF00FF00)
                val similarity = effect.getParameter<Float>("similarity", 0.1f)
                val blend = effect.getParameter<Float>("blend", 0.1f)
                "chromakey=0x${color.toString(16).padStart(6, '0')}:similarity=$similarity:blend=$blend"
            }
            EffectType.CROP -> {
                val x = effect.getParameter<Float>("x", 0f)
                val y = effect.getParameter<Float>("y", 0f)
                val w = effect.getParameter<Float>("width", 1f)
                val h = effect.getParameter<Float>("height", 1f)
                "crop=iw*$w:ih*$h:iw*$x:ih*$y"
            }
            else -> "null"
        }
    }
    
    private fun buildEqualizerFilter(eq: EqualizerConfig): String {
        val bands = eq.bands.toList().sortedBy { it.first }
        return bands.joinToString(",") { "(f=${it.first})*gain=${it.second}" }
            .let { "equalizer=$it" }
    }
    
    private fun buildTextFilter(config: TextConfig, clip: Clip): String {
        val startSec = clip.startTime / 1_000_000.0
        val endSec = clip.endTime / 1_000_000.0
        val text = config.text.replace("'", "\\'").replace(":", "\\:")
        
        val fontSize = config.fontSize
        val fontColor = formatColor(config.color)
        val strokeColor = formatColor(config.strokeColor)
        val bgColor = formatColor(config.backgroundColor)
        
        var filter = "drawtext=text='$text':fontsize=$fontSize:fontcolor=$fontColor"
        
        if (config.strokeWidth > 0) {
            filter += ":borderw=${config.strokeWidth}:bordercolor=$strokeColor"
        }
        
        if (config.backgroundColor != 0x00000000) {
            filter += ":box=1:boxcolor=$bgColor:boxborderw=${config.backgroundPadding}"
        }
        
        // Position
        when (config.alignment) {
            TextAlignment.LEFT -> filter += ":x=10:y=(h-text_h)/2"
            TextAlignment.CENTER -> filter += ":x=(w-text_w)/2:y=(h-text_h)/2"
            TextAlignment.RIGHT -> filter += ":x=w-text_w-10:y=(h-text_h)/2"
        }
        
        // Enable between start and end
        filter += ":enable='between(t,$startSec,$endSec)'"
        
        return filter
    }
    
    private fun buildOutput(settings: ExportSettings, outputPath: String, graph: FilterGraph): String {
        val videoCodec = settings.videoCodec.ffmpegName
        val audioCodec = settings.audioCodec.ffmpegName
        val container = settings.containerFormat.ffmpegName
        
        var output = "-map \"[vfinal]\" -map \"[aout]\""
        output += " -c:v $videoCodec"
        output += " -c:a $audioCodec"
        output += " -f $container"
        
        // Video settings
        output += " -r ${settings.fps}"
        output += " -s ${settings.width}x${settings.height}"
        
        when (settings.videoBitrateMode) {
            BitrateMode.CBR -> output += " -b:v ${settings.videoBitrate} -maxrate ${settings.videoBitrate} -minrate ${settings.videoBitrate} -bufsize ${settings.videoBitrate * 2}"
            BitrateMode.VBR -> output += " -b:v ${settings.videoBitrate} -maxrate ${settings.videoBitrate * 2}"
            BitrateMode.CRF -> output += " -crf ${settings.videoBitrate / 1_000_000}" // Approximate
            BitrateMode.CQP -> output += " -qp ${settings.videoBitrate / 1_000_000}"
        }
        
        output += " -profile:v ${settings.profile.name.lowercase()}"
        output += " -level ${settings.level}"
        output += " -preset ${settings.preset.name.lowercase()}"
        
        if (settings.hardwareAcceleration) {
            output += " -hwaccel auto"
        }
        
        // Audio settings
        output += " -b:a ${settings.audioBitrate}"
        output += " -ar ${settings.audioSampleRate}"
        output += " -ac ${settings.audioChannels}"
        
        // Color settings
        when (settings.colorRange) {
            ColorRange.FULL -> output += " -color_range 2"
            ColorRange.LIMITED -> output += " -color_range 1"
        }
        
        when (settings.colorSpace) {
            ColorSpace.BT709 -> output += " -colorspace bt709 -color_primaries bt709 -color_trc bt709"
            ColorSpace.BT601 -> output += " -colorspace bt470bg -color_primaries bt470bg -color_trc bt709"
            ColorSpace.BT2020 -> output += " -colorspace bt2020nc -color_primaries bt2020 -color_trc smpte2084"
        }
        
        // HDR metadata
        settings.hdrMetadata?.let { hdr ->
            hdr.masteringDisplay?.let { md ->
                output += " -mastering_display \"${md.primaries.joinToString(",")};${md.whitePoint.joinToString(",")};${md.maxLuminance};${md.minLuminance}\""
            }
            hdr.contentLightLevel?.let { cll ->
                output += " -content_light \"${cll.maxContentLightLevel},${cll.maxPicAverageLightLevel}\""
            }
        }
        
        // Fast start for web streaming
        if (settings.fastStart) {
            output += " -movflags +faststart"
        }
        
        // Threads
        if (settings.threads > 0) {
            output += " -threads ${settings.threads}"
        }
        
        output += " \"$outputPath\""
        
        return output
    }
    
    private fun formatColor(color: Int): String {
        val r = (color shr 16 and 0xFF).toString(16).padStart(2, '0')
        val g = (color shr 8 and 0xFF).toString(16).padStart(2, '0')
        val b = (color and 0xFF).toString(16).padStart(2, '0')
        val a = (color shr 24 and 0xFF)
        return if (a == 255) "0x$r$g$b" else "0x$r$g$b@${a / 255.0}"
    }
}

class ProxyGenerator(
    private val settingsRepository: com.videoai.data.repository.SettingsRepository
) {
    suspend fun generateProxy(media: Media, quality: ProxyQuality? = null): String? = withContext(Dispatchers.IO) {
        val proxyQuality = quality ?: settingsRepository.getObject(
            com.videoai.data.repository.SettingsRepository.KEY_PROXY_QUALITY,
            ProxyQuality::class
        ) ?: ProxyQuality.MEDIUM
        
        val outputPath = getProxyPath(media, proxyQuality)
        val file = File(outputPath)
        file.parentFile?.mkdirs()
        
        val command = "ffmpeg -y -i \"${media.uri}\" -vf \"scale=-2:${proxyQuality.height}\" -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 64k \"$outputPath\""
        
        val result = FFmpegWrapper.execute(command)
        return if (result == 0) outputPath else null
    }
    
    private fun getProxyPath(media: Media, quality: ProxyQuality): String {
        val baseDir = File(android.content.ContextCompat.getFilesDir(android.app.ApplicationProvider.getContext<android.content.Context>()!!), "proxies")
        val hash = media.uri.hashCode().toString(16)
        return File(baseDir, "${media.id}_${quality.name.toLowerCase()}_$hash.mp4").absolutePath
    }
    
    suspend fun generateThumbnail(media: Media, timeUs: Long, width: Int = 320, height: Int = 180): String? = withContext(Dispatchers.IO) {
        val outputPath = getThumbnailPath(media, timeUs)
        val file = File(outputPath)
        file.parentFile?.mkdirs()
        
        val timeSec = timeUs / 1_000_000.0
        val command = "ffmpeg -y -ss $timeSec -i \"${media.uri}\" -vframes 1 -vf \"scale=$width:$height:force_original_aspect_ratio=decrease\" \"$outputPath\""
        
        val result = FFmpegWrapper.execute(command)
        return if (result == 0) outputPath else null
    }
    
    private fun getThumbnailPath(media: Media, timeUs: Long): String {
        val baseDir = File(android.content.ContextCompat.getFilesDir(android.app.ApplicationProvider.getContext<android.content.Context>()!!), "thumbnails")
        val timeSec = timeUs / 1_000_000
        return File(baseDir, "${media.id}_${timeSec}s.jpg").absolutePath
    }
    
    suspend fun generateWaveform(media: Media, width: Int = 1000, height: Int = 200): String? = withContext(Dispatchers.IO) {
        if (!media.hasAudio) return null
        
        val outputPath = getWaveformPath(media)
        val file = File(outputPath)
        file.parentFile?.mkdirs()
        
        val command = "ffmpeg -y -i \"${media.uri}\" -filter_complex \"showwavespic=s=${width}x${height}:colors=0x03DAC6\" -frames:v 1 \"$outputPath\""
        
        val result = FFmpegWrapper.execute(command)
        return if (result == 0) outputPath else null
    }
    
    private fun getWaveformPath(media: Media): String {
        val baseDir = File(android.content.ContextCompat.getFilesDir(android.app.ApplicationProvider.getContext<android.content.Context>()!!), "waveforms")
        return File(baseDir, "${media.id}_waveform.png").absolutePath
    }
}