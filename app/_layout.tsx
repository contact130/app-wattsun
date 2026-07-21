import { Stack, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  // Pendant le chargement initial, afficher un splash
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color="#1B7D4B" />
      </View>
    );
  }

  // Si pas authentifié et pas déjà sur le login, rediriger
  const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'dossier' || segments[0] === 'nouveau-chantier';
  if (!isAuthenticated && inAuthGroup) {
    return <Redirect href="/" />;
  }

  // Si authentifié et sur le login, rediriger vers les tabs
  if (isAuthenticated && segments[0] !== '(tabs)' && segments[0] !== 'dossier' && segments[0] !== 'nouveau-chantier') {
    return <Redirect href="/(tabs)" />;
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
