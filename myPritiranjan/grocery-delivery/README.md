# Grocery Delivery System - Complete Monorepo

A production-ready grocery shop home delivery system with three parts:
1. **Customer Mobile App** (React Native + Expo)
2. **Admin Dashboard** (React + Vite + TailwindCSS)
3. **Backend API** (Node.js + Express + PostgreSQL)

## 🏗️ Project Structure

```
grocery-delivery/
├── package.json              # Root monorepo config
├── mobile-app/               # Customer React Native App
│   ├── src/
│   │   ├── screens/          # All app screens
│   │   ├── components/       # Reusable UI components
│   │   ├── navigation/       # Navigation configuration
│   │   ├── store/            # Zustand state management
│   │   ├── services/         # API services & hooks
│   │   ├── utils/            # Helpers & constants
│   │   ├── types/            # TypeScript types
│   │   ├── hooks/            # Custom React hooks
│   │   └── context/          # React context providers
│   ├── App.tsx               # Main entry point
│   └── app.json              # Expo configuration
├── admin-dashboard/          # Admin React Dashboard
│   ├── src/
│   │   ├── pages/            # Dashboard pages
│   │   ├── components/       # Reusable components
│   │   ├── layouts/          # Layout components
│   │   ├── services/         # API services
│   │   ├── context/          # Auth context
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Helpers
│   ├── index.html
│   └── vite.config.ts
└── backend/                  # Node.js Backend API
    ├── src/
    │   ├── controllers/      # Route controllers
    │   ├── services/         # Business logic
    │   ├── routes/           # API routes
    │   ├── middleware/       # Auth, validation, errors
    │   ├── validators/       # Zod schemas
    │   ├── db/               # Database pool, migrations, seeds
    │   ├── utils/            # Helpers
    │   ├── config/           # Configuration
    │   ├── app.ts            # Express app setup
    │   └── index.ts          # Entry point
    └── package.json
```

## ✨ Features Implemented

### Customer Mobile App
- ✅ **Authentication**: OTP-based login/register, password login, forgot password
- ✅ **Home Screen**: Shop info, search, categories, featured products, cart, orders
- ✅ **Product Browsing**: Categories, search, filters, product details with images
- ✅ **Shopping Cart**: Add/remove/update quantities, promo codes, order summary
- ✅ **Address Management**: Multiple addresses, default selection, map picker ready
- ✅ **Checkout Flow**: Address selection → UPI Payment → Order confirmation
- ✅ **UPI Manual Payment**: QR code, UPI ID, transaction ID entry, screenshot upload
- ✅ **Order Tracking**: Real-time status updates with visual timeline
- ✅ **Order History**: Past orders with reorder functionality
- ✅ **Notifications**: In-app notifications with unread count
- ✅ **Profile Management**: Edit profile, change password, FCM token

### Admin Dashboard
- ✅ **Authentication**: Admin login with JWT
- ✅ **Dashboard**: Stats cards, quick actions, recent orders, inventory alerts
- ✅ **Order Management**: List, filter, sort, pagination, status updates
- ✅ **Payment Verification**: Manual UPI verification with confirm/reject
- ✅ **Product Management**: CRUD, images, inventory, featured toggle
- ✅ **Category Management**: CRUD with product counts
- ✅ **Customer Management**: List, details, order history
- ✅ **Delivery Management**: Delivery persons, assignments, tracking
- ✅ **Reports**: Sales, product sales, customer stats, CSV export
- ✅ **Settings**: Shop config, UPI details, delivery charges

### Backend API
- ✅ **Database Schema**: 17 tables with proper relationships
- ✅ **Authentication**: JWT access/refresh tokens, OTP verification
- ✅ **Role-based Access**: Customer, Admin, Delivery Person
- ✅ **Order Flow**: Payment pending → Verification → Confirmed → Preparing → Delivery
- ✅ **Inventory Management**: Auto stock deduction, low stock alerts
- ✅ **Payment System**: Manual UPI with admin verification
- ✅ **File Upload**: Image upload with validation
- ✅ **Rate Limiting**: API protection
- ✅ **Input Validation**: Zod schemas for all endpoints
- ✅ **Error Handling**: Standardized error responses
- ✅ **Database Migrations**: Auto-run schema creation
- ✅ **Seed Data**: Sample categories, products, admin user

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode for mobile testing

### 1. Backend Setup
```bash
cd grocery-delivery/backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:migrate
npm run db:seed
npm run dev
```
Server runs on `http://localhost:3000`

### 2. Admin Dashboard Setup
```bash
cd grocery-delivery/admin-dashboard
npm install
npm run dev
```
Dashboard runs on `http://localhost:5173`

### 3. Mobile App Setup
```bash
cd grocery-delivery/mobile-app
npm install
# Update API URL in src/services/api.ts if needed
npm start
# Press 'a' for Android, 'i' for iOS, 'w' for web
```

