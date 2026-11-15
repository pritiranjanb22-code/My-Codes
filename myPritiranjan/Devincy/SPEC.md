# VideoAI - AI-Controllable Mobile Video Editor

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LAPTOP (Claude/OpenCode)                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │   MCP       │───▶│   MCP       │───▶│  Natural    │                     │
│  │   Client    │    │   Protocol  │    │  Language   │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ MCP over WebSocket
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOBILE PHONE (Android App)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  MCP Server  │  │ Auth/Perm    │  │  Discovery   │  │  WebSocket   │   │
│  │  (Tools/Res) │  │  (Token)     │  │  (mDNS/QR)   │  │  Transport   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │            │
│         ▼                 ▼                 ▼                 ▼            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     COMMAND ENGINE                                    │  │
│  │  (Validates, queues, executes editing commands)                      │  │
│  └────────────────────────────────┬──────────────────────────────────────┘  │
│                                   │                                         │
│         ┌─────────────────────────┼─────────────────────────┐              │
│         ▼                         ▼                         ▼              │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐        │
│  │   Project   │          │  Timeline   │          │   Media     │        │
│  │   Manager   │◀────────▶│   Engine    │◀────────▶│   Library   │        │
│  └──────┬──────┘          └──────┬──────┘          └──────┬──────┘        │
│         │                        │                        │               │
│         ▼                        ▼                        ▼               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    VIDEO PROCESSING ENGINE                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │ FFmpeg   │ │ Hardware │ │  Proxy   │ │  Cache   │ │  Render  │   │  │
│  │  │ Wrapper  │ │ Accel    │ │ Generator│ │ Manager  │ │ Pipeline │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  └────────────────────────────────┬──────────────────────────────────────┘  │
│                                   │                                         │
│                                   ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      STORAGE LAYER                                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │ Projects │ │  Media   │ │ Thumbs/  │ │ Waveform │ │  Export  │   │  │
│  │  │  (JSON)  │ │  Files   │ │ Proxies  │ │  Cache   │ │  Output  │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Data Models

### Project
```kotlin
data class Project(
    val id: String,                    // UUID
    val name: String,
    val createdAt: Long,
    val updatedAt: Long,
    val canvas: CanvasConfig,
    val timeline: Timeline,
    val settings: ProjectSettings,
    val version: Int = 1
)

data class CanvasConfig(
    val width: Int,
    val height: Int,
    val aspectRatio: AspectRatio,
    val fps: Int = 30,
    val backgroundColor: Int = 0xFF000000
)

enum class AspectRatio { RATIO_16_9, RATIO_9_16, RATIO_1_1, RATIO_4_5, RATIO_4_3, CUSTOM }
```

### Timeline
```kotlin
data class Timeline(
    val tracks: List<Track>,
    val duration: Long,              // microseconds
    val playbackSpeed: Float = 1.0f
)

data class Track(
    val id: String,
    val type: TrackType,
    val index: Int,
    val clips: List<Clip>,
    val isEnabled: Boolean = true,
    val isLocked: Boolean = false,
    val volume: Float = 1.0f        // for audio tracks
)

enum class TrackType { VIDEO, AUDIO, TEXT, EFFECT, OVERLAY }
```

### Clip
```kotlin
data class Clip(
    val id: String,
    val mediaId: String,
    val trackId: String,
    val startTime: Long,             // position on timeline (microseconds)
    val duration: Long,              // visible duration on timeline
    val sourceIn: Long,              // source media in-point
    val sourceOut: Long,             // source media out-point
    val speed: Float = 1.0f,
    val transform: Transform = Transform(),
    val opacity: Float = 1.0f,
    val blendMode: BlendMode = BlendMode.NORMAL,
    val effects: List<Effect> = emptyList(),
    val keyframes: List<Keyframe> = emptyList(),
    val audioConfig: AudioConfig = AudioConfig()
)

data class Transform(
    val x: Float = 0f,
    val y: Float = 0f,
    val scaleX: Float = 1f,
    val scaleY: Float = 1f,
    val rotation: Float = 0f,
    val anchorX: Float = 0.5f,
    val anchorY: Float = 0.5f
)
```

