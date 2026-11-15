# Building the Android APK

This guide will help you build a production-ready Android APK for the Grocery Delivery mobile app.

## Prerequisites

1. **Node.js 18+** installed
2. **Expo CLI** installed globally: `npm install -g expo-cli`
3. **EAS CLI** installed globally: `npm install -g eas-cli`
4. **Expo account** (free at expo.dev)
5. **Android Studio** (for testing locally)

## Quick Start (EAS Build - Recommended)

EAS (Expo Application Services) builds your app in the cloud - no local Android SDK required!

### 1. Login to Expo
```bash
cd grocery-delivery/mobile-app
npx expo login
```

### 2. Configure EAS Project
```bash
npx eas build:configure
```
This will create/update `eas.json` and link your project to Expo.

### 3. Build Development APK (for testing)
```bash
npx eas build --platform android --profile development
```
- Creates a debug APK
- Installs directly on device/emulator
- Includes Expo Dev Client for live reload

### 4. Build Preview APK (for sharing)
```bash
npx eas build --platform android --profile preview
```
- Creates a release APK
- Can be shared with testers
- Optimized but not fully production-optimized

### 5. Build Production AAB (for Play Store)
```bash
npx eas build --platform android --profile production
```
- Creates an App Bundle (AAB) for Google Play Store
- Fully optimized and signed
- Required for Play Store submission

## Local Build (Alternative)

If you prefer building locally with Android Studio:

### 1. Install Dependencies
```bash
cd grocery-delivery/mobile-app
npm install
```

### 2. Generate Native Code
```bash
npx expo prebuild --platform android
```
This creates the `android/` folder with Gradle project.

### 3. Build Debug APK
```bash
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Build Release APK
```bash
cd android
./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### 5. Sign Release APK (Required for distribution)
```bash
# Generate keystore (run once)
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias grocery-delivery

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore my-release-key.jks app-release-unsigned.apk grocery-delivery

# Align
zipalign -v 4 app-release-unsigned.apk grocery-delivery.apk
```

## Important Configuration

### Update API URL for Production

Before building for production, update the API base URL in:
**`mobile-app/src/services/api.ts`**
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3000/api/v1'  // Android emulator
  : 'https://your-production-api.com/api/v1';  // Your production API
```

### Update App Credentials

**`mobile-app/app.json`** - Update these for your app:
```json
{
  "expo": {
    "name": "Your Store Name",
    "slug": "your-store-slug",
    "version": "1.0.0",
    "android": {
      "package": "com.yourstore.grocery",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

### Update Icons and Splash Screen

Replace placeholder assets in `mobile-app/assets/`:
- `icon.png` (1024x1024)
- `splash-icon.png` (1284x2772)
- `adaptive-icon.png` (1024x1024 foreground)
- `favicon.png` (48x48)

## Backend Deployment

Before using the APK in production, deploy the backend:

1. **Deploy PostgreSQL** (Cloud SQL, Supabase, Railway, etc.)
2. **Deploy Backend** (Railway, Render, AWS, DigitalOcean, etc.)
3. **Run Migrations**: `npm run db:migrate`
4. **Seed Data**: `npm run db:seed`
5. **Configure Environment Variables** (see `.env.example`)

## Testing the APK

### Install on Device
```bash
# Via ADB (device connected via USB)
adb install path/to/app.apk

# Or transfer file and install manually
```

### Test Checklist
- [ ] App launches without crashes
- [ ] Login/Register with OTP works
- [ ] Browse categories and products
- [ ] Add to cart and checkout
- [ ] Address selection works
- [ ] UPI payment flow (QR code, UPI ID copy)
- [ ] Order tracking works
- [ ] Push notifications (if configured)
- [ ] Offline handling (graceful degradation)

## Troubleshooting

### Common Build Issues

**1. "SDK location not found"**
```bash
# Set ANDROID_HOME in ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**2. "Gradle build failed"**
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

**3. "Metro bundler issues"**
```bash
npx expo start -c  # Clear cache
```

**4. EAS Build fails**
- Check build logs in Expo dashboard
- Verify all dependencies in package.json
- Check for TypeScript errors: `npx tsc --noEmit`

### App Crashes on Launch
- Check `adb logcat` for errors
- Verify API URL is accessible
- Check for missing assets

## Distribution

### Internal Testing
1. Build preview: `eas build --profile preview`
2. Share link from Expo dashboard
2. Testers install via link

### Google Play Store
1. Build production: `eas build --profile production`
2. Download AAB from Expo dashboard
3. Upload to Play Console
3. Complete store listing
4. Submit for review

## Automated Builds (CI/CD)

Add to `.github/workflows/build.yml`:
```yaml
name: Build Android APK
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18' }
      - run: npm install -g eas-cli
      - run: cd mobile-app && npm install
      - run: eas build --platform android --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Support

For issues:
1. Check Expo docs: https://docs.expo.dev
2. Check EAS Build docs: https://docs.expo.dev/build/introduction/
3. Check GitHub issues for this project