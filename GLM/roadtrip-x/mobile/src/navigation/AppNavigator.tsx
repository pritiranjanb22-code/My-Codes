import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useAppStore } from '@/store';
import { RootStackParamList, MainTabParamList } from './types';

// Screens
import AuthScreen from '@/screens/AuthScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import HomeScreen from '@/screens/HomeScreen';
import MapScreen from '@/screens/MapScreen';
import ExpensesScreen from '@/screens/ExpensesScreen';
import ChatScreen from '@/screens/ChatScreen';
import TripScreen from '@/screens/TripScreen';
import TripDetailScreen from '@/screens/TripDetailScreen';
import CreateTripScreen from '@/screens/CreateTripScreen';
import JoinTripScreen from '@/screens/JoinTripScreen';
import TripSettingsScreen from '@/screens/TripSettingsScreen';
import MemberProfileScreen from '@/screens/MemberProfileScreen';
import VehicleDetailScreen from '@/screens/VehicleDetailScreen';
import ExpenseDetailScreen from '@/screens/ExpenseDetailScreen';
import AddExpenseScreen from '@/screens/AddExpenseScreen';
import SettlementDetailScreen from '@/screens/SettlementDetailScreen';
import AddSettlementScreen from '@/screens/AddSettlementScreen';
import ItineraryDetailScreen from '@/screens/ItineraryDetailScreen';
import AddItineraryStopScreen from '@/screens/AddItineraryStopScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import TripRecapScreen from '@/screens/TripRecapScreen';
import PhotoAlbumScreen from '@/screens/PhotoAlbumScreen';
import TripReplayScreen from '@/screens/TripReplayScreen';
import AIAssistantScreen from '@/screens/AIAssistantScreen';
import ScanReceiptScreen from '@/screens/ScanReceiptScreen';
import SmartSuggestionsScreen from '@/screens/SmartSuggestionsScreen';
import VehicleHealthScreen from '@/screens/VehicleHealthScreen';
import ChecklistDetailScreen from '@/screens/ChecklistDetailScreen';
import PollDetailScreen from '@/screens/PollDetailScreen';
import CreatePollScreen from '@/screens/CreatePollScreen';
import BudgetDetailScreen from '@/screens/BudgetDetailScreen';
import FuelDetailScreen from '@/screens/FuelDetailScreen';
import TollDetailScreen from '@/screens/TollDetailScreen';
import EmergencyScreen from '@/screens/EmergencyScreen';
import SOSScreen from '@/screens/SOSScreen';

import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { currentTrip } = useAppStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: COLORS.black,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
          ),
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'cash' : 'cash-outline'} size={24} color={color} />
          ),
          tabBarLabel: 'Expenses',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
          ),
          tabBarLabel: 'Chat',
        }}
      />
      <Tab.Screen
        name="Trip"
        component={TripScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'car' : 'car-outline'} size={24} color={color} />
          ),
          tabBarLabel: 'Trip',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAppStore();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.surface,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerBackTitleVisible: false,
          cardStyle: { backgroundColor: COLORS.background },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="TripDetail" component={TripDetailScreen} />
            <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
            <Stack.Screen name="JoinTrip" component={JoinTripScreen} />
            <Stack.Screen name="TripSettings" component={TripSettingsScreen} />
            <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />
            <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
            <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen name="SettlementDetail" component={SettlementDetailScreen} />
            <Stack.Screen name="AddSettlement" component={AddSettlementScreen} />
            <Stack.Screen name="ItineraryDetail" component={ItineraryDetailScreen} />
            <Stack.Screen name="AddItineraryStop" component={AddItineraryStopScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="TripRecap" component={TripRecapScreen} />
            <Stack.Screen name="PhotoAlbum" component={PhotoAlbumScreen} />
            <Stack.Screen name="TripReplay" component={TripReplayScreen} />
            <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
            <Stack.Screen name="ScanReceipt" component={ScanReceiptScreen} />
            <Stack.Screen name="SmartSuggestions" component={SmartSuggestionsScreen} />
            <Stack.Screen name="VehicleHealth" component={VehicleHealthScreen} />
            <Stack.Screen name="ChecklistDetail" component={ChecklistDetailScreen} />
            <Stack.Screen name="PollDetail" component={PollDetailScreen} />
            <Stack.Screen name="CreatePoll" component={CreatePollScreen} />
            <Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} />
            <Stack.Screen name="FuelDetail" component={FuelDetailScreen} />
            <Stack.Screen name="TollDetail" component={TollDetailScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="SOS" component={SOSScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}