### Media
```kotlin
data class Media(
    val id: String,
    val uri: String,
    val type: MediaType,
    val width: Int,
    val height: Int,
    val duration: Long,
    val fps: Float,
    val hasAudio: Boolean,
    val audioChannels: Int,
    val fileSize: Long,
    val mimeType: String,
    val dateAdded: Long,
    val metadata: Map<String, String> = emptyMap(),
    val thumbnailPath: String? = null,
    val proxyPath: String? = null,
    val waveformPath: String? = null
)

enum class MediaType { VIDEO, IMAGE, AUDIO }
```

### Effects & Keyframes
```kotlin
data class Effect(
    val id: String,
    val type: EffectType,
    val parameters: Map<String, Any>,
    val enabled: Boolean = true,
    val keyframes: List<Keyframe> = emptyList()
)

enum class EffectType {
    // Color
    BRIGHTNESS, CONTRAST, SATURATION, EXPOSURE, HIGHLIGHTS, SHADOWS,
    TEMPERATURE, TINT, VIBRANCE, GAMMA, LUT,
    // Blur
    GAUSSIAN_BLUR, MOTION_BLUR, BOX_BLUR,
    // Stylize
    VIGNETTE, FILM_GRAIN, CHROMATIC_ABERRATION, HALFTONE,
    // Transform
    CROP, ROTATE, FLIP_H, FLIP_V, PERSPECTIVE,
    // Audio
    VOLUME, FADE_IN, FADE_OUT, EQUALIZER, NOISE_REDUCTION,
    // Advanced
    CHROMA_KEY, BACKGROUND_REMOVAL, MASK
}

data class Keyframe(
    val id: String,
    val time: Long,                  // microseconds on clip timeline
    val property: String,            // e.g., "transform.scaleX", "effects[0].parameters.intensity"
    val value: Any,
    val easing: Easing = Easing.LINEAR
)

enum class Easing { LINEAR, EASE_IN, EASE_OUT, EASE_IN_OUT, CUSTOM }
```

## MCP Tool Specification

### Project Tools
```json
{
  "project_create": {
    "description": "Create a new project",
    "input": {
      "name": "string",
      "canvas": { "width": "int", "height": "int", "fps": "int?" },
      "template": "string?"
    },
    "output": { "projectId": "string", "project": "Project" }
  },
  "project_open": {
    "description": "Open existing project",
    "input": { "projectId": "string" },
    "output": { "project": "Project" }
  },
  "project_save": {
    "description": "Save current project",
    "input": { "projectId": "string?" },
    "output": { "projectId": "string", "savedAt": "long" }
  },
  "project_close": {
    "description": "Close project",
    "input": { "projectId": "string" },
    "output": { "success": "boolean" }
  },
  "project_list": {
    "description": "List all projects",
    "input": {},
    "output": { "projects": "ProjectSummary[]" }
  },
  "project_delete": {
    "description": "Delete project (destructive)",
    "input": { "projectId": "string", "confirm": "boolean" },
    "output": { "success": "boolean" }
  },
  "project_duplicate": {
    "description": "Duplicate project",
    "input": { "projectId": "string", "newName": "string?" },
    "output": { "projectId": "string", "project": "Project" }
  }
}
```

### Media Tools
```json
{
  "media_list": {
    "description": "List media files",
    "input": { "type": "MediaType?", "folder": "string?", "limit": "int?", "offset": "int?" },
    "output": { "media": "Media[]", "total": "int" }
  },
  "media_import": {
    "description": "Import media from URI",
    "input": { "uri": "string", "name": "string?", "generateProxy": "boolean?" },
    "output": { "media": "Media" }
  },
  "media_get_metadata": {
    "description": "Get detailed media metadata",
    "input": { "mediaId": "string" },
    "output": { "metadata": "MediaMetadata" }
  },
  "media_remove": {
    "description": "Remove media from library (destructive)",
    "input": { "mediaId": "string", "confirm": "boolean" },
    "output": { "success": "boolean" }
  },
  "media_generate_thumbnail": {
    "description": "Generate thumbnail at specific time",
    "input": { "mediaId": "string", "time": "long", "width": "int?", "height": "int?" },
    "output": { "thumbnailPath": "string" }
  },
  "media_generate_proxy": {
    "description": "Generate proxy for editing",
    "input": { "mediaId": "string", "quality": "ProxyQuality?" },
    "output": { "proxyPath": "string" }
  }
}
```

