import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../store';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CategoryProductsScreen from '../screens/CategoryProductsScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import SearchScreen from '../screens/SearchScreen';
import CartScreen from '../screens/CartScreen';
import AddressSelectionScreen from '../screens/AddressSelectionScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentConfirmationScreen from '../screens/PaymentConfirmationScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const activeColor = isDark ? COLORS.primaryLight : COLORS.primary;
  const inactiveColor = isDark ? '#9E9E9E' : '#757575';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          let IconComponent = Ionicons;
          
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Categories':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Cart':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'Orders':
              iconName = focused ? 'bag-handle' : 'bag-handle-outline';
              IconComponent = MaterialCommunityIcons;
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help';
          }
          
          return <IconComponent name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#333' : '#E0E0E0',
          height: 70,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.surface,
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      },
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
        color: COLORS.text,
      },
      headerTintColor: COLORS.primary,
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categories' }} />
    <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product Details' }} />
    <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
    <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
    <Stack.Screen name="AddressSelection" component={AddressSelectionScreen} options={{ title: 'Delivery Address' }} />
    <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ title: 'Add Address' }} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
    <Stack.Screen name="PaymentConfirmation" component={PaymentConfirmationScreen} options={{ title: 'Payment Confirmation' }} />
    <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ title: 'Order Confirmed' }} />
    <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: 'Track Order' }} />
    <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Order Details' }} />
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainStack} />
        </>
      ) : (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthStack} />
        </>
      )}
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

import { COLORS } from '../constants';