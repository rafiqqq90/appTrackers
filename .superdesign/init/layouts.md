# Layouts

## App shell — `App.tsx`
Boots the store, restores theme, wraps in SafeAreaProvider + NavigationContainer (themed), renders RootTabs.

### `App.tsx`

```tsx
import './global.css';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootTabs } from './src/navigation/RootTabs';
import { useAppStore } from './src/store/useAppStore';
import { initializeTheme, useThemeColors } from './src/theme/useTheme';

initializeTheme();

export default function App() {
  const isReady = useAppStore((s) => s.isReady);
  const bootstrap = useAppStore((s) => s.bootstrap);
  const startNetworkListener = useAppStore((s) => s.startNetworkListener);
  const { isDark, colors } = useThemeColors();

  useEffect(() => {
    bootstrap();
    const unsubscribe = startNetworkListener();
    return () => unsubscribe();
  }, [bootstrap, startNetworkListener]);

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      border: colors.border,
      text: colors.text,
    },
  };

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

## Bottom tab navigation — `src/navigation/RootTabs.tsx`
Bottom tab bar with 4 tabs: Hari Ini (CalendarCheck2), Tugasan (CheckSquare), Langganan (CreditCard), Diari (BookOpen). Height 62, label 11px semibold.

### `src/navigation/RootTabs.tsx`

```tsx
import React from 'react';
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

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Hari Ini"
        component={TodayScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck2 color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Tugasan"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <CheckSquare color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Langganan"
        component={SubscriptionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <CreditCard color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Diari"
        component={DiaryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

## Header — `src/components/SyncStatusHeader.tsx`
Used at the top of every screen inside SafeAreaView (edges top). Full source in components.md.

## Screen wrapper pattern
Every screen: `<SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>` → `<SyncStatusHeader/>` → `<ScrollView contentContainerClassName="p-5 gap-5 pb-10">` → optional FAB + bottom-sheet Modal.