### Timeline Tools
```json
{
  "timeline_get": {
    "description": "Get full timeline state",
    "input": { "projectId": "string" },
    "output": { "timeline": "Timeline" }
  },
  "timeline_add_clip": {
    "description": "Add clip to timeline",
    "input": {
      "projectId": "string",
      "mediaId": "string",
      "trackId": "string?",
      "trackType": "TrackType",
      "startTime": "long",
      "sourceIn": "long?",
      "sourceOut": "long?",
      "duration": "long?"
    },
    "output": { "clip": "Clip", "trackId": "string" }
  },
  "timeline_remove_clip": {
    "description": "Remove clip from timeline",
    "input": { "projectId": "string", "clipId": "string" },
    "output": { "success": "boolean" }
  },
  "timeline_move_clip": {
    "description": "Move clip to new position/track",
    "input": { "projectId": "string", "clipId": "string", "trackId": "string?", "startTime": "long?" },
    "output": { "clip": "Clip" }
  },
  "timeline_split_clip": {
    "description": "Split clip at time",
    "input": { "projectId": "string", "clipId": "string", "time": "long" },
    "output": { "clips": "Clip[]" }
  },
  "timeline_trim_clip": {
    "description": "Trim clip in/out points",
    "input": { "projectId": "string", "clipId": "string", "sourceIn": "long?", "sourceOut": "long?" },
    "output": { "clip": "Clip" }
  },
  "timeline_add_track": {
    "description": "Add new track",
    "input": { "projectId": "string", "type": "TrackType", "index": "int?" },
    "output": { "track": "Track" }
  },
  "timeline_remove_track": {
    "description": "Remove track",
    "input": { "projectId": "string", "trackId": "string" },
    "output": { "success": "boolean" }
  },
  "timeline_reorder_tracks": {
    "description": "Reorder tracks",
    "input": { "projectId": "string", "trackIds": "string[]" },
    "output": { "tracks": "Track[]" }
  }
}
```

### Video Editing Tools
```json
{
  "video_trim": {
    "description": "Trim video clip",
    "input": { "clipId": "string", "start": "long", "end": "long" },
    "output": { "clip": "Clip" }
  },
  "video_crop": {
    "description": "Crop video",
    "input": { "clipId": "string", "x": "float", "y": "float", "width": "float", "height": "float", "unit": "Unit" },
    "output": { "clip": "Clip" }
  },
  "video_rotate": {
    "description": "Rotate video",
    "input": { "clipId": "string", "degrees": "float" },
    "output": { "clip": "Clip" }
  },
  "video_resize": {
    "description": "Resize video to fit canvas",
    "input": { "clipId": "string", "fit": "FitMode" },
    "output": { "clip": "Clip" }
  },
  "video_speed": {
    "description": "Change clip speed",
    "input": { "clipId": "string", "speed": "float", "maintainPitch": "boolean?" },
    "output": { "clip": "Clip" }
  },
  "video_reverse": {
    "description": "Reverse clip playback",
    "input": { "clipId": "string" },
    "output": { "clip": "Clip" }
  },
  "video_freeze_frame": {
    "description": "Create freeze frame at time",
    "input": { "clipId": "string", "time": "long", "duration": "long" },
    "output": { "clip": "Clip" }
  },
  "video_transform": {
    "description": "Set transform (position, scale, rotation)",
    "input": { "clipId": "string", "transform": "Transform" },
    "output": { "clip": "Clip" }
  }
}
```

