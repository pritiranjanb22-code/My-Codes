import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar, Platform } from 'react-native';
import { useAppStore } from './store/useAppStore';
import { identityService } from './services/IdentityService';
import { discoveryService } from './services/DiscoveryService';
import { transportService } from './services/TransportService';
import { messagingService } from './services/MessagingService';
import { pairingService } from './services/PairingService';
import { walkieTalkieService } from './services/WalkieTalkieService';
import { fileTransferService } from './services/FileTransferService';
import { networkDiagnosticsService } from './services/NetworkDiagnosticsService';
import { databaseService } from './db/DatabaseService';

import ChatsScreen from './screens/ChatsScreen';
import CallsScreen from './screens/CallsScreen';
import WalkieTalkieScreen from './screens/WalkieTalkieScreen';
import NetworkScreen from './screens/NetworkScreen';
import SettingsScreen from './screens/SettingsScreen';
import ChatScreen from './screens/ChatScreen';
import CallScreen from './screens/CallScreen';
import PairingScreen from './screens/PairingScreen';
import NetworkDiagnosticsScreen from './screens/NetworkDiagnosticsScreen';
import ProfileScreen from './screens/ProfileScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import ChannelSettingsScreen from './screens/ChannelSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();

const theme = {
  roundness: 8,
  colors: {
    primary: '#00A884',
    primaryContainer: '#E0F2F1',
    secondary: '#128C7E',
    surface: '#FFFFFF',
    background: '#F0F2F5',
    error: '#D32F2F',
    onPrimary: '#FFFFFF',
    onSurface: '#111B21',
    onBackground: '#111B21',
    outline: '#E9EDEF',
    inverseSurface: '#111B21',
    inversePrimary: '#00A884',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F7F8FA',
      level3: '#EBEDEF',
      level4: '#E1E3E6',
      level5: '#D7D9DC',
    },
  },
};

const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    primary: '#00A884',
    primaryContainer: '#003D33',
    secondary: '#00A884',
    surface: '#1F2C34',
    background: '#111B21',
    error: '#EF5350',
    onPrimary: '#FFFFFF',
    onSurface: '#E9EDEF',
    onBackground: '#E9EDEF',
    outline: '#3A4A52',
    inverseSurface: '#E9EDEF',
    inversePrimary: '#00A884',
    elevation: {
      level0: 'transparent',
      level1: '#1F2C34',
      level2: '#222E35',
      level3: '#29353C',
      level4: '#2F3B43',
      level5: '#354149',
    },
  },
};

export default function App() {
  const { currentUser, isAuthenticated, loadSettings, setCurrentUser, setCurrentDevice } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await databaseService.initialize();
        await identityService.initialize();
        await pairingService.initialize();
        await walkieTalkieService.initialize();
        await transportService.initialize();
        await messagingService.initialize();
        await loadSettings();

        const user = await identityService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          const device = await databaseService.getDevice(identityService.getCurrentDeviceId() || '');
          if (device) setCurrentDevice(device);
        }

        await discoveryService.start();
        networkDiagnosticsService.startPeriodicScans(60000);
      } catch (error) {
        console.error('[App] Initialization failed:', error);
      }
    };

    initializeApp();

    return () => {
      discoveryService.stop();
      networkDiagnosticsService.stopPeriodicScans();
      transportService.shutdown();
      databaseService.close();
    };
  }, []);

  if (!isAuthenticated && currentUser) {
    return <AuthenticatedApp />;
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
          backgroundColor={theme.colors.primary}
        />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Authenticated" component={AuthenticatedApp} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

function OnboardingScreen() {
  const { currentUser, setCurrentUser, setCurrentDevice } = useAppStore();
  const [name, setName] = React.useState('');
  const [deviceName, setDeviceName] = React.useState(`Device-${Math.random().toString(36).substr(2, 6)}`);
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const user = await identityService.createUserProfile(name.trim(), deviceName.trim());
      setCurrentUser(user);
      const device = await databaseService.getDevice(identityService.getCurrentDeviceId() || '');
      if (device) setCurrentDevice(device);
    } catch (error) {
      console.error('[Onboarding] Failed to create profile:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <React.Fragment>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>📡</Text>
          <Text style={styles.title}>WiFiTalk</Text>
          <Text style={styles.tagline}>Your Network. Your Chat. Your Calls.</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Create Your Profile</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoCapitalize="words"
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Device Name</Text>
            <TextInput
              style={styles.input}
              value={deviceName}
              onChangeText={setDeviceName}
              placeholder="My Phone"
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.infoText}>
            WiFiTalk works over your local Wi-Fi network. No internet required for local communication.
          </Text>

          <TouchableOpacity style={[styles.button, isCreating && styles.buttonDisabled]} onPress={handleCreate} disabled={isCreating}>
            <Text style={styles.buttonText}>{isCreating ? 'Creating...' : 'Get Started'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </React.Fragment>
  );
}

function AuthenticatedApp() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          if (route.name === 'Chats') iconName = focused ? 'chat' : 'chat-outline';
          else if (route.name === 'Calls') iconName = focused ? 'phone' : 'phone-outline';
          else if (route.name === 'Walkie') iconName = focused ? 'mic' : 'mic-outline';
          else if (route.name === 'Network') iconName = focused ? 'wifi' : 'wifi-outline';
          else if (route.name === 'Settings') iconName = focused ? 'cog' : 'cog-outline';
          
          return (
            <Icon name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface + '80',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 4,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Chats" component={ChatsStack} />
      <Tab.Screen name="Calls" component={CallsStack} />
      <Tab.Screen name="Walkie" component={WalkieStack} />
      <Tab.Screen name="Network" component={NetworkStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

function ChatsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChatsList" component={ChatsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function CallsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CallsList" component={CallsScreen} />
      <Stack.Screen name="Call" component={CallScreen} />
    </Stack.Navigator>
  );
}

function WalkieStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WalkieTalkie" component={WalkieTalkieScreen} />
      <Stack.Screen name="ChannelSettings" component={ChannelSettingsScreen} />
    </Stack.Navigator>
  );
}

function NetworkStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Network" component={NetworkScreen} />
      <Stack.Screen name="Diagnostics" component={NetworkDiagnosticsScreen} />
      <Stack.Screen name="Pairing" component={PairingScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Icon } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.onSurface + '80',
    textAlign: 'center',
    marginBottom: 48,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.onSurface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.onSurface + '80',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
});

import { SafeAreaView, Icon } from 'react-native-paper';