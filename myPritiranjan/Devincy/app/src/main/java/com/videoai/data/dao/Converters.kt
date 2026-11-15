package com.videoai.data.dao

import androidx.room.TypeConverter
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import com.videoai.data.model.*

class Converters {
    private val json = Json { ignoreUnknownKeys = true }
    
    // Project
    @TypeConverter
    fun projectToJson(project: Project): String = json.encodeToString(project)
    
    @TypeConverter
    fun jsonToProject(jsonStr: String): Project = json.decodeFromString(jsonStr)
    
    // Timeline
    @TypeConverter
    fun timelineToJson(timeline: Timeline): String = json.encodeToString(timeline)
    
    @TypeConverter
    fun jsonToTimeline(jsonStr: String): Timeline = json.decodeFromString(jsonStr)
    
    // Track list
    @TypeConverter
    fun tracksToJson(tracks: List<Track>): String = json.encodeToString(tracks)
    
    @TypeConverter
    fun jsonToTracks(jsonStr: String): List<Track> = json.decodeFromString(jsonStr)
    
    // Clip list
    @TypeConverter
    fun clipsToJson(clips: List<Clip>): String = json.encodeToString(clips)
    
    @TypeConverter
    fun jsonToClips(jsonStr: String): List<Clip> = json.decodeFromString(jsonStr)
    
    // Effect list
    @TypeConverter
    fun effectsToJson(effects: List<Effect>): String = json.encodeToString(effects)
    
    @TypeConverter
    fun jsonToEffects(jsonStr: String): List<Effect> = json.decodeFromString(jsonStr)
    
    // Keyframe list
    @TypeConverter
    fun keyframesToJson(keyframes: List<Keyframe>): String = json.encodeToString(keyframes)
    
    @TypeConverter
    fun jsonToKeyframes(jsonStr: String): List<Keyframe> = json.decodeFromString(jsonStr)
    
    // Transform
    @TypeConverter
    fun transformToJson(transform: Transform): String = json.encodeToString(transform)
    
    @TypeConverter
    fun jsonToTransform(jsonStr: String): Transform = json.decodeFromString(jsonStr)
    
    // AudioConfig
    @TypeConverter
    fun audioConfigToJson(config: AudioConfig): String = json.encodeToString(config)
    
    @TypeConverter
    fun jsonToAudioConfig(jsonStr: String): AudioConfig = json.decodeFromString(jsonStr)
    
    // TextConfig
    @TypeConverter
    fun textConfigToJson(config: TextConfig?): String? = config?.let { json.encodeToString(it) }
    
    @TypeConverter
    fun jsonToTextConfig(jsonStr: String?): TextConfig? = jsonStr?.let { json.decodeFromString(it) }
    
    // CaptionConfig
    @TypeConverter
    fun captionConfigToJson(config: CaptionConfig?): String? = config?.let { json.encodeToString(it) }
    
    @TypeConverter
    fun jsonToCaptionConfig(jsonStr: String?): CaptionConfig? = jsonStr?.let { json.decodeFromString(it) }
    
    // Transition
    @TypeConverter
    fun transitionToJson(transition: Transition?): String? = transition?.let { json.encodeToString(it) }
    
    @TypeConverter
    fun jsonToTransition(jsonStr: String?): Transition? = jsonStr?.let { json.decodeFromString(it) }
    
    // CanvasConfig
    @TypeConverter
    fun canvasConfigToJson(config: CanvasConfig): String = json.encodeToString(config)
    
    @TypeConverter
    fun jsonToCanvasConfig(jsonStr: String): CanvasConfig = json.decodeFromString(jsonStr)
    
    // ProjectSettings
    @TypeConverter
    fun projectSettingsToJson(settings: ProjectSettings): String = json.encodeToString(settings)
    
    @TypeConverter
    fun jsonToProjectSettings(jsonStr: String): ProjectSettings = json.decodeFromString(jsonStr)
    
    // Media metadata
    @TypeConverter
    fun mediaMetadataToJson(metadata: Map<String, String>): String = json.encodeToString(metadata)
    
    @TypeConverter
    fun jsonToMediaMetadata(jsonStr: String): Map<String, String> = json.decodeFromString(jsonStr)
    
    // Marker list
    @TypeConverter
    fun markersToJson(markers: List<Marker>): String = json.encodeToString(markers)
    
    @TypeConverter
    fun jsonToMarkers(jsonStr: String): List<Marker> = json.decodeFromString(jsonStr)
    
    // ExportSettings
    @TypeConverter
    fun exportSettingsToJson(settings: ExportSettings): String = json.encodeToString(settings)
    
    @TypeConverter
    fun jsonToExportSettings(jsonStr: String): ExportSettings = json.decodeFromString(jsonStr)
    
    // ExportJob list
    @TypeConverter
    fun exportJobsToJson(jobs: List<ExportJob>): String = json.encodeToString(jobs)
    