### Audio Tools
```json
{
  "audio_add": {
    "description": "Add audio to timeline",
    "input": { "projectId": "string", "mediaId": "string", "trackId": "string?", "startTime": "long", "volume": "float?" },
    "output": { "clip": "Clip" }
  },
  "audio_remove": {
    "description": "Remove audio clip",
    "input": { "projectId": "string", "clipId": "string" },
    "output": { "success": "boolean" }
  },
  "audio_volume": {
    "description": "Set clip volume",
    "input": { "clipId": "string", "volume": "float", "keyframes": "Keyframe[]?" },
    "output": { "clip": "Clip" }
  },
  "audio_fade": {
    "description": "Add fade in/out",
    "input": { "clipId": "string", "fadeIn": "long?", "fadeOut": "long?" },
    "output": { "clip": "Clip" }
  },
  "audio_trim": {
    "description": "Trim audio clip",
    "input": { "clipId": "string", "start": "long", "end": "long" },
    "output": { "clip": "Clip" }
  },
  "audio_extract": {
    "description": "Extract audio from video clip",
    "input": { "clipId": "string" },
    "output": { "audioMediaId": "string" }
  },
  "audio_ducking": {
    "description": "Auto-duck background music under voice",
    "input": { "projectId": "string", "voiceTrackId": "string", "musicTrackId": "string", "amount": "float" },
    "output": { "success": "boolean" }
  },
  "audio_beat_detect": {
    "description": "Detect beats in audio",
    "input": { "mediaId": "string" },
    "output": { "beats": "long[]" }
  }
}
```

### Text/Caption Tools
```json
{
  "text_add": {
    "description": "Add text layer",
    "input": {
      "projectId": "string",
      "text": "string",
      "trackId": "string?",
      "startTime": "long",
      "duration": "long",
      "style": "TextStyle"
    },
    "output": { "clip": "Clip" }
  },
  "text_update": {
    "description": "Update text content/style",
    "input": { "clipId": "string", "text": "string?", "style": "TextStyle?" },
    "output": { "clip": "Clip" }
  },
  "text_remove": {
    "description": "Remove text layer",
    "input": { "clipId": "string" },
    "output": { "success": "boolean" }
  },
  "caption_generate": {
    "description": "Auto-generate captions from speech",
    "input": { "projectId": "string", "mediaId": "string", "language": "string?", "style": "CaptionStyle?" },
    "output": { "captions": "Caption[]" }
  },
  "caption_add": {
    "description": "Add caption track",
    "input": { "projectId": "string", "captions": "Caption[]", "style": "CaptionStyle" },
    "output": { "clips": "Clip[]" }
  }
}
```

### Effects & Transitions
```json
{
  "effect_add": {
    "description": "Add effect to clip",
    "input": { "clipId": "string", "effect": "Effect" },
    "output": { "clip": "Clip" }
  },
  "effect_remove": {
    "description": "Remove effect from clip",
    "input": { "clipId": "string", "effectId": "string" },
    "output": { "clip": "Clip" }
  },
  "effect_update": {
    "description": "Update effect parameters",
    "input": { "clipId": "string", "effectId": "string", "parameters": "Map<string, any>" },
    "output": { "clip": "Clip" }
  },
  "filter_apply": {
    "description": "Apply LUT/filter",
    "input": { "clipId": "string", "lutPath": "string?", "intensity": "float?" },
    "output": { "clip": "Clip" }
  },
  "transition_add": {
    "description": "Add transition between clips",
    "input": { "projectId": "string", "fromClipId": "string", "toClipId": "string", "type": "TransitionType", "duration": "long" },
    "output": { "transition": "Transition" }
  },
  "transition_remove": {
    "description": "Remove transition",
    "input": { "projectId": "string", "transitionId": "string" },
    "output": { "success": "boolean" }
  }
}
```

### Keyframe Tools
```json
{
  "keyframe_add": {
    "description": "Add keyframe",
    "input": { "clipId": "string", "property": "string", "time": "long", "value": "any", "easing": "Easing?" },
    "output": { "keyframe": "Keyframe" }
  },
  "keyframe_update": {
    "description": "Update keyframe",
    "input": { "clipId": "string", "keyframeId": "string", "time": "long?", "value": "any?", "easing": "Easing?" },
    "output": { "keyframe": "Keyframe" }
  },
  "keyframe_remove": {
    "description": "Remove keyframe",
    "input": { "clipId": "string", "keyframeId": "string" },
    "output": { "success": "boolean" }
  }
}
```