## 🔧 Configuration

### Environment Variables (Backend)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_delivery
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars

# Shop Settings
SHOP_NAME=Fresh Mart Grocery
SHOP_PHONE=+91-9876543210
UPI_ID=shopname@upi
UPI_QR_CODE_URL=https://your-qr-code-url
DELIVERY_CHARGE=30
FREE_DELIVERY_THRESHOLD=500
MIN_ORDER_VALUE=100

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

### Mobile App API URL
Update `src/services/api.ts`:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3000/api/v1'  // Android emulator
  : 'https://your-production-api.com/api/v1';
```

## 📱 Key User Flows

### Customer Order Flow
1. Browse categories/products
2. Add to cart with quantity selection
3. Apply promo code (optional)
4. Select delivery address
5. View order summary with delivery charges
6. **UPI Payment**: Scan QR / copy UPI ID → Pay in UPI app
6. Enter UTR number + optional screenshot
7. Order status: "Payment Verification Pending"
8. Admin verifies → "Order Confirmed" → Preparing → Delivery

### Admin Payment Verification
1. View pending payments in dashboard
2. Check UTR in bank/UPI app
3. Click "Confirm" or "Reject" with reason
9. Customer notified automatically

## 🏗️ Building for Production

### Android APK
```bash
cd mobile-app
npm run build:android
# Or use EAS Build:
npx eas build --platform android --profile production
```

### Admin Dashboard
```bash
cd admin-dashboard
npm run build
# Deploy dist/ folder to your hosting
```

### Backend
```bash
cd backend
npm run build
# Run with PM2: pm2 start dist/index.js --name grocery-api
```

## 📦 Database Schema Overview

Key tables:
- `users` - All users (customers, admins, delivery)
- `customer_profiles` - Extended customer info
- `addresses` - Delivery addresses
- `categories` - Product categories (hierarchical)
- `products` - Products with inventory
- `orders` - Orders with full status tracking
- `order_items` - Order line items
- `payments` - Payment records with UPI details
- `delivery_persons` - Delivery staff
- `delivery_assignments` - Order-delivery mapping
- `notifications` - In-app notifications
- `inventory_logs` - Stock change audit trail
- `offers` - Discounts and promotions
- `shop_settings` - Configurable settings
- `reviews` - Product reviews
- `cart_items` - Persistent cart

## 🔒 Security Features
- JWT with short-lived access tokens + refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting on all endpoints
- Input validation with Zod
- CORS configuration
- Helmet.js security headers
- SQL injection prevention (parameterized queries)
- File upload validation
- Role-based access control

## 📝 API Documentation

Base URL: `http://localhost:3000/api/v1`

### Auth Endpoints
- `POST /auth/send-otp` - Send OTP
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/login` - Password login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Customer Endpoints
- `GET /customer/profile` - Get profile
- `PUT /customer/profile` - Update profile
- `GET /customer/addresses` - List addresses
- `POST /customer/addresses` - Add address
- `PUT /customer/addresses/:id` - Update address
- `DELETE /customer/addresses/:id` - Delete address
- `GET /customer/cart` - Get cart
- `POST /customer/cart` - Add to cart
- `PUT /customer/cart/:productId` - Update quantity
- `DELETE /customer/cart/:productId` - Remove item
- `POST /customer/orders` - Create order
- `GET /customer/orders` - List orders
- `GET /customer/orders/:id` - Order details
- `POST /customer/orders/:id/payment-confirmation` - Submit UPI payment
- `GET /customer/products` - List products
- `GET /customer/products/:id` - Product details
- `GET /customer/products/search` - Search products
- `GET /customer/categories` - List categories
- `GET /customer/shop-settings` - Get shop config

### Admin Endpoints
- `GET /admin/dashboard` - Dashboard stats
- `GET /admin/orders` - List orders (with filters)
- `GET /admin/orders/:id` - Order details
- `PUT /admin/orders/:id/status` - Update order status
- `GET /admin/orders/pending-payments` - Pending payments
- `POST /admin/orders/:id/verify-payment` - Verify/reject payment
- `GET /admin/products` - List products
- `POST /admin/products` - Create product
- `PUT /admin/products/:id` - Update product
- `DELETE /admin/products/:id` - Delete product
- `GET /admin/categories` - List categories
- `POST /admin/categories` - Create category
- `PUT /admin/categories/:id` - Update category
- `DELETE /admin/categories/:id` - Delete category
- `GET /admin/customers` - List customers
- `GET /admin/reports/sales` - Sales report
- `GET /admin/reports/export/sales` - Export CSV
- `GET /admin/settings` - Get shop settings
- `PUT /admin/settings` - Update shop settings

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🆘 Support

For issues and questions:
- Check existing GitHub issues
- Create new issue with details
- Check backend logs for API errors
- Verify database connection

---

**Built with ❤️ for local grocery businesses**