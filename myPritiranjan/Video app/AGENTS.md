# Video App - Project Agents

## Overview
Flutter/Dart video streaming/editing app with Riverpod/BLoC, FFmpeg, Hive/SQLite.

## Agent Usage
- **planner**: Video processing features, architecture
- **tdd-guide**: 
  - Unit: `flutter test` with mocktail
  - Widget: `flutter test` widget tests
  - Integration: `integration_test` package
- **code-reviewer**: Dart/Flutter patterns, Freezed immutability, Riverpod providers
- **security-reviewer**: Secure storage, certificate pinning, file validation, ProGuard/R8
- **build-error-resolver**: `flutter build`, `dart analyze`, `dart fix` failures
- **go-reviewer** / **go-build-resolver**: Not applicable

## Project Context
- Flutter 3.x, Dart 3.x, strict analysis
- State: Riverpod (preferred) or BLoC
- Navigation: GoRouter
- DI: GetIt + Injectable
- Code gen: `build_runner` for Freezed/JSON
- Build: `flutter pub get`, `flutter test`, `flutter build apk/ios`

## ECC Compliance
- Uses global ECC agents, commands, skills
- Flutter/Dart patterns in CLAUDE.md