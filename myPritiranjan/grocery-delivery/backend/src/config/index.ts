import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'grocery_delivery',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_min_32_chars_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret_min_32_chars_change_in_production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  cors: {
    mobileAppUrl: process.env.MOBILE_APP_URL || 'exp://192.168.1.x:8081',
    adminDashboardUrl: process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5173',
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  },
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  },
  
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || '',
      bucket: process.env.AWS_S3_BUCKET || '',
    },
  },
  
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@grocerydelivery.com',
  },
  
  shop: {
    name: process.env.SHOP_NAME || 'Fresh Mart Grocery',
    phone: process.env.SHOP_PHONE || '+91-9876543210',
    address: process.env.SHOP_ADDRESS || '123 Main Street, City, State - 123456',
    openingHours: process.env.SHOP_OPENING_HOURS || '08:00-22:00',
    logoUrl: process.env.SHOP_LOGO_URL || '',
    defaultDeliveryRadiusKm: parseInt(process.env.DEFAULT_DELIVERY_RADIUS_KM || '10', 10),
    defaultDeliveryCharge: parseFloat(process.env.DEFAULT_DELIVERY_CHARGE || '30'),
    freeDeliveryThreshold: parseFloat(process.env.FREE_DELIVERY_THRESHOLD || '500'),
    minOrderValue: parseFloat(process.env.MIN_ORDER_VALUE || '100'),
    upiId: process.env.UPI_ID || 'shopname@upi',
    upiQrCodeUrl: process.env.UPI_QR_CODE_URL || '',
    paymentInstructions: process.env.PAYMENT_INSTRUCTIONS || 'Please pay the exact amount using any UPI app and enter the transaction ID (UTR) in the app.',
    taxPercentage: parseFloat(process.env.TAX_PERCENTAGE || '0'),
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
} as const;

export type Config = typeof config;