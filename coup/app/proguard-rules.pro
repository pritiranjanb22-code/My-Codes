# Couple Quest ProGuard Rules

# Keep model classes for Room serialization
-keep class com.couplequest.data.model.** { *; }

# Keep Hilt generated classes
-keep class dagger.hilt.** { *; }
-keep class * extends dagger.hilt.android.HiltAndroidApp { *; }

# Keep ViewModels
-keep class com.couplequest.ui.viewmodel.** { *; }

# Keep Compose related
-keep class androidx.compose.** { *; }
-keep class org.jetbrains.compose.** { *; }

# Keep Room
-keep class androidx.room.** { *; }
-keep class * extends androidx.room.RoomDatabase { *; }

# Keep DataStore
-keep class androidx.datastore.** { *; }

# Keep Navigation
-keep class androidx.navigation.** { *; }

# Keep Coroutines
-keep class kotlinx.coroutines.** { *; }

# Keep Serialization
-keep class kotlinx.serialization.** { *; }

# Keep Multiplayer transport
-keep class com.couplequest.multiplayer.** { *; }

# Keep Game Engine
-keep class com.couplequest.game.engine.** { *; }

# RxJava
-keep class io.reactivex.** { *; }

# Coil
-keep class coil.** { *; }

# Accompanist
-keep class com.google.accompanist.** { *; }