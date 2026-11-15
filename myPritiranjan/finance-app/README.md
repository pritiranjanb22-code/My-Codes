# Finance Manager - Personal Finance & Expense Tracker

A cross-platform mobile app built with React Native (Expo) for tracking personal finances, expenses, budgets, and financial insights.

## Features

- **Transaction Tracking**: Add/edit/delete income, expenses, and transfers with categories, notes, and payment modes
- **Smart Categorization**: Default categories with custom category support and auto-suggestions
- **Budgeting**: Monthly/yearly budgets per category with progress tracking and alerts
- **Reports & Analytics**: Visual charts (pie, bar, line) for spending breakdowns and trends
- **Multi-Account Support**: Bank accounts, cash, credit cards, digital wallets with balance tracking
- **Recurring Transactions**: Automated recurring transactions with reminders
- **India-Specific**: INR formatting (₹, lakhs/crores), tax-deductible tagging (80C/80D)
- **Data Privacy**: Local-first storage with optional encrypted backup
- **Security**: PIN and biometric authentication

## Tech Stack

- **Framework**: React Native with Expo (TypeScript)
- **Database**: SQLite (expo-sqlite) for local-first storage
- **State Management**: Zustand with persistence
- **Charts**: Victory Native for data visualization
- **Navigation**: React Navigation v6 (Bottom Tabs + Stack)
- **Forms**: Formik + Yup for validation
- **UI**: Custom components with Material 3 / iOS-native feel

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── common/         # InputField, Button, Card, Modal, SelectField
├── constants/          # App constants (categories, colors, etc.)
├── db/                 # Database layer
│   ├── index.ts        # Schema initialization & mappers
│   └── operations.ts   # CRUD operations for all entities
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
├── screens/            # Screen components
├── store/              # Zustand store
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone the repository
cd finance-app

# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

### Development Commands

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator/device
npm run web        # Run in web browser
npm run lint       # Run ESLint
```

## Database Schema

The app uses SQLite with the following tables:

- **accounts**: Bank accounts, cash, credit cards, wallets
- **categories**: Income/expense categories with icons, colors, tax info
- **transactions**: All financial transactions with full details
- **recurring_transactions**: Automated recurring transactions
- **budgets**: Budget limits per category with spending tracking
- **settings**: App preferences and user settings

## Key Features Implementation

### Add Transaction Flow
- Modal bottom sheet with type selector (Income/Expense/Transfer)
- Account and category selection with icons
- Amount input with INR formatting
- Date picker, payment mode, notes
- Recurring transaction option
- Auto-category suggestions based on note text
- Form validation with Yup

### Dashboard
- Total balance across all accounts
- Monthly income/expense/net flow summary
- Budget alerts with progress bars
- Top spending categories
- Account balances overview
- Recent transactions list

### Reports
- Expense breakdown (pie/bar charts)
- Monthly trend lines (income/expense/net)
- Category-wise spending analysis
- Savings rate calculation
- Smart insights

## India-Specific Features

- **Currency Formatting**: Indian numbering system (₹1,00,000 = 1 Lakh)
- **Tax Sections**: Tag expenses for 80C (investments, insurance), 80D (health insurance)
- **Export**: CSV/PDF export for tax filing reference

## Security & Privacy

- All data stored locally on device
- Optional PIN lock with secure storage
- Biometric authentication (Face ID / Fingerprint)
- Optional encrypted Google Drive backup
- No mandatory cloud account or tracking

## License

MIT License - feel free to use for personal or commercial projects.