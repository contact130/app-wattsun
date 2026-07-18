import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { subscribePush } from '../api/portail';

// Configuration du handler de notifications
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
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if (!partenaireId) return;

    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Enregistrer le token sur le backend
        registerTokenOnBackend(token, partenaireId);
      }
    });

    // Listener pour les notifications reçues en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listener pour les interactions avec les notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      // Navigation vers le dossier si un lien est fourni
      if (data?.dossierId) {
        // La navigation sera gérée par le composant parent
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [partenaireId]);

  return { expoPushToken, notification };
}

async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Vérifier les permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission notifications refusée');
    return null;
  }

  // Obtenir le token Expo Push
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    token = tokenData.data;
  } catch (e) {
    console.log('Erreur obtention token push:', e);
  }

  // Configuration Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B7D4B',
    });
  }

  return token;
}

async function registerTokenOnBackend(token: string, partenaireId: number) {
  try {
    await subscribePush({
      partenaireId,
      endpoint: token,
      p256dh: 'expo-push',
      auth: 'expo-push',
    });
    console.log('Token push enregistré sur le backend');
  } catch (e) {
    console.error('Erreur enregistrement token push:', e);
  }
}
