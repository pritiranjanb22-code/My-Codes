# WiFiChat — Project CLAUDE.md

> Android/Kotlin chat app with WiFi Direct, Compose, Hilt, Room

## Project Overview

**Stack:** Kotlin, Android SDK 34, Jetpack Compose, Hilt DI, Room Database, WiFi Direct (P2P), Material3

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

- Feature-based packages: `data/`, `domain/`, `presentation/`, `wifi/`
- Max 400 lines per file, 800 absolute max
- Data classes for models, sealed classes for UI state
- Repository pattern for data access
- WiFi P2P logic in `wifi/` package

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
- WiFi Direct: Validate peer identity before connection

## File Structure

```
WiFiChat/
|-- app/
|   |-- src/
|   |   |-- main/
|   |   |   |-- java/com/wifichat/
|   |   |   |   |-- data/           # Repository, Room
|   |   |   |   |-- di/             # Hilt modules
|   |   |   |   |-- domain/         # Use cases, repository interfaces
|   |   |   |   |-- presentation/   # Compose screens, ViewModels
|   |   |   |   |   |-- screens/
|   |   |   |   |   |-- viewmodel/
|   |   |   |   |   |-- ui/theme/
|   |   |   |   |-- wifi/           # WiFi Direct P2P logic
|   |   |   |   |   |-- WifiP2pManager.kt
|   |   |   |   |   |-- WifiDirectService.kt
|   |   |   |   |   |-- PeerDiscovery.kt
|   |   |   |   |-- WiFiChatApplication.kt
|   |   |-- res/
|   |   |-- test/
|   |   |-- androidTest/
|-- build.gradle.kts
|-- settings.gradle.kts
|-- gradle.properties
```

## Key Patterns

### WiFi Direct Manager

```kotlin
// wifi/WifiP2pManager.kt
interface WifiP2pManager {
    suspend fun discoverPeers(): Result<Unit>
    suspend fun connect(device: WifiP2pDevice): Result<WifiP2pInfo>
    suspend fun createGroup(): Result<WifiP2pInfo>
    val peers: Flow<List<WifiP2pDevice>>
    val connectionInfo: Flow<WifiP2pInfo?>
}

@AndroidEntryPoint
class WifiDirectService : LifecycleService() {
    private val manager = WifiP2pManagerImpl()
    // Handle connection lifecycle
}
```

### Repository with Room

```kotlin
// data/MessageRepository.kt
@Dao
interface MessageDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(message: MessageEntity)

    @Query("SELECT * FROM messages WHERE chat_id = :chatId ORDER BY timestamp DESC LIMIT :limit")
    fun getMessages(chatId: String, limit: Int): Flow<List<MessageEntity>>

    @Query("DELETE FROM messages WHERE timestamp < :threshold")
    suspend fun deleteOldMessages(threshold: Long): Int
}
```

## Environment Variables

```bash
# local.properties (never commit)
DEBUG_KEYSTORE_PATH=
DEBUG_KEYSTORE_PASSWORD=
DEBUG_KEY_ALIAS=
DEBUG_KEY_PASSWORD=
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