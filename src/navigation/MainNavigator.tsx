/**
 * Main Navigator - Handles authenticated app with bottom tabs + stacks
 * @format
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import DashboardScreen from '../screens/home/DashboardScreen';
import WhatYouCanDoScreen from '../screens/home/WhatYouCanDoScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import DocumentsScreen from '../screens/profile/DocumentsScreen';
import UploadDocumentScreen from '../screens/profile/UploadDocumentScreen';
import DocumentDetailScreen from '../screens/profile/DocumentDetailScreen';
import BankGpDetailsScreen from '../screens/profile/BankGpDetailsScreen';
import AttendanceListScreen from '../screens/attendance/AttendanceListScreen';
import TimesheetDetailScreen from '../screens/attendance/TimesheetDetailScreen';
import LeaveListScreen from '../screens/leave/LeaveListScreen';
import LeaveDetailScreen from '../screens/leave/LeaveDetailScreen';
import CreateLeaveScreen from '../screens/leave/CreateLeaveScreen';
import LeaveBalancesScreen from '../screens/leave/LeaveBalancesScreen';

export type MainStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Documents: undefined;
  UploadDocument: { categoryId?: number };
  DocumentDetail: { documentId: number };
  BankGpDetails: undefined;
  AttendanceList: undefined;
  TimesheetDetail: undefined;
  LeaveList: undefined;
  LeaveDetail: { id: string };
  CreateLeave: undefined;
  LeaveBalances: undefined;
  WhatYouCanDo: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Attendance: undefined;
  Leave: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const stackScreenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: '#f5f5f5' },
  animationEnabled: true,
  gestureEnabled: true,
};

const HomeStack: React.FC = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="WhatYouCanDo" component={WhatYouCanDoScreen} />
  </Stack.Navigator>
);

const AttendanceStack: React.FC = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="AttendanceList" component={AttendanceListScreen} />
    <Stack.Screen name="TimesheetDetail" component={TimesheetDetailScreen} />
  </Stack.Navigator>
);

const LeaveStack: React.FC = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="LeaveList" component={LeaveListScreen} />
    <Stack.Screen name="LeaveDetail" component={LeaveDetailScreen} />
    <Stack.Screen name="CreateLeave" component={CreateLeaveScreen} />
    <Stack.Screen name="LeaveBalances" component={LeaveBalancesScreen} />
  </Stack.Navigator>
);

const ProfileStack: React.FC = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Documents" component={DocumentsScreen} />
    <Stack.Screen name="UploadDocument" component={UploadDocumentScreen} />
    <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
    <Stack.Screen name="BankGpDetails" component={BankGpDetailsScreen} />
  </Stack.Navigator>
);

const MainNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64;
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 8,
          left: 12,
          right: 12,
          height: tabBarHeight + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 10,
          backgroundColor: '#f5f5f5',
          borderTopWidth: 0,
          borderRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#1a237e',
        tabBarInactiveTintColor: '#757575',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && styles.tabIconWrapperActive,
              ]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={focused ? '#1a237e' : color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceStack}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && styles.tabIconWrapperActive,
              ]}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={22}
                color={focused ? '#1a237e' : color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveStack}
        options={{
          tabBarLabel: 'Leave',
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && styles.tabIconWrapperActive,
              ]}>
              <Ionicons
                name={focused ? 'document-text' : 'document-text-outline'}
                size={22}
                color={focused ? '#1a237e' : color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && styles.tabIconWrapperActive,
              ]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={focused ? '#1a237e' : color}
              />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Profile', { screen: 'Profile' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconWrapper: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapperActive: {
    backgroundColor: 'rgba(26, 35, 126, 0.12)',
  },
});

export default MainNavigator;