### Color Tools
```json
{
  "color_adjust": {
    "description": "Adjust color parameters",
    "input": { "clipId": "string", "adjustments": "ColorAdjustments" },
    "output": { "clip": "Clip" }
  },
  "color_grade": {
    "description": "Apply cinematic color grade",
    "input": { "clipId": "string", "preset": "string", "intensity": "float?" },
    "output": { "clip": "Clip" }
  },
  "color_lut": {
    "description": "Apply LUT file",
    "input": { "clipId": "string", "lutPath": "string", "intensity": "float?" },
    "output": { "clip": "Clip" }
  }
}
```

### Overlay/PIP Tools
```json
{
  "overlay_add": {
    "description": "Add overlay (image/video) as PiP",
    "input": { "projectId": "string", "mediaId": "string", "trackId": "string?", "startTime": "long", "duration": "long", "transform": "Transform?" },
    "output": { "clip": "Clip" }
  },
  "overlay_remove": {
    "description": "Remove overlay",
    "input": { "clipId": "string" },
    "output": { "success": "boolean" }
  },
  "mask_add": {
    "description": "Add mask to clip",
    "input": { "clipId": "string", "mask": "Mask" },
    "output": { "clip": "Clip" }
  }
}
```

### AI Analysis Tools
```json
{
  "analyze_video": {
    "description": "Comprehensive video analysis",
    "input": { "mediaId": "string", "analyses": "AnalysisType[]" },
    "output": { "analysis": "VideoAnalysis" }
  },
  "detect_scenes": {
    "description": "Detect scene changes",
    "input": { "mediaId": "string", "threshold": "float?" },
    "output": { "scenes": "Scene[]" }
  },
  "detect_silence": {
    "description": "Detect silent sections",
    "input": { "mediaId": "string", "thresholdDb": "float?", "minDuration": "long?" },
    "output": { "silences": "SilenceSegment[]" }
  },
  "detect_speech": {
    "description": "Detect speech segments",
    "input": { "mediaId": "string", "language": "string?" },
    "output": { "speechSegments": "SpeechSegment[]" }
  },
  "detect_faces": {
    "description": "Detect faces in video",
    "input": { "mediaId": "string" },
    "output": { "faces": "FaceDetection[]" }
  },
  "detect_objects": {
    "description": "Detect objects in video",
    "input": { "mediaId": "string", "classes": "string[]?" },
    "output": { "objects": "ObjectDetection[]" }
  },
  "detect_highlights": {
    "description": "Detect highlight moments",
    "input": { "mediaId": "string", "criteria": "HighlightCriteria?" },
    "output": { "highlights": "Highlight[]" }
  },
  "detect_blur": {
    "description": "Detect blurry frames",
    "input": { "mediaId": "string", "threshold": "float?" },
    "output": { "blurrySegments": "TimeRange[]" }
  }
}
```

### Export Tools
```json
{
  "export_video": {
    "description": "Export final video",
    "input": {
      "projectId": "string",
      "outputPath": "string?",
      "preset": "ExportPreset?",
      "customSettings": "ExportSettings?"
    },
    "output": { "exportId": "string", "status": "ExportStatus" }
  },
  "export_project": {
    "description": "Export project file for backup",
    "input": { "projectId": "string", "outputPath": "string?" },
    "output": { "filePath": "string" }
  },
  "get_export_status": {
    "description": "Get export progress",
    "input": { "exportId": "string" },
    "output": { "status": "ExportStatus", "progress": "float", "outputPath": "string?" }
  },
  "export_cancel": {
    "description": "Cancel ongoing export",
    "input": { "exportId": "string" },
    "output": { "success": "boolean" }
  }
}
```

### State & Utility Tools
```json
{
  "get_project_state": {
    "description": "Get complete project state for LLM",
    "input": { "projectId": "string" },
    "output": { "state": "ProjectState" }
  },
  "get_render_status": {
    "description": "Get preview render status",
    "input": { "projectId": "string" },
    "output": { "status": "RenderStatus" }
  },
  "generate_thumbnail": {
    "description": "Generate project thumbnail",
    "input": { "projectId": "string", "time": "long?" },
    "output": { "thumbnailPath": "string" }
  },
  "undo": {
    "description": "Undo last operation",
    "input": { "projectId": "string" },
    "output": { "success": "boolean", "description": "string" }
  },
  "redo": {
    "description": "Redo last undone operation",
    "input": { "projectId": "string" },
    "output": { "success": "boolean", "description": "string" }
  },
  "server_info": {
    "description": "Get server information",
    "input": {},
    "output": { "info": "ServerInfo" }
  }
}
```

