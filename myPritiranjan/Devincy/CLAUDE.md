# Devincy — Project CLAUDE.md

> Android/Kotlin app with Compose, Hilt, Room, Clean Architecture

## Project Overview

**Stack:** Kotlin, Android SDK 34, Jetpack Compose, Hilt DI, Room Database, Material3

**Architecture:** Clean Architecture with feature modules

## Critical Rules

### Android/Kotlin Specific

- Use `kotlinx.coroutines` for async operations
- Prefer `Flow`/`StateFlow` for Compose state
- Room DAOs use suspend functions or Flow
- Hilt modules in `di/`, scoped to `@InstallIn`
- Compose: `@Preview` for all screen composables
- Min SDK 24, Target SDK 34, Compile SDK 34

### Code Organization

- Feature-based packages: `data/`, `domain/`, `presentation/`
- Max 400 lines per file, 800 absolute max
- Data classes for models, sealed classes for UI state
- Repository pattern for data access
- Use cases/interactors for business logic

### Code Style

- No emojis in code, comments, or documentation
- Immutability: `val` over `var`, data classes with `copy()`
- No `Log.d`/`Log.e` in production - use `Timber`
- Proper error handling with `Result<T>` or sealed `Result` classes
- Input validation at repository boundaries

### Testing

- TDD: Write tests first (`/tdd` command)
- Unit tests in `src/test/` (JUnit, MockK, Truth)
- Instrumented tests in `src/androidTest/` (Compose UI, Espresso)
- 80% minimum coverage for business logic

### Security

- No hardcoded API keys, tokens, or secrets
- Use `BuildConfig` or `local.properties` for debug keys
- Network security config in `res/xml/network_security_config.xml`
- Encrypt sensitive DataStore/SharedPreferences

## File Structure

```
Devincy/
|-- app/
|   |-- src/
|   |   |-- main/
|   |   |   |-- java/com/devincy/
|   |   |   |   |-- data/           # Repository, Room, DataStore
|   |   |   |   |-- di/             # Hilt modules
|   |   |   |   |-- domain/         # Use cases, repository interfaces
|   |   |   |   |-- presentation/   # Compose screens, ViewModels
|   |   |   |   |   |-- screens/
|   |   |   |   |   |-- viewmodel/
|   |   |   |   |   |-- ui/theme/
|   |   |   |   |-- DevincyApplication.kt
|   |   |-- res/
|   |   |-- test/
|   |   |-- androidTest/
|-- build.gradle.kts
|-- settings.gradle.kts
|-- gradle.properties
|-- SPEC.md
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors (Gradle, Kotlin)

## Gradle Commands

```bash
./gradlew build              # Full build
./gradlew test               # Unit tests
./gradlew connectedAndroidTest # Instrumented tests
./gradlew lint               # Static analysis
./gradlew ktlintCheck        # Kotlin style check
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Feature branches from `main`, PRs required
- CI runs: lint, ktlint, unit tests, instrumented tests