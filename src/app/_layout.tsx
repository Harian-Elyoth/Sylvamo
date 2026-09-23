import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useCollection } from '@/store/collection';

SplashScreen.preventAutoHideAsync();

function useHydrated() {
  return useSyncExternalStore(useCollection.persist.onFinishHydration, useCollection.persist.hasHydrated);
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.tint,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerBackTitle: 'Retour' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="figure/[id]" options={{ title: 'Figurine' }} />
        <Stack.Screen name="set/[id]" options={{ title: 'Set' }} />
        <Stack.Screen name="add" options={{ title: 'Ajouter une figurine', presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
