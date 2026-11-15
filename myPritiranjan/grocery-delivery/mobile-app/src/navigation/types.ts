export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOtp: { phone: string; purpose: 'login' | 'register' | 'forgot_password'; name?: string; email?: string };
  Main: undefined;
  Home: undefined;
  Categories: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
  ProductDetails: { productId: string };
  Search: undefined;
  Cart: undefined;
  AddressSelection: { fromCheckout?: boolean };
  AddAddress: { addressId?: string };
  Checkout: undefined;
  Payment: { orderId: string };
  PaymentConfirmation: { orderId: string };
  OrderConfirmation: { orderId: string };
  OrderTracking: { orderId: string };
  Orders: undefined;
  OrderDetails: { orderId: string };
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Settings: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOtp: { phone: string; purpose: 'login' | 'register' | 'forgot_password'; name?: string; email?: string };
};