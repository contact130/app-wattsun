import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { useEffect } from 'react';

export default function TabsLayout() {
  const { partenaire, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  usePushNotifications(partenaire?.id || null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Vider toute la stack puis aller au login
      try {
        router.dismissAll();
      } catch (e) {
        // dismissAll peut échouer si pas de stack à dismiss
      }
      router.replace('/');
    }
  }, [isAuthenticated, isLoading]);

  // Ne pas bloquer avec un loader - laisser le replace se faire
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    // Ne rien rendre, le useEffect va rediriger
    return null;
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
