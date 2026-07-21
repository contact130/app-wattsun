import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { subscribePush } from '../api/portail';

// IMPORTANT: Configuration du handler de notifications en foreground
// Ceci DOIT être appelé au niveau module (pas dans un composant)
// pour que les notifications s'affichent en bannière quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(partenaireId: number | null) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!partenaireId) return;

    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        console.log('[PUSH] Token obtained:', token);
        registerTokenOnBackend(token, partenaireId);
      }
    });

    // Listener pour les notifications reçues en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(n => {
      console.log('[PUSH] Notification received in foreground:', n.request.content.title);
      setNotification(n);
    });

    // Listener pour les interactions avec les notifications (tap)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[PUSH] Notification tapped:', response.notification.request.content.data);
      const data = response.notification.request.content.data;
      if (data?.dossierId) {
        // Navigation gérée par le composant parent
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [partenaireId]);

  return { expoPushToken, notification };
}

async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Configurer le canal Android AVANT de demander les permissions
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B7D4B',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PUSH] Permission notifications refusée');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log('[PUSH] Getting token with projectId:', projectId);
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined as any
    );
    token = tokenData.data;
    console.log('[PUSH] Token obtained successfully:', token);
  } catch (e) {
    console.log('[PUSH] Erreur obtention token push:', e);
  }

  return token;
}

async function registerTokenOnBackend(token: string, partenaireId: number) {
  try {
    const result = await subscribePush({
      partenaireId,
      endpoint: token,
      p256dh: 'expo-push',
      auth: 'expo-push',
    });
    console.log('[PUSH] Token enregistré sur le backend, id:', result.id);
  } catch (e) {
    console.error('[PUSH] Erreur enregistrement token push:', e);
  }
}
