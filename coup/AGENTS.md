# CoupleQuest (coup) - Project Agents

## Overview
Android/Kotlin multiplayer game with Jetpack Compose, Hilt, Room, DataStore, Bluetooth/WiFi Direct.

## Agent Usage
- **planner**: New game features, architecture changes
- **tdd-guide**: Unit tests (JUnit/MockK), instrumented tests (Compose/Espresso)
- **code-reviewer**: Kotlin/Compose code quality
- **security-reviewer**: Network security, DataStore encryption, Bluetooth validation
- **build-error-resolver**: Gradle/Kotlin build failures
- **go-build-resolver**: Not applicable (Kotlin project)

## Project Context
- Min SDK 26, Target SDK 34, Compile SDK 34
- Packages: `data/`, `game/`, `multiplayer/`, `ui/`, `di/`
- Key: `TransportInterface` for P2P, `TurnManager`/`ChatManager` for game logic
- Build: `./gradlew build`, `./gradlew test`, `./gradlew connectedAndroidTest`

## ECC Compliance
- Uses global ECC agents, commands, skills
- Kotlin-specific patterns in CLAUDE.md