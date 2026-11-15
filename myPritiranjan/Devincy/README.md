# VideoAI - AI-Controllable Mobile Video Editor

A production-quality mobile video/photo editing application with full MCP (Model Context Protocol) support. Control the editor from your laptop using natural language commands via Claude, OpenCode, or any MCP-compatible LLM client.

## Features

### Video Editing
- Multi-track timeline (video, audio, text, effects, overlay)
- Trim, split, crop, rotate, resize
- Speed control & speed ramping
- Transitions (dissolve, wipe, slide, zoom, 3D, creative)
- Effects & filters (color correction, blur, stylize, LUTs)
- Keyframe animation for all properties
- Color grading (lift/gamma/gain, color wheels, curves)
- Chroma key / green screen
- Background removal
- Picture-in-picture & overlay
- Masking & compositing
- Text & captions (auto-generated from speech)
- Audio editing (volume, fade, ducking, beat sync)

### Photo Editing
- Crop, rotate, perspective correction
- Exposure, contrast, highlights, shadows
- Temperature, tint, vibrance
- Tone curves & color grading
- Sharpening, blur, vignette, grain
- Filters & LUTs
- Text, stickers, drawing
- Background removal
- Batch export

### AI Analysis (Local-First)
- Scene detection
- Silence detection
- Speech recognition
- Face detection
- Object detection
- Highlight detection
- Blur detection
- Extensible provider system (MediaPipe, ML Kit, FFmpeg, Ollama, Cloud APIs)

### MCP Server
- WebSocket transport (JSON-RPC 2.0)
- 50+ tools for full editor control
- Structured project state for LLM context
- Token-based authentication
- mDNS/Bonjour discovery
- QR code connection
- Permission system (Safe/Automation modes)

### Architecture
- Non-destructive editing (project = instructions, not modified media)
- Hardware-accelerated rendering (FFmpeg + MediaCodec)
- Proxy media for smooth timeline scrubbing
- Background export with progress notifications
- Auto-save & project management
- Room database for persistence

## Quick Start

### Prerequisites
- Android Studio Hedgehog or later
- Android 8.0+ (API 26) device
- JDK 17+

### Building
```bash
./gradlew assembleDebug
```

### Running
1. Install on Android device
2. Launch app - it starts MCP server automatically
3. Note the host/port/token or scan QR code
4. Connect from laptop:

```bash
# Using OpenCode
opencode --mcp ws://videoai-phone.local:8765/mcp?token=YOUR_TOKEN

# Using Claude Desktop (configure in claude_desktop_config.json)
{
  "mcpServers": {
    "videoai": {
      "command": "npx",
      "args": ["mcp-client", "ws://videoai-phone.local:8765/mcp?token=YOUR_TOKEN"]
    }
  }
}
```

## Example AI Workflow

```
User: "Edit my vacation video into a 30-second Instagram Reel"

Claude:
1. Connects to phone via MCP
2. Lists media, finds vacation video
3. Analyzes video (scenes, silence, highlights)
4. Creates project with 9:16 canvas
5. Adds best clips, trims silence
6. Adds transitions & zoom effects
7. Generates captions from speech
8. Adds background music, syncs cuts to beat
9. Applies cinematic color grade
10. Exports as travel_reel.mp4
```

## Project Structure

```
VideoAI/
├── app/
│   ├── src/main/
│   │   ├── java/com/videoai/
│   │   │   ├── data/           # Models, Repository, Room DAOs
│   │   │   ├── domain/         # Use cases
│   │   │   ├── engine/         # Timeline, Render, FFmpeg, Proxy
│   │   │   ├── mcp/            # Server, Tools, Transport, Auth
│   │   │   ├── ai/             # Analysis providers
│   │   │   ├── ui/             # Compose screens
│   │   │   ├── discovery/      # mDNS/Bonjour
│   │   │   └── util/           # QR code, helpers
│   │   └── assets/             # LUTs, fonts, shaders
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── gradle/
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## MCP Tools Reference

### Project
- `project_create`, `project_open`, `project_save`, `project_close`
- `project_list`, `project_delete`, `project_duplicate`

### Media
- `media_list`, `media_import`, `media_get_metadata`
- `media_remove`, `media_generate_thumbnail`, `media_generate_proxy`

### Timeline
- `timeline_get`, `timeline_add_clip`, `timeline_remove_clip`
- `timeline_move_clip`, `timeline_split_clip`, `timeline_trim_clip`
- `timeline_add_track`, `timeline_remove_track`, `timeline_reorder_tracks`

### Video
- `video_trim`, `video_crop`, `video_rotate`, `video_resize`
- `video_speed`, `video_reverse`, `video_freeze_frame`, `video_transform`

### Audio
- `audio_add`, `audio_remove`, `audio_volume`, `audio_fade`
- `audio_trim`, `audio_extract`, `audio_ducking`, `audio_beat_detect`

### Text/Captions
- `text_add`, `text_update`, `text_remove`
- `caption_generate`, `caption_add`, `caption_update`, `caption_remove`

### Effects
- `effect_add`, `effect_remove`, `effect_update`
- `filter_apply`, `transition_add`, `transition_remove`

### Keyframes
- `keyframe_add`, `keyframe_update`, `keyframe_remove`

### Color
- `color_adjust`, `color_grade`, `color_lut`

### Overlay
- `overlay_add`, `overlay_remove`, `mask_add`

### AI Analysis
- `analyze_video`, `detect_scenes`, `detect_silence`
- `detect_speech`, `detect_faces`, `detect_objects`
- `detect_highlights`, `detect_blur`

### Export
- `export_video`, `export_project`, `get_export_status`, `export_cancel`

### State
- `get_project_state`, `get_render_status`, `generate_thumbnail`
- `undo`, `redo`, `server_info`

## Configuration

### Server Settings
- Port: 8765 (configurable)
- Auth token: Auto-generated, stored in Android Keystore
- Automation mode: Off by default (requires confirmation for destructive ops)

### Proxy Quality
- Low: 360p
- Medium: 480p (default)
- High: 720p

### AI Providers
- Local: MediaPipe + ML Kit (default)
- Ollama: Local LLM (configure URL/model)
- Cloud: OpenAI/Anthropic compatible (requires API key)

## Export Presets

| Preset | Resolution | FPS | Codec |
|--------|-----------|-----|-------|
| Instagram Reel | 1080x1920 | 30 | H.264 |
| TikTok | 1080x1920 | 30 | H.264 |
| YouTube Shorts | 1080x1920 | 60 | H.264 |
| YouTube 1080p | 1920x1080 | 30 | H.264 |
| YouTube 4K | 3840x2160 | 30 | H.265 |

## License

GPL-3.0 (due to FFmpeg GPL build)

## Roadmap

- [ ] Motion tracking
- [ ] Text-to-speech
- [ ] Voice-over recording
- [ ] Collaborative editing
- [ ] Cloud project sync
- [ ] Plugin system
- [ ] Advanced AI (style transfer, auto-edit templates)

## Contributing

1. Fork the repository
2. Create feature branch
3. Submit PR with tests

## Support

- Issues: GitHub Issues
- Documentation: Wiki
- Community: Discord