# Video App — Project CLAUDE.md

> Flutter/Dart - Video streaming/editing app

## Project Overview

**Stack:** Flutter 3.x, Dart 3.x, Riverpod/BLoC for state, Dio for networking, Hive/SQLite for local storage, FFmpeg for video processing

**Architecture:** Feature-first with clean architecture layers

## Critical Rules

### Flutter/Dart Specific

- Dart 3.x with strict type analysis (`analysis_options.yaml`)
- State management: Riverpod (preferred) or BLoC
- Navigation: GoRouter for declarative routing
- Dependency injection: GetIt + Injectable
- Code generation: build_runner for Freezed, JSON serialization

### Code Organization

- Feature folders in `lib/features/`
- Core in `lib/core/` (utils, constants, themes, DI)
- Shared widgets in `lib/shared/widgets/`
- Max 400 lines per file, 800 absolute max
- One widget per file, filename matches widget name

### Code Style

- No emojis in code, comments, or documentation
- Immutability: Freezed for data classes, `final` fields
- No `print()` in production - use `logger` package
- Proper error handling: `Either<Failure, Success>` (Dartz) or `Result<T>`
- Input validation: Form validators, DTO validation
- `dart format` + `flutter analyze` + `dart fix --apply`

### Testing

- TDD: Write tests first (`/tdd` command)
- Unit: `flutter test` with mocktail
- Widget: `flutter test` with widget tests
- Integration: `integration_test` package
- 80% minimum coverage for business logic

### Security

- No hardcoded secrets - use `--dart-define` or `.env` (flutter_dotenv)
- Secure storage: `flutter_secure_storage` for tokens
- Certificate pinning for API calls
- Validate all file inputs (video, images)
- ProGuard/R8 rules for release builds

## File Structure

```
video_app/
|-- android/                    # Android config
|-- ios/                        # iOS config
|-- lib/
|   |-- core/
|   |   |-- constants/          # App constants
|   |   |-- di/                 # GetIt + Injectable setup
|   |   |-- router/             # GoRouter config
|   |   |-- theme/              # AppTheme, colors, typography
|   |   |-- utils/              # Helpers, extensions
|   |   |-- errors/             # Failures, exceptions
|   |-- features/
|   |   |-- auth/
|   |   |   |-- data/
|   |   |   |-- domain/
|   |   |   |-- presentation/
|   |   |-- video/
|   |   |   |-- data/           # Repository, Dio, local storage
|   |   |   |-- domain/         # Entities, use cases, repository interface
|   |   |   |-- presentation/   # Screens, widgets, providers
|   |   |-- editing/
|   |   |-- profile/
|   |-- shared/
|   |   |-- widgets/            # Reusable widgets
|   |   |-- models/             # Shared Freezed models
|   |-- main.dart               # App entry
|-- test/                       # Unit + widget tests
|-- integration_test/           # Integration tests
|-- pubspec.yaml
|-- analysis_options.yaml
|-- melos.yaml                  # If monorepo
```

## Key Patterns

### Feature Structure (Clean Architecture)

```dart
// features/video/domain/entities/video.dart
@freezed
class Video with _$Video {
  const factory Video({
    required String id,
    required String title,
    required String url,
    required Duration duration,
    required DateTime createdAt,
  }) = _Video;
}

// features/video/domain/repositories/video_repository.dart
abstract class VideoRepository {
  Future<Either<Failure, List<Video>>> getVideos();
  Future<Either<Failure, Video>> uploadVideo(VideoInput input);
  Future<Either<Failure, Unit>> deleteVideo(String id);
}

// features/video/data/repositories/video_repository_impl.dart
@Injectable(as: VideoRepository)
class VideoRepositoryImpl implements VideoRepository {
  final VideoApiService _api;
  final VideoLocalDataSource _local;

  @override
  Future<Either<Failure, List<Video>>> getVideos() async {
    try {
      final remote = await _api.getVideos();
      await _local.cacheVideos(remote);
      return Right(remote);
    } catch (e) {
      final cached = await _local.getCachedVideos();
      return cached.isNotEmpty ? Right(cached) : Left(ServerFailure(e.toString()));
    }
  }
}
```

### Riverpod Provider

```dart
// features/video/presentation/providers/video_providers.dart
@riverpod
class VideoList extends _$VideoList {
  @override
  Future<List<Video>> build() async {
    final repository = ref.read(videoRepositoryProvider);
    final result = await repository.getVideos();
    return result.fold(
      (failure) => throw failure,
      (videos) => videos,
    );
  }
}

@riverpod
Future<void> uploadVideo(UploadVideoRef ref, VideoInput input) async {
  final repository = ref.read(videoRepositoryProvider);
  final result = await repository.uploadVideo(input);
  result.fold(
    (failure) => ref.read(notificationProvider.notifier).showError(failure.message),
    (_) => ref.invalidate(videoListProvider),
  );
}
```

## Environment Variables

```bash
# .env (gitignored, flutter_dotenv)
API_BASE_URL=https://api.example.com
SUPABASE_URL=
SUPABASE_ANON_KEY=
FFMPEG_PATH=
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors (Dart, Flutter)

## Flutter Commands

```bash
flutter pub get              # Get dependencies
flutter pub run build_runner build --delete-conflicting-outputs  # Code gen
flutter analyze              # Static analysis
flutter test                 # Unit + widget tests
flutter test integration_test/  # Integration tests
flutter build apk --release  # Build Android APK
flutter build ios --release  # Build iOS
dart format .                # Format code
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Feature branches from `main`, PRs required
- CI runs: analyze, test, build
- Deploy: Fastlane + Firebase App Distribution / Play Console / App Store Connect