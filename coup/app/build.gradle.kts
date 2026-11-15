plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("kotlin-android")
    id("kotlin-kapt")
}

android {
    namespace = "com.couplequest"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.couplequest"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            isMinifyEnabled = false
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        viewBinding = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.11"
    }

    packagingOptions {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1,LICENSE,NOTICE,LICENSE.txt,NOTICE.txt}"
        }
    }

    testOptions {
        unitTests {
            includeAndroidResources = true
        }
    }
}

dependencies {
    // Core Android
    val core_ktx_version = "1.13.1"
    val lifecycle_version = "2.7.0"
    val room_version = "2.6.1"
    val datastore_version = "1.0.0"
    val navigation_version = "2.7.6"
    val hilt_version = "2.48"
    val compose_version = "1.6.1"
    val compose_bom_version = "2024.02.00"
    val accompanist_version = "0.32.0"
    val coroutines_version = "1.7.3"
    val material3_version = "1.2.1"
    val coil_version = "2.5.0"
    val jUnit_version = "4.13.2"
    val espresso_version = "3.5.1"
    val compose_ui_test_version = "1.6.1"
    val mockk_version = "1.13.13"
    val truth_version = "1.1.5"

    // Android Core
    implementation("androidx.core:core-ktx:$core_ktx_version")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:$lifecycle_version")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:$lifecycle_version")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")
    implementation("androidx.activity:activity-compose:1.9.0")

    // Room Database
    implementation("androidx.room:room-runtime:$room_version")
    implementation("androidx.room:room-ktx:$room_version")
    kapt("androidx.room:room-compiler:$room_version")
    testImplementation("androidx.room:room-testing:$room_version")

    // DataStore
    implementation("androidx.datastore:datastore-preferences:$datastore_version")

    // Navigation
    implementation("androidx.navigation:navigation-compose:$navigation_version")
    implementation("androidx.navigation:navigation-runtime-ktx:$navigation_version")

    // Hilt Dependency Injection
    implementation("com.google.dagger:hilt-android:$hilt_version")
    kapt("com.google.dagger:hilt-compiler:$hilt_version")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:$compose_bom_version"))

    // Compose UI
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material3:material3-window-size-class")
    implementation("androidx.compose.runtime:runtime")
    implementation("androidx.compose.runtime:runtime-livedata")
    implementation("androidx.compose.runtime:runtime-rxjava3")

    // Accompanist
    implementation("com.google.accompanist:accompanist-permissions:$accompanist_version")
    implementation("com.google.accompanist:accompanist-systemuicontroller:$accompanist_version")
    implementation("com.google.accompanist:accompanist-pager:$accompanist_version")

    // Coil for Image Loading
    implementation("io.coil-kt:coil-compose:$coil_version")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:$coroutines_version")

    // Network (for Wi-Fi discovery)
    implementation("androidx.appcompat:appcompat:1.6.1")

    // Testing
    testImplementation("junit:junit:$jUnit_version")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.1.0")
    testImplementation("io.mockk:mockk:$mockk_version")
    testImplementation("com.google.truth:truth:$truth_version")
    testImplementation("androidx.arch.core:core-testing:2.2.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:$espresso_version")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:$compose_ui_test_version")
    androidTestImplementation("androidx.compose.ui:ui-test-manifest:$compose_ui_test_version")
    debugImplementation("androidx.compose.ui:ui-tooling:$compose_ui_test_version")
    debugImplementation("androidx.compose.ui:ui-tooling-data:$compose_ui_test_version")
}