# CoupleQuest (coup) — Project CLAUDE.md

> Android/Kotlin multiplayer game app with Compose, Hilt, Room, DataStore

## Project Overview

**Stack:** Kotlin, Android SDK 34, Jetpack Compose, Hilt DI, Room Database, DataStore, Bluetooth/WiFi Direct

**Architecture:** Clean Architecture with feature modules (data, game, multiplayer, ui)

## Critical Rules

### Android/Kotlin Specific

- Use `kotlinx.coroutines` for async operations
- Prefer `Flow`/`StateFlow` over LiveData for Compose
- Room DAOs must use suspend functions or Flow
- Hilt modules in `di/` package, scoped to `@InstallIn`
- Compose: `@Preview` for all screen composables
- Min SDK 26, Target SDK 34, Compile SDK 34

### Code Organization

- Feature-based packages: `data/`, `game/`, `multiplayer/`, `ui/`
- Max 400 lines per file, 800 absolute max
- Data classes for models, sealed classes for state
- Repository pattern for data access

### Code Style

- No emojis in code, comments, or documentation
- Immutability: `val` over `var`, data classes with `copy()`
- No `Log.d`/`Log.e` in production - use `Timber` or custom logger
- Proper error handling with `Result<T>` or sealed `Result` classes
- Input validation at repository boundaries

### Testing

- TDD: Write tests first (`/tdd` command)
- Unit tests in `src/test/` (JUnit, MockK, Truth)
- Instrumented tests in `src/androidTest/` (Compose UI, Espresso)
- 80% minimum coverage for business logic
- Test ViewModels with `InstantTaskExecutorRule`

### Security

- No hardcoded API keys, tokens, or secrets
- Use `BuildConfig` or `local.properties` for debug keys
- Network security config in `res/xml/network_security_config.xml`
- Validate all Bluetooth/WiFi data before processing
- Encrypt sensitive DataStore preferences

## File Structure

```
app/
|-- src/
|   |-- main/
|   |   |-- java/com/couplequest/
|   |   |   |-- data/           # Repository, Room, DataStore
|   |   |   |-- di/             # Hilt modules
|   |   |   |-- game/           # Game engine (TurnManager, ChatManager)
|   |   |   |-- multiplayer/    # Transport layer (Bluetooth, WiFi Direct)
|   |   |   |-- ui/             # Compose screens, ViewModels, theme
|   |   |   |   |-- screens/    # Screen composables
|   |   |   |   |-- theme/      # Color, Type, Shape, Theme
|   |   |   |   |-- viewmodel/  # ViewModels
|   |   |   |-- CoupleQuestApplication.kt
|   |   |-- res/                # Resources (values, xml)
|   |-- test/                   # Unit tests
|   |-- androidTest/            # Instrumented tests
|-- build.gradle.kts
|-- proguard-rules.pro
```

## Key Patterns

### Repository Pattern

```kotlin
interface ChallengeRepository {
    suspend fun getChallenges(): Result<List<Challenge>>
    suspend fun insertChallenge(challenge: Challenge): Result<Unit>
}

@HiltViewModel
class ChallengeViewModel @Inject constructor(
    private val repository: ChallengeRepository
) : ViewModel() {
    val challenges = repository.getChallenges().flow()
}
```

### Transport Interface (Multiplayer)

```kotlin
interface TransportInterface {
    suspend fun connect(device: Device): Result<Connection>
    suspend fun send(data: ByteArray): Result<Unit>
    val incoming: Flow<ByteArray>
}
```

### Compose Screen Pattern

```kotlin
@Composable
fun GameDashboardScreen(
    viewModel: GameDashboardViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    // Compose UI
}
```

## Environment Variables

```bash
# local.properties (never commit)
DEBUG_KEYSTORE_PATH=
DEBUG_KEYSTORE_PASSWORD=
DEBUG_KEY_ALIAS=
DEBUG_KEY_PASSWORD=

# Build config fields (build.gradle.kts)
buildConfigField("String", "API_BASE_URL", '"https://api.example.com"')
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors (Gradle, Kotlin)
- `/go-test` - Not applicable (Kotlin project)
- `/go-build` - Not applicable

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
- Version in `app/build.gradle.kts` (versionCode, versionName)