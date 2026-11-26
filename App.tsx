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
      primary: colors.accent,
      background: colors.background,
      card: colors.card,
      border: colors.border,
      text: colors.text,
    },
  };

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F7F8] dark:bg-[#0A0A0B]">
        <ActivityIndicator size="small" color={colors.accent} />
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