## Project State (for LLM Context)

```kotlin
data class ProjectState(
    val project: Project,
    val timeline: Timeline,
    val mediaLibrary: List<MediaSummary>,
    val currentSelection: Selection?,
    val playbackState: PlaybackState,
    val renderStatus: RenderStatus,
    val exportQueue: List<ExportJob>
)

data class MediaSummary(
    val id: String,
    val name: String,
    val type: MediaType,
    val duration: Long,
    val width: Int,
    val height: Int,
    val thumbnailPath: String?
)

data class Selection(
    val clipIds: List<String>,
    val trackIds: List<String>,
    val timeRange: TimeRange?
)
```

## MCP Server Implementation

### Transport
- WebSocket on `ws://<host>:<port>/mcp`
- JSON-RPC 2.0 protocol
- Support for MCP initialize, tools/list, tools/call, resources/list, resources/read

### Authentication
- Token-based auth (generated on first run, displayed in app)
- QR code contains: `videoai://connect?host=videoai-phone.local&port=8765&token=abc123`
- mDNS service: `_videoai._tcp.local.`

### Permission System
```kotlin
enum class PermissionLevel {
    READ,      // List, get state, analyze
    WRITE,     // Create, modify, add clips
    DESTRUCTIVE // Delete, overwrite, export overwrite
}

data class PermissionRequest(
    val operation: String,
    val level: PermissionLevel,
    val description: String,
    val affectedResources: List<String>
)
```

## Video Processing Engine

### FFmpeg Integration
- Use `mobile-ffmpeg` or `ffmpeg-kit` for Android
- Hardware acceleration via MediaCodec
- Command building for complex filter graphs

### Proxy Generation
- 480p/720p proxies for smooth timeline scrubbing
- H.264 baseline profile for compatibility
- Generated on import (background)

### Render Pipeline
```
Timeline → Filter Graph Builder → FFmpeg Command → Hardware Encoder → Output
                │
                ├─ Video filters (color, transform, effects)
                ├─ Audio filters (volume, fade, mix)
                ├─ Overlay/PIP composition
                ├─ Text/caption rendering
                └─ Transition blending
```

## AI Analysis Abstraction

```kotlin
interface VideoAnalyzer {
    suspend fun analyze(media: Media, types: Set<AnalysisType>): VideoAnalysis
    suspend fun detectScenes(media: Media, threshold: Float): List<Scene>
    suspend fun detectSilence(media: Media, thresholdDb: Float, minDuration: Long): List<SilenceSegment>
    suspend fun detectSpeech(media: Media, language: String?): List<SpeechSegment>
    suspend fun detectFaces(media: Media): List<FaceDetection>
    suspend fun detectObjects(media: Media, classes: List<String>?): List<ObjectDetection>
    suspend fun detectHighlights(media: Media, criteria: HighlightCriteria): List<Highlight>
    suspend fun detectBlur(media: Media, threshold: Float): List<TimeRange>
}

enum class AnalysisType { SCENES, SILENCE, SPEECH, FACES, OBJECTS, HIGHLIGHTS, BLUR }

data class VideoAnalysis(
    val scenes: List<Scene>,
    val silences: List<SilenceSegment>,
    val speechSegments: List<SpeechSegment>,
    val faces: List<FaceDetection>,
    val objects: List<ObjectDetection>,
    val highlights: List<Highlight>,
    val blurrySegments: List<TimeRange>,
    val duration: Long
)
```

### Implementation Providers
1. **Local Android ML** - MediaPipe, ML Kit
2. **ONNX Runtime** - Custom models
3. **Ollama** - Local LLM on phone
4. **Cloud APIs** - Optional (OpenAI, Anthropic, etc.)

## UI Architecture (Jetpack Compose)

### Screens
1. **Home** - Project list, media library, server status
2. **Project Editor** - Timeline, preview, toolbar
3. **Media Picker** - Grid view, folders, import
4. **Export** - Presets, progress, queue
5. **Settings** - Server config, auth, proxies, AI providers
6. **Connection** - QR code, connection status, connected clients

