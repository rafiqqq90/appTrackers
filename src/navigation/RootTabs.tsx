import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  BookOpen,
  CalendarCheck2,
  CheckSquare,
  CreditCard,
} from 'lucide-react-native';
import { DiaryScreen } from '../screens/DiaryScreen';
import { SubscriptionsScreen } from '../screens/SubscriptionsScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { useThemeColors } from '../theme/useTheme';

export type RootTabParamList = {
  'Hari Ini': undefined;
  Tugasan: undefined;
  Langganan: undefined;
  Diari: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  const { colors } = useThemeColors();

  const tabBarStyle: any = {
    position: 'absolute',
    backgroundColor: colors.tabBarBg,
    borderTopColor: colors.tabBarBorder,
    borderTopWidth: StyleSheet.hairlineWidth || 1,
    elevation: 0,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    ...(Platform.OS === 'web'
      ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
      : {}),
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Hari Ini"
        component={TodayScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CalendarCheck2
              color={focused ? colors.tabActiveIcon : colors.icon}
              size={19}
              strokeWidth={1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Tugasan"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CheckSquare
              color={focused ? colors.tabActiveIcon : colors.icon}
              size={19}
              strokeWidth={1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Langganan"
        component={SubscriptionsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CreditCard
              color={focused ? colors.tabActiveIcon : colors.icon}
              size={19}
              strokeWidth={1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Diari"
        component={DiaryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <BookOpen
              color={focused ? colors.tabActiveIcon : colors.icon}
              size={19}
              strokeWidth={1.8}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
