# WatchTogether

Cross-platform synchronized video watching and voice chat application for Android and iOS.

## Features

- **Local Network Sync**: Watch videos together over Wi-Fi or mobile hotspot without internet
- **<100ms Synchronization**: Advanced clock synchronization with drift correction
- **Voice Chat**: Real-time voice communication with audio ducking
- **Up to 20 Users**: Support for large watch parties
- **MX Player-style Controls**: Gesture controls, speed control, subtitles, audio tracks
- **QR Code Sharing**: Easy room joining via QR codes
- **No Cloud Required**: Fully local operation

## Architecture

```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models (Room, User, Video, Sync messages)
├── screens/                  # UI screens
│   ├── splash_screen.dart
│   ├── home_screen.dart
│   ├── create_room_screen.dart
│   ├── join_room_screen.dart
│   ├── room_lobby_screen.dart
│   ├── video_player_screen.dart
│   ├── settings_screen.dart
│   └── diagnostics_screen.dart
├── components/               # Reusable UI components
│   └── animated_background.dart
├── room/                     # Room management
│   └── room_service.dart
├── sync/                     # Synchronization engine
│   └── sync_engine.dart
├── video/                    # Video playback
│   └── video_engine.dart
├── network/                  # Network services
│   ├── discovery_service.dart
│   └── file_transfer_service.dart
├── voice/                    # Voice chat
│   └── voice_chat_service.dart
├── utils/                    # Utilities
│   ├── logger.dart
│   └── app_theme.dart
└── services/                 # Core services
    └── initialization_service.dart
```

## Synchronization Protocol

The app uses a custom synchronization protocol with:

- **Shared Playback Clock**: All devices maintain synchronized clocks using NTP-like algorithm
- **Heartbeat Messages**: Every 500ms for latency measurement
- **Drift Correction**: Playback rate adjustment for small drifts (<100ms), seeking for large drifts (>500ms)
- **Future Start Time**: Coordinated playback start with 3-second preparation window

## Video Distribution

- Host serves video via local HTTP server with range request support
- Viewers download in 1MB chunks with resume capability
- SHA-256 verification for file integrity
- Peer-assisted distribution (planned)

## Voice Chat

- Opus codec at 48kHz/64kbps
- Voice Activity Detection (VAD)
- Audio ducking: movie volume fades to 30% when someone speaks
- Push-to-talk mode support
- Speaker identification overlay

## Requirements

- Flutter 3.22+
- Dart 3.4+
- Android 10+ (API 29)
- iOS 14+

## Setup

1. Install dependencies:
```bash
flutter pub get
```

2. Generate code:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

3. Run on device:
```bash
flutter run
```

## Android Permissions

Required permissions in `AndroidManifest.xml`:
- Internet & Network State
- WiFi State & Multicast
- Storage (Media files)
- Microphone (Voice chat)
- Foreground Service (Background playback)
- Bluetooth (Audio routing)
- Nearby WiFi Devices (Android 13+)

## iOS Permissions

Required in `Info.plist`:
- Local Network Usage (iOS 14+)
- Microphone Usage
- Camera Usage (QR scanning)
- Photo Library Usage
- Bluetooth Usage
- Background Audio

## Platform-Specific Code

### Android (Kotlin)
- `WatchTogetherPlugin.kt`: Local IP, WiFi info, device info, permissions

### iOS (Swift)
- `WatchTogetherPlugin.swift`: Local IP, Network status, Device info, Volume control

## Building

### Android APK
```bash
flutter build apk --release
```

### Android App Bundle
```bash
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## Testing Synchronization

1. Connect 5+ devices to same Wi-Fi/hotspot
2. Create room on one device (Host)
3. Join from other devices
4. Host starts playback
5. Open Diagnostics screen to view sync quality

Target metrics:
- Average drift: <50ms
- Maximum drift: <100ms
- 95th percentile: <80ms

## Project Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── kotlin/com/watchtogether/WatchTogetherPlugin.kt
│   │   └── res/
│   └── build.gradle
ios/
├── Runner/
│   ├── Info.plist
│   └── WatchTogetherPlugin.swift
lib/
├── main.dart
├── models/
├── screens/
├── components/
├── room/
├── sync/
├── video/
├── network/
├── voice/
├── utils/
└── services/
```

## Key Technologies

- **Flutter** - Cross-platform framework
- **Riverpod** - State management
- **MediaKit** - Hardware-accelerated video playback
- **multicast_dns/Bonjour** - Service discovery
- **UDP** - Fast local discovery
- **HTTP/Range Requests** - Video chunk transfer
- **Opus** - Low-latency voice codec

## License

MIT License - See LICENSE file for details