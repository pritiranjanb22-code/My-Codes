# ProGuard Rules for VideoAI

# Keep Hilt generated classes
-keep class dagger.hilt.** { *; }
-keep class com.videoai.**Hilt** { *; }

# Keep Room entities and DAOs
-keep class com.videoai.data.model.** { *; }
-keep class com.videoai.data.dao.** { *; }
-keep class com.videoai.data.repository.** { *; }

# Keep Kotlin serialization
-keep class kotlinx.serialization.** { *; }
-keepclassmembers class * {
    @kotlinx.serialization.KSerializer *;
}

# Keep Compose
-keep class androidx.compose.** { *; }

# Keep Media3/ExoPlayer
-keep class com.google.android.exoplayer2.** { *; }
-keep class androidx.media3.** { *; }

# Keep FFmpeg
-keep class com.arthenica.mobileffmpeg.** { *; }
-keep class com.arthenica.ffmpegkit.** { *; }

# Keep WebSocket
-keep class org.java_websocket.** { *; }

# Keep JmDNS
-keep class javax.jmdns.** { *; }

# Keep Coil
-keep class coil.** { *; }

# Keep ML Kit
-keep class com.google.mlkit.** { *; }
-keep class com.google.mediapipe.** { *; }

# Keep ZXing
-keep class com.google.zxing.** { *; }
-keep class com.journeyapps.** { *; }

# Keep OkHttp/Okio
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Keep Coroutines
-keep class kotlinx.coroutines.** { *; }

# Keep application classes
-keep class com.videoai.** { *; }

# Don't obfuscate enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
}

# WebSocket
-dontwarn org.java_websocket.**

# JmDNS
-dontwarn javax.jmdns.**

# FFmpeg
-dontwarn com.arthenica.mobileffmpeg.**
-dontwarn com.arthenica.ffmpegkit.**

# Media3
-dontwarn androidx.media3.**

# ML Kit
-dontwarn com.google.mlkit.**
-dontwarn com.google.mediapipe.**

# ZXing
-dontwarn com.google.zxing.**
-dontwarn com.journeyapps.**