    @TypeConverter
    fun jsonToExportJobs(jsonStr: String): List<ExportJob> = json.decodeFromString(jsonStr)
    
    // VideoAnalysis
    @TypeConverter
    fun videoAnalysisToJson(analysis: VideoAnalysis): String = json.encodeToString(analysis)
    
    @TypeConverter
    fun jsonToVideoAnalysis(jsonStr: String): VideoAnalysis = json.decodeFromString(jsonStr)
    
    // Scene list
    @TypeConverter
    fun scenesToJson(scenes: List<Scene>): String = json.encodeToString(scenes)
    
    @TypeConverter
    fun jsonToScenes(jsonStr: String): List<Scene> = json.decodeFromString(jsonStr)
    
    // SilenceSegment list
    @TypeConverter
    fun silencesToJson(silences: List<SilenceSegment>): String = json.encodeToString(silences)
    
    @TypeConverter
    fun jsonToSilences(jsonStr: String): List<SilenceSegment> = json.decodeFromString(jsonStr)
    
    // SpeechSegment list
    @TypeConverter
    fun speechesToJson(speeches: List<SpeechSegment>): String = json.encodeToString(speeches)
    
    @TypeConverter
    fun jsonToSpeeches(jsonStr: String): List<SpeechSegment> = json.decodeFromString(jsonStr)
    
    // FaceDetection list
    @TypeConverter
    fun facesToJson(faces: List<FaceDetection>): String = json.encodeToString(faces)
    
    @TypeConverter
    fun jsonToFaces(jsonStr: String): List<FaceDetection> = json.decodeFromString(jsonStr)
    
    // ObjectDetection list
    @TypeConverter
    fun objectsToJson(objects: List<ObjectDetection>): String = json.encodeToString(objects)
    
    @TypeConverter
    fun jsonToObjects(jsonStr: String): List<ObjectDetection> = json.decodeFromString(jsonStr)
    
    // Highlight list
    @TypeConverter
    fun highlightsToJson(highlights: List<Highlight>): String = json.encodeToString(highlights)
    
    @TypeConverter
    fun jsonToHighlights(jsonStr: String): List<Highlight> = json.decodeFromString(jsonStr)
    
    // TimeRange list
    @TypeConverter
    fun timeRangesToJson(ranges: List<TimeRange>): String = json.encodeToString(ranges)
    
    @TypeConverter
    fun jsonToTimeRanges(jsonStr: String): List<TimeRange> = json.decodeFromString(jsonStr)
    
    // Tags
    @TypeConverter
    fun tagsToJson(tags: List<String>): String = json.encodeToString(tags)
    
    @TypeConverter
    fun jsonToTags(jsonStr: String): List<String> = json.decodeFromString(jsonStr)
    
    // Enum converters
    @TypeConverter
    fun aspectRatioToString(ratio: AspectRatio): String = ratio.name
    
    @TypeConverter
    fun stringToAspectRatio(str: String): AspectRatio = AspectRatio.valueOf(str)
    
    @TypeConverter
    fun trackTypeToString(type: TrackType): String = type.name
    
    @TypeConverter
    fun stringToTrackType(str: String): TrackType = TrackType.valueOf(str)
    
    @TypeConverter
    fun blendModeToString(mode: BlendMode): String = mode.name
    
    @TypeConverter
    fun stringToBlendMode(str: String): BlendMode = BlendMode.valueOf(str)
    
    @TypeConverter
    fun effectTypeToString(type: EffectType): String = type.name
    
    @TypeConverter
    fun stringToEffectType(str: String): EffectType = EffectType.valueOf(str)
    
    @TypeConverter
    fun easingToString(easing: Easing): String = easing.name
    
    @TypeConverter
    fun stringToEasing(str: String): Easing = Easing.valueOf(str)
    
    @TypeConverter
    fun transitionTypeToString(type: TransitionType): String = type.name
    
    @TypeConverter
    fun stringToTransitionType(str: String): TransitionType = TransitionType.valueOf(str)
    
    @TypeConverter
    fun transitionAlignmentToString(align: TransitionAlignment): String = align.name
    
    @TypeConverter
    fun stringToTransitionAlignment(str: String): TransitionAlignment = TransitionAlignment.valueOf(str)
    
    @TypeConverter
    fun mediaTypeToString(type: MediaType): String = type.name
    
    @TypeConverter
    fun stringToMediaType(str: String): MediaType = MediaType.valueOf(str)
    
    @TypeConverter
    fun hdrFormatToString(format: HdrFormat?): String? = format?.name
    
    @TypeConverter
    fun stringToHdrFormat(str: String?): HdrFormat? = str?.let { HdrFormat.valueOf(it) }
    
    @TypeConverter
    fun streamTypeToString(type: StreamType): String = type.name
    
    @TypeConverter
    fun stringToStreamType(str: String): StreamType = StreamType.valueOf(str)
    
    @TypeConverter
    fun videoCodecToString(codec: VideoCodec): String = codec.name
    
