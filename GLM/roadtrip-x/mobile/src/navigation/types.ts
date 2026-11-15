import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  TripDetail: { tripId: string };
  CreateTrip: undefined;
  JoinTrip: undefined;
  TripSettings: { tripId: string };
  MemberProfile: { userId: string };
  VehicleDetail: { vehicleId: string };
  ExpenseDetail: { expenseId: string };
  AddExpense: { tripId: string; expenseId?: string };
  SettlementDetail: { settlementId: string };
  AddSettlement: { tripId: string; fromUserId?: string; toUserId?: string };
  ItineraryDetail: { stopId: string };
  AddItineraryStop: { tripId: string; stopId?: string };
  MapView: { tripId: string };
  ChatView: { tripId: string };
  EmergencyView: { tripId: string };
  SOSView: { tripId: string };
  Settings: undefined;
  Profile: undefined;
  Notifications: undefined;
  TripRecap: { tripId: string };
  PhotoAlbum: { tripId: string };
  TripReplay: { tripId: string };
  AIAssistant: { tripId: string };
  ScanReceipt: { tripId: string };
  SmartSuggestions: { tripId: string };
  VehicleHealth: { vehicleId: string };
  ChecklistDetail: { checklistId: string };
  PollDetail: { pollId: string };
  CreatePoll: { tripId: string };
  BudgetDetail: { tripId: string };
  FuelDetail: { entryId?: string };
  TollDetail: { entryId?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Expenses: undefined;
  Chat: undefined;
  Trip: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<'Main'>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}