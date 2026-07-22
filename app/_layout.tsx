import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useRef } from 'react';

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const prevAuthenticated = useRef<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // Ne réagir qu'aux changements réels de l'état d'auth
    if (prevAuthenticated.current === isAuthenticated) return;
    prevAuthenticated.current = isAuthenticated;

    if (!isAuthenticated) {
      router.replace('/');
    } else {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color="#1B7D4B" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="dossier/[id]" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }} 
        />
        <Stack.Screen 
          name="nouveau-chantier" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_bottom'
          }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
