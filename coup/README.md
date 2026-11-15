# Couple Quest

A romantic couples game for Android, designed for consenting adults 18+ who want to strengthen their relationship through playful games, intimate challenges, and private conversations.

## Features

- **One-Phone Mode**: Pass-and-play on a single device
- **Two-Phone Mode**: Local multiplayer via Wi-Fi or Bluetooth
- **Game Modes**:
  - Truth or Dare (Romantic, Funny, Deep, Playful, Adult)
  - Intimate Positions (Educational, consent-focused)
  - Romantic Challenges (Dates, Compliments, Affection, Gestures)
  - Couple Questions (Communication, Trust, Future, Memories)
- **Private Chat**: Temporary, encrypted, auto-deleting messages
- **Privacy First**: No cloud backup, no tracking, local-first storage
- **Beautiful UI**: Romantic design, dark/light themes, smooth animations

## Requirements

- Android Studio Koala (2024.1.1) or later
- JDK 17
- Android SDK 34
- Minimum SDK 26 (Android 8.0)
- Target SDK 34 (Android 14)

## Building the Project

### 1. Clone and Open

```bash
git clone <repository-url>
cd CoupleQuest
```

Open in Android Studio.

### 2. Build Debug APK

```bash
./gradlew assembleDebug
```

The APK will be at `app/build/outputs/apk/debug/app-debug.apk`

### 3. Build Release APK

```bash
./gradlew assembleRelease
```

### 4. Run Tests

```bash
# Unit tests
./gradlew test

# Instrumented tests (requires device/emulator)
./gradlew connectedAndroidTest
```

## Testing on Two Physical Devices

### One-Phone Mode
1. Install the app on one phone
2. Launch and follow the setup flow
3. Select "One Phone (Pass & Play)"
4. Complete player profiles
5. Play by passing the phone back and forth

### Two-Phone Wi-Fi Mode
1. Connect both phones to the **same Wi-Fi network**
2. Install the app on both phones
3. On Phone 1 (Host):
   - Launch app → Choose game mode → Set up profiles
   - Select "Same Wi-Fi Network"
   - Tap "Create Room"
   - Note the 6-character room code
4. On Phone 2 (Joiner):
   - Launch app → Choose same game mode → Set up profiles
   - Select "Same Wi-Fi Network"
   - Tap "Join Room"
   - Enter the room code from Phone 1
5. Both phones should show "Connected" status
6. Start playing!

### Two-Phone Bluetooth Mode
1. Enable Bluetooth on both phones
2. Pair the phones in Android Settings (if not already paired)
3. Install the app on both phones
4. On Phone 1 (Host):
   - Launch app → Choose game mode → Set up profiles
   - Select "Bluetooth"
   - Tap "Create Room"
5. On Phone 2 (Joiner):
   - Launch app → Choose same game mode → Set up profiles
   - Select "Bluetooth"
   - Tap "Join Room"
   - Select the host device from the list
6. Accept pairing prompt if shown
7. Start playing!

## Troubleshooting

### Wi-Fi Connection Issues
- Ensure both devices are on the **exact same Wi-Fi network** (same SSID, not guest network)
- Disable VPN on both devices
- Check that "Local Network" permission is granted (Android 13+)
- Try "Find Room on Wi-Fi" button on joiner device
- As fallback, use manual room code entry

### Bluetooth Connection Issues
- Ensure Bluetooth is enabled on both devices
- Pair devices in Android Settings first
- Grant "Nearby Devices" permission (Android 12+)
- Some devices may not support Bluetooth socket connections - use Wi-Fi mode instead
- Keep devices within 10 meters

### App Crashes
- Check logcat for errors
- Ensure all permissions are granted
- Try clearing app data and restarting

## Project Structure

```
app/
├── src/main/
│   ├── java/com/couplequest/
│   │   ├── data/
│   │   │   ├── local/          # Room DB, DataStore
│   │   │   ├── model/          # Data models
│   │   │   └── repository/     # Repositories
│   │   ├── di/                 # Hilt modules
│   │   ├── game/engine/        # TurnManager, ChatManager
│   │   ├── multiplayer/
│   │   │   ├── bluetooth/      # Bluetooth transport
│   │   │   ├── transport/      # Transport abstraction
│   │   │   └── wifi/           # Wi-Fi Direct & Same-WiFi
│   │   ├── ui/
│   │   │   ├── screens/        # All Compose screens
│   │   │   ├── theme/          # Colors, Typography, Shapes
│   │   │   ├── viewmodel/      # ViewModels
│   │   │   └── MainActivity.kt
│   │   └── CoupleQuestApplication.kt
│   ├── res/
│   │   ├── values/             # Strings, Colors, Themes
│   │   └── xml/                # Backup/Data extraction rules
│   └── AndroidManifest.xml
├── build.gradle.kts
└── proguard-rules.pro
```

## Architecture

- **MVVM** with Hilt Dependency Injection
- **Jetpack Compose** for UI
- **Room** for local persistence
- **DataStore** for preferences
- **Kotlin Coroutines & Flow** for async
- **Clean Architecture** separation:
  - Data layer (repositories, database)
  - Domain layer (game engine, models)
  - Presentation layer (ViewModels, Compose UI)
  - Multiplayer layer (transport abstraction)

## Privacy & Security

- **No internet required** for core gameplay
- **No cloud backup** of game data or chat
- **Chat messages** stored only in memory, cleared on room close
- **No analytics** on intimate activities
- **No tracking** of personal data
- **Local-only** room discovery
- **Encrypted transport** for two-phone chat (where supported)
- **Consent required** for adult content (18+)

## Permissions

| Permission | Purpose |
|------------|---------|
| `ACCESS_WIFI_STATE` | Wi-Fi network detection |
| `CHANGE_WIFI_STATE` | Wi-Fi Direct |
| `ACCESS_FINE_LOCATION` | Required for Wi-Fi scanning (Android 12+) |
| `NEARBY_WIFI_DEVICES` | Local network discovery (Android 13+) |
| `BLUETOOTH_CONNECT` | Bluetooth pairing |
| `BLUETOOTH_SCAN` | Bluetooth device discovery |
| `BLUETOOTH_ADVERTISE` | Bluetooth advertising |
| `FOREGROUND_SERVICE` | Background multiplayer |
| `VIBRATE` | Haptic feedback |

## License

Proprietary - All rights reserved.

## Support

For issues, please check the troubleshooting section or contact support.

---

**Note**: This app is for consenting adults 18+. All intimate content requires explicit consent from both partners. No challenge is ever mandatory - skip or reroll anytime.