import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:watch_together/screens/splash_screen.dart';
import 'package:watch_together/screens/home_screen.dart';
import 'package:watch_together/screens/create_room_screen.dart';
import 'package:watch_together/screens/join_room_screen.dart';
import 'package:watch_together/screens/room_lobby_screen.dart';
import 'package:watch_together/screens/video_player_screen.dart';
import 'package:watch_together/screens/settings_screen.dart';
import 'package:watch_together/utils/app_theme.dart';
import 'package:watch_together/services/initialization_service.dart';
import 'package:watch_together/utils/logger.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await InitializationService.initialize();
  
  runApp(
    const ProviderScope(
      child: WatchTogetherApp(),
    ),
  );
}

class WatchTogetherApp extends ConsumerWidget {
  const WatchTogetherApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'WatchTogether',
      theme: AppTheme.darkTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      debugShowCheckedModeBanner: false,
      initialRoute: '/splash',
      routes: {
        '/splash': (context) => const SplashScreen(),
        '/home': (context) => const HomeScreen(),
        '/create-room': (context) => const CreateRoomScreen(),
        '/join-room': (context) => const JoinRoomScreen(),
        '/room-lobby': (context) => RoomLobbyScreen(arguments: ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>),
        '/video-player': (context) => VideoPlayerScreen(
          roomId: (ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>)['roomId'],
          isHost: (ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>)['isHost'],
          video: (ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>)['video'],
          userName: (ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>)['userName'],
        ),
        '/settings': (context) => const SettingsScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/room-lobby' || settings.name == '/video-player') {
          final args = settings.arguments as Map<String, dynamic>;
          if (settings.name == '/room-lobby') {
            return MaterialPageRoute(
              builder: (_) => RoomLobbyScreen(arguments: args),
              settings: settings,
            );
          } else {
            return MaterialPageRoute(
              builder: (_) => VideoPlayerScreen(
                roomId: args['roomId'],
                isHost: args['isHost'],
                video: args['video'],
                userName: args['userName'],
              ),
              settings: settings,
            );
          }
        }
        return null;
      },
      navigatorObservers: [AppNavigatorObserver()],
    );
  }
}

class AppNavigatorObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    logger.d('Navigated to: ${route.settings.name}');
  }
  
  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    logger.d('Navigated back from: ${route.settings.name}');
  }
}