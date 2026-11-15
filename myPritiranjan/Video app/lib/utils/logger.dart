import 'package:logger/logger.dart';

final logger = Logger(
  printer: PrettyPrinter(
    methodCount: 2,
    errorMethodCount: 8,
    lineLength: 120,
    colors: true,
    printEmojis: true,
    printTime: true,
  ),
  level: Level.debug,
);

class AppLogger {
  static void d(String message, {Object? error, StackTrace? stackTrace}) {
    logger.d(message, error: error, stackTrace: stackTrace);
  }
  
  static void i(String message, {Object? error, StackTrace? stackTrace}) {
    logger.i(message, error: error, stackTrace: stackTrace);
  }
  
  static void w(String message, {Object? error, StackTrace? stackTrace}) {
    logger.w(message, error: error, stackTrace: stackTrace);
  }
  
  static void e(String message, {Object? error, StackTrace? stackTrace}) {
    logger.e(message, error: error, stackTrace: stackTrace);
  }
  
  static void wtf(String message, {Object? error, StackTrace? stackTrace}) {
    logger.wtf(message, error: error, stackTrace: stackTrace);
  }
}

mixin Loggable {
  void logDebug(String message) => AppLogger.d('[$runtimeType] $message');
  void logInfo(String message) => AppLogger.i('[$runtimeType] $message');
  void logWarning(String message) => AppLogger.w('[$runtimeType] $message');
  void logError(String message, {Object? error, StackTrace? stackTrace}) => 
    AppLogger.e('[$runtimeType] $message', error: error, stackTrace: stackTrace);
}