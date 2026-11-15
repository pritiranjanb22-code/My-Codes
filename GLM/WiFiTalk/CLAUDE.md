# WiFiTalk — Project CLAUDE.md

> React Native/Expo (TypeScript) - Offline walkie-talkie with WiFi Direct, Bluetooth, file transfer

## Project Overview

**Stack:** React Native (Expo SDK 51), TypeScript, Expo Router, SQLite (expo-sqlite), react-native-wifi-p2p, react-native-bluetooth-classic, Zustand

**Architecture:** Offline-first P2P communication
- Service layer for transport abstraction (WiFi Direct, Bluetooth, Same-WiFi)
- Local-first database with sync capability
- Walkie-talkie audio streaming via WebRTC-like custom protocol

## Critical Rules

### TypeScript/React Native Specific

- Strict TypeScript (`strict: true`)
- Path aliases: `@/*` → `src/*`
- Expo Router file-based routing in `app/`
- Platform-specific code: `.android.ts`, `.ios.ts`, `.native.ts` extensions
- Native modules: WiFi Direct, Bluetooth Classic, Audio recording

### Code Organization

- Feature folders in `src/`: `screens/`, `services/`, `store/`, `hooks/`, `db/`
- Max 400 lines per file, 800 absolute max
- Transport abstraction: `TransportService` interface with multiple implementations
- Audio handling: Separate `WalkieTalkieService` for PTT logic

### Code Style

- No emojis in code, comments, or documentation
- Immutability: Zustand with immutable updates
- No `console.log` in production - use `logger` from `utils/logger`
- Proper error handling: `Result<T>` for transport operations
- Input validation: Zod for settings, pairing codes, file metadata

### Testing

- TDD: Write tests first (`/tdd` command)
- Unit: Vitest + React Native Testing Library
- Transport mocking: In-memory implementations for tests
- Audio testing: Mock `AudioRecorder` and `AudioPlayer`
- 80% minimum coverage for transport and messaging logic

### Security

- No hardcoded secrets
- Pairing codes: 6-digit numeric, single-use, time-limited
- File transfer: Validate file type, size limits (max 100MB)
- Local database: SQLCipher for encryption (optional)
- Network security config: `res/xml/network_security_config.xml`

## File Structure

```
WiFiTalk/
|-- android/                     # Native Android config
|   |-- app/
|   |   |-- src/main/
|   |   |   |-- java/com/wifitalk/
|   |   |   |   |-- MainActivity.java
|   |   |   |   |-- MainApplication.java
|   |   |   |-- res/xml/network_security_config.xml
|   |-- build.gradle
|-- ios/                         # Native iOS config
|   |-- WiFiTalk/
|   |   |-- Info.plist
|   |-- Podfile
|-- src/
|   |-- assets/                  # Images, fonts
|   |-- components/              # Reusable UI
|   |   |-- ui/                  # Button, Input, Card, Modal
|   |   |-- walkie-talkie/       # PTT button, audio visualizer
|   |-- constants/               # theme.ts, config.ts
|   |-- db/                      # SQLite (expo-sqlite)
|   |   |-- DatabaseService.ts   # CRUD, migrations
|   |   |-- Schema.ts            # Table definitions
|   |-- hooks/                   # Custom hooks
|   |   |-- useAppLifecycle.ts
|   |-- navigation/              # Expo Router types
|   |-- screens/                 # Screen components
|   |   |-- WalkieTalkieScreen.tsx
|   |   |-- ChatScreen.tsx
|   |   |-- CallsScreen.tsx
|   |   |-- NetworkDiagnosticsScreen.tsx
|   |   |-- PairingScreen.tsx
|   |   |-- SettingsScreen.tsx
|   |-- services/                # Business logic
|   |   |-- DiscoveryService.ts  # Peer discovery
|   |   |-- FileTransferService.ts
|   |   |-- IdentityService.ts   # Device identity, pairing
|   |   |-- MessagingService.ts  # Chat, voice messages
|   |   |-- NetworkDiagnosticsService.ts
|   |   |-- PairingService.ts
|   |   |-- TransportService.ts  # Interface + implementations
|   |   |   |-- WifiDirectTransport.ts
|   |   |   |-- BluetoothTransport.ts
|   |   |   |-- SameWifiTransport.ts
|   |   |-- WalkieTalkieService.ts # PTT, audio streaming
|   |-- store/                   # Zustand stores
|   |   |-- useAppStore.ts       # Global app state
|   |-- types/                   # TypeScript definitions
|   |-- utils/                   # Helpers
|   |   |-- dateUtils.ts
|   |   |-- logger.ts
|-- app/                         # Expo Router screens
|   |-- _layout.tsx
|   |-- (tabs)/
|   |-- pairing.tsx
|   |-- walkie-talkie.tsx
|-- app.json                     # Expo config
|-- package.json
|-- tsconfig.json
|-- babel.config.js
|-- metro.config.js
|-- .env.example
```

## Key Patterns

### Transport Interface

```typescript
// src/services/TransportService.ts
export interface TransportService {
  readonly type: 'wifi-direct' | 'bluetooth' | 'same-wifi';
  readonly isConnected: boolean;
  readonly peerId: string;

  startDiscovery(): Promise<Result<void>>;
  stopDiscovery(): void;
  connect(peerId: string): Promise<Result<Connection>>;
  disconnect(): Promise<void>;
  send(data: Uint8Array): Promise<Result<void>>;
  onData: (data: Uint8Array, peerId: string) => void;
  onPeerFound: (peer: DiscoveredPeer) => void;
  onPeerLost: (peerId: string) => void;
}
```

### Walkie-Talkie Service (PTT)

```typescript
// src/services/WalkieTalkieService.ts
export class WalkieTalkieService {
  private recorder: AudioRecorder | null = null;
  private player: AudioPlayer | null = null;
  private transport: TransportService;

  async startRecording(): Promise<Result<void>> {
    this.recorder = await AudioRecorder.create({
      format: 'opus',
      sampleRate: 16000,
      channels: 1,
    });
    return this.recorder.start();
  }

  async stopRecording(): Promise<Result<Uint8Array>> {
    const audioData = await this.recorder?.stop();
    if (audioData) {
      return this.transport.send(audioData);
    }
    return { success: false, error: 'No recording' };
  }
}
```

### Database Service (expo-sqlite)

```typescript
// src/db/DatabaseService.ts
export class DatabaseService {
  private db: SQLiteDatabase;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('wifitalk.db');
    await this.migrate();
  }

  async saveMessage(message: Message): Promise<Result<void>> {
    return this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        'INSERT INTO messages (id, chat_id, sender_id, content, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        message.id, message.chatId, message.senderId, message.content, message.type, message.timestamp
      );
    });
  }
}
```

## Environment Variables

```bash
# .env.local (gitignored)
EXPO_PUBLIC_APP_NAME=WiFiTalk
EXPO_PUBLIC_MAX_FILE_SIZE_MB=100
EXPO_PUBLIC_PAIRING_CODE_LENGTH=6
EXPO_PUBLIC_PAIRING_CODE_TTL_SECONDS=300
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors (TypeScript, ESLint, Gradle)
- `/e2e` - Detox E2E tests (requires device/emulator)

## Development Commands

```bash
# Start Expo
npx expo start

# Clear cache
npx expo start -c

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios

# Build for production
eas build --platform android
eas build --platform ios

# Lint
npx expo lint

# Type check
npx tsc --noEmit

# Test
npm test
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Feature branches from `main`, PRs required
- CI runs: lint, type-check, unit tests
- Deploy: EAS Build + Store submission