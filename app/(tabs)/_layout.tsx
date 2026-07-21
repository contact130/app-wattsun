import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function TabsLayout() {
  const { partenaire, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  usePushNotifications(partenaire?.id || null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      // Use setTimeout to ensure navigation happens after the current render cycle
      setTimeout(() => {
        router.replace('/');
      }, 50);
    }
    if (isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated, isLoading]);

  // Don't render tabs if not authenticated - show blank screen while redirecting
  if (!isLoading && !isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFB', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1B7D4B" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1B7D4B',
        tabBarInactiveTintColor: '#9BA1A6',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chantiers',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
