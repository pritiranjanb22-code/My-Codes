# 📡 WiFiTalk

**"Your Network. Your Chat. Your Calls."**

A WhatsApp-like communication application that works primarily over your private Wi-Fi/network infrastructure. No internet required for local communication.

## ✨ Features

### 💬 Messaging
- **Text messaging** - Direct and group chats
- **Media sharing** - Photos, videos, documents, voice notes
- **File transfer** - Large file support with resume/pause
- **End-to-end encryption** - All messages encrypted locally
- **Store-and-forward** - Messages delivered when recipient comes online

### 📞 Voice & Video Calls
- **WebRTC-based** - High-quality audio/video
- **Adaptive bitrate** - Automatically adjusts to network conditions
- **Echo cancellation & noise suppression**
- **Group calls** - Multiple participants support

### 🎙️ Walkie-Talkie (Push-to-Talk)
- **Hold-to-talk** - Large central button for instant communication
- **Channels** - Create public/private/emergency channels
- **Priority channels** - Emergency channel interrupts normal audio
- **Low latency** - Optimized for real-time voice

### 📡 Network Discovery
- **mDNS/Bonjour** - Automatic peer discovery
- **UDP broadcast** - Cross-subnet discovery
- **Manual pairing** - QR codes and 6-digit codes
- **Multi-router support** - Works across complex network topologies
- **Relay nodes** - Devices can act as discovery relays

### 🔒 Security & Privacy
- **Local-first** - No cloud required for local features
- **E2E encryption** - Using established crypto libraries
- **Device trust** - Fingerprint verification
- **No tracking** - No analytics, no data collection
- **Offline capable** - Full functionality without internet

## 🏗️ Architecture

```
WiFiTalk/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens (Chats, Calls, Walkie, Network, Settings)
│   ├── services/        # Core services
│   │   ├── IdentityService.ts      # User/device identity & keys
│   │   ├── DiscoveryService.ts     # mDNS, UDP, manual discovery
│   │   ├── TransportService.ts     # WebRTC, TCP, Relay transports
│   │   ├── MessagingService.ts     # Chat, groups, messages
│   │   ├── PairingService.ts       # QR codes, pairing codes
│   │   ├── WalkieTalkieService.ts  # Push-to-talk channels
│   │   ├── FileTransferService.ts  # Chunked file transfer
│   │   └── NetworkDiagnosticsService.ts # Network analysis
│   ├── store/           # Zustand state management
│   ├── db/              # SQLite database schema & service
│   ├── types/           # TypeScript type definitions
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   └── navigation/      # Navigation configuration
├── android/             # Android native code
├── ios/                 # iOS native code
└── App.tsx              # Main app entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio / Xcode
- JDK 11+

### Installation

```bash
# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..

# Start Metro
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📱 Supported Platforms
- **Android** 6.0+ (API 23+)
- **iOS** 15.1+
- **Desktop** (Windows/Linux/macOS) - Planned

## 🌐 Network Requirements

### Local Communication (No Internet)
- Devices on same Wi-Fi network
- Multicast enabled on router
- Port 8484 (UDP/TCP) open

### Cross-Subnet
- Inter-VLAN routing configured
- Or manual IP pairing
- Or relay node on each subnet

### Internet Features (Optional)
- Cloud backup
- Push notifications
- Remote communication

## 🔧 Configuration

### Android Permissions
```xml
<!-- Network & Discovery -->
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
<uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" />

<!-- Media -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Background -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
```

### iOS Permissions
```xml
<key>NSCameraUsageDescription</key>
<string>WiFiTalk needs camera access for video calls and QR code scanning</string>
<key>NSMicrophoneUsageDescription</key>
<string>WiFiTalk needs microphone access for voice calls and walkie-talkie</string>
<key>NSLocalNetworkUsageDescription</key>
<string>WiFiTalk uses local network to discover and communicate with nearby devices</string>
<key>NSBonjourServices</key>
<array>
    <string>_wifitalk._tcp</string>
</array>
<key>UIBackgroundModes</key>
<array>
    <string>voip</string>
    <string>audio</string>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `react-native-webrtc` | Voice/video calls |
| `react-native-zeroconf` | mDNS discovery |
| `react-native-udp` | UDP broadcast |
| `react-native-sqlite-storage` | Local database |
| `react-native-mmkv` | Fast key-value storage |
| `react-native-gifted-chat` | Chat UI |
| `react-native-qrcode-svg` | QR code generation |
| `react-native-push-notification` | Local notifications |
| `react-native-reanimated` | Animations |
| `zustand` | State management |
| `crypto` | Encryption |

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm test
```

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

- GitHub Issues: [Report bugs](https://github.com/wifitalk/wifitalk/issues)
- Discussions: [Community forum](https://github.com/wifitalk/wifitalk/discussions)

---

**Built with ❤️ for local-first communication**