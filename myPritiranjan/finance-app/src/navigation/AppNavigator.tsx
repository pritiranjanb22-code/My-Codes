import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

import DashboardScreen from '@/screens/DashboardScreen';
import TransactionsScreen from '@/screens/TransactionsScreen';
import BudgetsScreen from '@/screens/BudgetsScreen';
import ReportsScreen from '@/screens/ReportsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AddTransactionScreen from '@/screens/AddTransactionScreen';
import CategoryManagerScreen from '@/screens/CategoryManagerScreen';
import AccountManagerScreen from '@/screens/AccountManagerScreen';
import BudgetManagerScreen from '@/screens/BudgetManagerScreen';
import RecurringManagerScreen from '@/screens/RecurringManagerScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const activeColor = isDark ? '#FFF' : '#1A1A2E';
  const inactiveColor = isDark ? '#888' : '#666';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transactions':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Budgets':
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
              break;
            case 'Reports':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff', elevation: 0, borderBottomWidth: 0 },
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        headerTintColor: '#1A1A2E',
      }}
    >
      <Stack.Screen name="Home" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ presentation: 'modal', headerTitle: 'Add Transaction' }}
      />
      <Stack.Screen
        name="CategoryManager"
        component={CategoryManagerScreen}
        options={{ headerTitle: 'Categories' }}
      />
      <Stack.Screen
        name="AccountManager"
        component={AccountManagerScreen}
        options={{ headerTitle: 'Account' }}
      />
      <Stack.Screen
        name="BudgetManager"
        component={BudgetManagerScreen}
        options={{ headerTitle: 'Budget' }}
      />
      <Stack.Screen
        name="RecurringManager"
        component={RecurringManagerScreen}
        options={{ headerTitle: 'Recurring Transaction' }}
      />
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