# WiFiTalk - Project Agents

## Overview
React Native/Expo offline walkie-talkie with WiFi Direct, Bluetooth, file transfer. Platform-specific native modules.

## Agent Usage
- **planner**: P2P transport features, audio streaming architecture
- **tdd-guide**: Vitest for transport logic, mock AudioRecorder/Player
- **code-reviewer**: TypeScript/React Native, platform-specific code
- **security-reviewer**: Pairing codes, file validation, network security config
- **build-error-resolver**: TypeScript/ESLint/Gradle/Xcode build errors
- **e2e-runner**: Detox for native E2E testing
- **go-reviewer** / **go-build-resolver**: Not applicable

## Project Context
- Expo SDK 51, Expo Router in `app/`
- Services: `TransportService` interface with WiFi Direct/Bluetooth/Same-WiFi implementations
- `WalkieTalkieService` for PTT audio streaming
- SQLite via `expo-sqlite` for local-first data
- Native: Android (WiFi P2P, Bluetooth), iOS (MultipeerConnectivity)

## ECC Compliance
- Uses global ECC agents, commands, skills
- React Native/Expo + native patterns in CLAUDE.md