    @TypeConverter
    fun stringToVideoCodec(str: String): VideoCodec = VideoCodec.valueOf(str)
    
    @TypeConverter
    fun audioCodecToString(codec: AudioCodec): String = codec.name
    
    @TypeConverter
    fun stringToAudioCodec(str: String): AudioCodec = AudioCodec.valueOf(str)
    
    @TypeConverter
    fun containerFormatToString(format: ContainerFormat): String = format.name
    
    @TypeConverter
    fun stringToContainerFormat(str: String): ContainerFormat = ContainerFormat.valueOf(str)
    
    @TypeConverter
    fun bitrateModeToString(mode: BitrateMode): String = mode.name
    
    @TypeConverter
    fun stringToBitrateMode(str: String): BitrateMode = BitrateMode.valueOf(str)
    
    @TypeConverter
    fun videoProfileToString(profile: VideoProfile): String = profile.name
    
    @TypeConverter
    fun stringToVideoProfile(str: String): VideoProfile = VideoProfile.valueOf(str)
    
    @TypeConverter
    fun encodingPresetToString(preset: EncodingPreset): String = preset.name
    
    @TypeConverter
    fun stringToEncodingPreset(str: String): EncodingPreset = EncodingPreset.valueOf(str)
    
    @TypeConverter
    fun colorRangeToString(range: ColorRange): String = range.name
    
    @TypeConverter
    fun stringToColorRange(str: String): ColorRange = ColorRange.valueOf(str)
    
    @TypeConverter
    fun colorSpaceToString(space: ColorSpace): String = space.name
    
    @TypeConverter
    fun stringToColorSpace(str: String): ColorSpace = ColorSpace.valueOf(str)
    
    @TypeConverter
    fun exportStatusToString(status: ExportStatus): String = status.name
    
    @TypeConverter
    fun stringToExportStatus(str: String): ExportStatus = ExportStatus.valueOf(str)
    
    @TypeConverter
    fun proxyQualityToString(quality: ProxyQuality): String = quality.name
    
    @TypeConverter
    fun stringToProxyQuality(str: String): ProxyQuality = ProxyQuality.valueOf(str)
    
    @TypeConverter
    fun renderQualityToString(quality: RenderQuality): String = quality.name
    
    @TypeConverter
    fun stringToRenderQuality(str: String): RenderQuality = RenderQuality.valueOf(str)
    
    @TypeConverter
    fun fontStyleToString(style: FontStyle): String = style.name
    
    @TypeConverter
    fun stringToFontStyle(str: String): FontStyle = FontStyle.valueOf(str)
    
    @TypeConverter
    fun textAlignmentToString(align: TextAlignment): String = align.name
    
    @TypeConverter
    fun stringToTextAlignment(str: String): TextAlignment = TextAlignment.valueOf(str)
    
    @TypeConverter
    fun textTransformToString(transform: TextTransform): String = transform.name
    
    @TypeConverter
    fun stringToTextTransform(str: String): TextTransform = TextTransform.valueOf(str)
    
    @TypeConverter
    fun textAnimationTypeToString(type: TextAnimationType): String = type.name
    
    @TypeConverter
    fun stringToTextAnimationType(str: String): TextAnimationType = TextAnimationType.valueOf(str)
    
    @TypeConverter
    fun captionPositionToString(pos: CaptionPosition): String = pos.name
    
    @TypeConverter
    fun stringToCaptionPosition(str: String): CaptionPosition = CaptionPosition.valueOf(str)
    
    @TypeConverter
    fun equalizerPresetToString(preset: EqualizerPreset): String = preset.name
    
    @TypeConverter
    fun stringToEqualizerPreset(str: String): EqualizerPreset = EqualizerPreset.valueOf(str)
    
    @TypeConverter
    fun markerTypeToString(type: MarkerType): String = type.name
    
    @TypeConverter
    fun stringToMarkerType(str: String): MarkerType = MarkerType.valueOf(str)
    
    @TypeConverter
    fun landmarkTypeToString(type: LandmarkType): String = type.name
    
    @TypeConverter
    fun stringToLandmarkType(str: String): LandmarkType = LandmarkType.valueOf(str)
    
    @TypeConverter
    fun genderToString(gender: Gender?): String? = gender?.name
    
    @TypeConverter
    fun stringToGender(str: String?): Gender? = str?.let { Gender.valueOf(it) }
    
    @TypeConverter
    fun highlightTypeToString(type: HighlightType): String = type.name
    
    @TypeConverter
    fun stringToHighlightType(str: String): HighlightType = HighlightType.valueOf(str)
    
    @TypeConverter
    fun platformToString(platform: Platform?): String? = platform?.name
    
    @TypeConverter
    fun stringToPlatform(str: String?): Platform? = str?.let { Platform.valueOf(it) }
    
    @TypeConverter
    fun permissionLevelToString(level: PermissionLevel): String = level.name
    
    @TypeConverter
    fun stringToPermissionLevel(str: String): PermissionLevel = PermissionLevel.valueOf(str)
}