### Key Components
- `TimelineView` - Multi-track, zoom, scrubber
- `PreviewPlayer` - Hardware-accelerated preview
- `MediaGrid` - Virtualized media list
- `EffectPanel` - Effect controls with keyframes
- `ColorGradePanel` - Color wheels, curves, LUTs
- `ExportDialog` - Presets, custom settings

## Networking

### Discovery
```kotlin
// mDNS registration
val serviceInfo = NsdServiceInfo().apply {
    serviceName = "VideoAI Phone"
    serviceType = "_videoai._tcp."
    port = 8765
    setAttribute("version", "1.0")
    setAttribute("token", authToken)
}
```

### QR Code Format
```
videoai://connect?
  host=videoai-phone.local
  &port=8765
  &token=<base64_token>
  &name=VideoAI%20Phone
```

## Security

### Safe Mode (Default)
- All DESTRUCTIVE operations require confirmation
- Confirmation shown on phone UI
- LLM receives `requiresConfirmation: true` in response

### Automation Mode
- User explicitly enables
- All operations execute without confirmation
- Warning shown in UI

### Token Management
- 256-bit random token generated on first run
- Stored in Android Keystore
- Rotatable via settings
- Displayed in QR code

## File Structure

```
VideoAI/
├── app/
│   ├── src/main/
│   │   ├── java/com/videoai/
│   │   │   ├── data/
│   │   │   │   ├── model/
│   │   │   │   ├── repository/
│   │   │   │   └── dao/
│   │   │   ├── domain/
│   │   │   │   ├── usecase/
│   │   │   │   └── repository/
│   │   │   ├── engine/
│   │   │   │   ├── timeline/
│   │   │   │   ├── render/
│   │   │   │   ├── ffmpeg/
│   │   │   │   └── proxy/
│   │   │   ├── mcp/
│   │   │   │   ├── server/
│   │   │   │   ├── tools/
│   │   │   │   ├── transport/
│   │   │   │   └── auth/
│   │   │   ├── ai/
│   │   │   │   ├── analysis/
│   │   │   │   └── provider/
│   │   │   ├── ui/
│   │   │   │   ├── home/
│   │   │   │   ├── editor/
│   │   │   │   ├── media/
│   │   │   │   ├── export/
│   │   │   │   └── settings/
│   │   │   ├── discovery/
│   │   │   └── util/
│   │   ├── assets/
│   │   │   ├── luts/
│   │   │   ├── fonts/
│   │   │   └── shaders/
│   │   └── AndroidManifest.xml
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── gradle/
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## Dependencies

```kotlin
// Core
implementation("androidx.core:core-ktx:1.12.0")
implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
implementation("androidx.activity:activity-compose:1.8.2")
implementation("androidx.compose.ui:ui:1.6.0")
implementation("androidx.compose.material3:material3:1.2.0")
implementation("androidx.compose.material:material-icons-extended:1.6.0")
implementation("androidx.navigation:navigation-compose:2.7.6")
implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
implementation("com.google.dagger:hilt-android:2.48")
kapt("com.google.dagger:hilt-compiler:2.48")

// Database
implementation("androidx.room:room-runtime:2.6.1")
implementation("androidx.room:room-ktx:2.6.1")
kapt("androidx.room:room-compiler:2.6.1")

// Coroutines/Flow
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-flow:1.7.3")

// Serialization
implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
implementation("org.jetbrains.kotlinx:kotlinx-serialization-protobuf:1.6.3")

// Networking
implementation("com.squareup.okhttp3:okhttp:4.12.0")
implementation("com.squareup.okio:okio:3.5.0")
implementation("org.java-websocket:Java-WebSocket:1.5.4")
implementation("org.jmdns:jmdns:3.5.6")

// Media/FFmpeg
implementation("com.arthenica:mobile-ffmpeg-full-gpl:4.4.3.LTS")
implementation("androidx.media3:media3-exoplayer:1.4.0")
implementation("androidx.media3:media3-ui:1.4.0")

// Image loading
implementation("io.coil-kt:coil-compose:2.5.0")

// QR Code
implementation("com.google.zxing:core:3.5.1")
implementation("com.journeyapps:zxing-android-embedded:4.3.0")

