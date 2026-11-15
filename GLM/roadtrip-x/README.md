# 🚗 RoadTrip X

> **Everything your group needs before, during and after a road trip.**

A cross-platform mobile application for group road trips combining trip planning, expense splitting, live location sharing, group chat, emergency assistance, and AI-powered assistance.

## ✨ Features

### 🗺️ Trip Planning
- Multi-stop route planner with drag-and-drop reordering
- Smart stop suggestions (fuel, food, restrooms, hotels, viewpoints, mechanics)
- Real-time route tracking and ETA calculations

### 💰 Expense Management (Splitwise-style)
- Equal, exact, percentage, shares, and custom splits
- Smart settlement optimization (minimize transactions)
- Trip wallet for shared cash pool
- Receipt scanning with OCR
- Duplicate expense detection
- Budget tracking with forecasts

### 📍 Live Location & Convoy Mode
- Real-time group member tracking on map
- Multiple vehicles support with driver/passenger assignments
- Convoy mode showing all vehicles with separation warnings
- Battery-optimized adaptive location tracking
- Privacy-first: opt-in sharing with visible controls

### 💬 Group Communication
- Trip-specific chat with text, images, voice, location
- Push-to-talk walkie-talkie mode
- Group polls for decisions
- Shared checklists

### 🆘 Emergency & Safety
- One-tap emergency button with type selection
- SOS long-press activation
- Nearby hospitals, police, mechanics
- Emergency alerts to all trip members

### 📸 Memories & Replay
- Shared photo/video album grouped by day/location
- Automatic trip timeline
- Animated trip replay mode
- Beautiful trip recap with export (PDF/Image)

### 🤖 AI Assistant
- Natural language expense entry
- Receipt OCR scanning
- Smart budget suggestions
- Route and stop recommendations

### 📱 Offline-First
- Full functionality without internet
- Local SQLite database with sync engine
- Conflict resolution and retry logic
- Low-bandwidth mode optimization

## 🏗️ Architecture

```
roadtrip-x/
├── mobile/                 # React Native + Expo (TypeScript)
│   ├── src/
│   │   ├── screens/        # 30+ screens
│   │   ├── components/     # Reusable UI components
│   │   ├── navigation/     # React Navigation v6
│   │   ├── store/          # Zustand state management
│   │   ├── services/       # API, WebSocket, Location
│   │   ├── database/       # SQLite offline-first
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Helpers, formatters
│   │   ├── types/          # TypeScript interfaces
│   │   └── constants/      # App constants
│   └── app.json            # Expo config
│
├── backend/                # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── trips/      # Trip management
│   │   │   ├── expenses/   # Expenses & settlements
│   │   │   ├── vehicles/   # Vehicle management
│   │   │   ├── location/   # Live location
│   │   │   ├── chat/       # Messaging
│   │   │   ├── emergency/  # Emergency system
│   │   │   ├── notifications/ # Push notifications
│   │   │   └── ai/         # AI assistant
│   │   ├── middleware/     # Auth, rate limiting, errors
│   │   ├── database/       # PostgreSQL + migrations
│   │   └── websocket/      # Socket.IO real-time
│   └── package.json
│
└── admin/                  # Web dashboard (React)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio / Xcode for mobile builds

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run db:migrate
npm run dev
```

### Mobile Setup
```bash
cd mobile
npm install
npx expo start
# Press 'a' for Android, 'i' for iOS, 'w' for web
```

### Environment Variables
See `.env.example` for all required variables:
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET` - Generate secure random strings
- `DATABASE_URL` - PostgreSQL connection
- `MAPS_API_KEY` - Google Maps API key
- `FIREBASE_*` - For push notifications
- `AI_API_KEY` - OpenAI API key for AI assistant

## 📦 Build for Production

### Android
```bash
cd mobile
eas build --platform android --profile production
# Generates .aab for Play Store
```

### iOS
```bash
cd mobile
eas build --platform ios --profile production
# Generates .ipa for App Store/TestFlight
```

### Backend
```bash
cd backend
npm run build
npm start
# Deploy with PM2, Docker, or your preferred platform
```

## 🧪 Development Phases

| Phase | Features | Status |
|-------|----------|--------|
| **1** | Auth, Trips, Members, Vehicles, Basic Dashboard | ✅ Scaffolded |
| **2** | Expenses, Split Calculation, Settlement, Budget, Fuel, Toll | 🚧 In Progress |
| **3** | Maps, Route, Stops, Location Sharing, Convoy Mode | ⏳ Planned |
| **4** | Chat, Notifications, Polls, Checklists | ⏳ Planned |
| **5** | Emergency, SOS, Nearby Services | ⏳ Planned |
| **6** | Offline DB, Sync Engine, Low-Network Mode | ⏳ Planned |
| **7** | AI Assistant, Receipt OCR, Smart Suggestions | ⏳ Planned |
| **8** | Photo Album, Trip Timeline, Trip Replay, Recap | ⏳ Planned |
| **9** | Performance, Security, Testing, Build, Deploy | ⏳ Planned |

## 🔐 Security

- JWT authentication with refresh tokens
- Role-based access control (Owner/Admin/Member/Driver/Viewer)
- Server-side validation on all endpoints
- Rate limiting on auth and API endpoints
- HTTPS enforced in production
- Secure local storage for tokens
- No secrets in mobile app bundle

## 📱 Supported Platforms

| Platform | Status |
|----------|--------|
| Android 8+ | ✅ |
| iOS 14+ | ✅ |
| Web (PWA) | ✅ |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Expo team for the amazing framework
- React Navigation for navigation
- Zustand for state management
- Socket.IO for real-time communication
- All open-source contributors

---

**RoadTrip X** - Making group road trips effortless and memorable 🚗✨