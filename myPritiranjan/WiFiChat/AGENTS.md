# WiFiChat - Project Agents

## Overview
Android/Kotlin chat app with WiFi Direct P2P, Jetpack Compose, Hilt, Room.

## Agent Usage
- **planner**: P2P messaging features, connection management
- **tdd-guide**: JUnit/MockK unit tests, Compose/Espresso instrumented tests
- **code-reviewer**: Kotlin/Compose/Hilt, WiFi P2P patterns
- **security-reviewer**: Peer validation, network security config, encryption
- **build-error-resolver**: Gradle/Kotlin build failures
- **go-build-resolver**: Not applicable

## Project Context
- Min SDK 24, Target SDK 34
- Packages: `data/`, `domain/`, `presentation/`, `wifi/`
- `WifiP2pManager` interface, `WifiDirectService` lifecycle
- Build: `./gradlew build`, `./gradlew test`, `./gradlew connectedAndroidTest`

## ECC Compliance
- Uses global ECC agents, commands, skills
- Android/Kotlin + WiFi P2P patterns in CLAUDE.md