// AI/ML
implementation("com.google.mlkit:vision:17.0.0")
implementation("com.google.mediapipe:tasks-vision:0.10.14")

// Testing
testImplementation("junit:junit:4.13.2")
testImplementation("org.mockito:mockito-core:5.7.0")
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
androidTestImplementation("androidx.test.ext:junit:1.1.5")
androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
androidTestImplementation("androidx.compose.ui:ui-test-junit4:1.6.0")
androidTestImplementation("androidx.compose.ui:ui-test-manifest:1.6.0")
```

## Build Configuration

```kotlin
// gradle.properties
android.enableJetifier=true
android.nonTransitiveRClass=true
kotlin.code.style=official
kotlin.serialization.compiler.plugin.version=1.6.3

// FFmpeg
ffmpeg.version=4.4.3.LTS
```

## Phased Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Android project setup with Gradle/Kotlin
- [ ] Room database for projects/media
- [ ] Core data models
- [ ] Basic MCP server with WebSocket
- [ ] Authentication system
- [ ] mDNS discovery + QR code

### Phase 2: Media & Project Management (Week 2-3)
- [ ] Media scanner/importer
- [ ] Metadata extraction (MediaMetadataRetriever)
- [ ] Thumbnail/proxy generation
- [ ] Project CRUD operations
- [ ] Auto-save system

### Phase 3: Timeline Engine (Week 3-4)
- [ ] Timeline data model
- [ ] Track/clip management
- [ ] Non-destructive edit commands
- [ ] Undo/redo system
- [ ] Timeline serialization

### Phase 4: Video Processing (Week 4-5)
- [ ] FFmpeg wrapper
- [ ] Filter graph builder
- [ ] Hardware acceleration
- [ ] Proxy playback
- [ ] Preview rendering

### Phase 5: Editing Features (Week 5-7)
- [ ] Trim/split/crop/rotate
- [ ] Speed control/ramping
- [ ] Transitions
- [ ] Effects system
- [ ] Color grading
- [ ] Keyframe animation
- [ ] Text/captions
- [ ] Audio editing
- [ ] Overlay/PIP
- [ ] Chroma key
- [ ] Masking

### Phase 6: AI Analysis (Week 7-8)
- [ ] Analysis abstraction layer
- [ ] Scene detection (MediaPipe)
- [ ] Silence detection (FFmpeg)
- [ ] Speech detection (ML Kit)
- [ ] Face detection (MediaPipe)
- [ ] Highlight detection

### Phase 7: MCP Tools (Week 8-9)
- [ ] All MCP tool implementations
- [ ] Project state serialization for LLM
- [ ] Permission system
- [ ] Tool validation

### Phase 8: Export & Polish (Week 9-10)
- [ ] Export pipeline
- [ ] Export presets
- [ ] Background export
- [ ] UI polish
- [ ] Performance optimization
- [ ] Testing

### Phase 9: Photo Editor (Week 10-11)
- [ ] Photo editing tools
- [ ] MCP tools for photos
- [ ] Export

## Testing Strategy

### Unit Tests
- Data models serialization
- Timeline operations
- Command engine
- MCP tool handlers

### Integration Tests
- MCP server client communication
- FFmpeg command generation
- Export pipeline
- Media import/analysis

### UI Tests
- Timeline interactions
- Media picker
- Export flow
- Connection flow

### Performance Tests
- Timeline scrubbing (60fps)
- Proxy generation time
- Export time vs desktop
- Memory usage

## Future Extensibility

### Plugin System
- Effect plugins
- Transition plugins
- AI provider plugins
- Export format plugins

### Cloud Sync (Optional)
- Project backup
- Cross-device editing
- Collaborative editing

### Advanced AI
- Text-to-video
- Style transfer
- Auto-edit templates
- Voice cloning

## Legal/Compliance

### FFmpeg Licensing
- Use GPL build (mobile-ffmpeg-full-gpl)
- App must be GPL-compatible
- Provide source code offer

### Privacy
- No data leaves device without user consent
- Local-first architecture
- Optional cloud AI with explicit opt-in

### Platform Requirements
- Android 8.0+ (API 26)
- Requires: CAMERA, MICROPHONE, STORAGE, NETWORK
- Target: Android 14 (API 34)