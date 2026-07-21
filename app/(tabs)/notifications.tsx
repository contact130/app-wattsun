import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { getNotifications, markAllRead, Notification } from '../../src/api/portail';

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { code } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Nettoyer les données quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!code) {
      setNotifications([]);
      setLoading(false);
    }
  }, [code]);

  const fetchNotifications = useCallback(async () => {
    if (!code) return;
    try {
      const data = await getNotifications(code);
      setNotifications(data);
    } catch (e) {
      console.error('Erreur chargement notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [code]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkAllRead() {
    if (!code) return;
    try {
      await markAllRead(code);
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
    } catch (e) {
      console.error('Erreur markAllRead:', e);
    }
  }

  function handleNotifPress(notif: Notification) {
    // Extraire l'ID du dossier du lien
    if (notif.lien) {
      const match = notif.lien.match(/\/(\d+)$/);
      if (match) {
        router.push(`/dossier/${match[1]}`);
      }
    }
  }

  const unreadCount = notifications.filter(n => !n.lue).length;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color="#1B7D4B" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFB', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#11181C' }}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text style={{ fontSize: 13, color: '#1B7D4B', marginTop: 2 }}>
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={{ padding: 8 }}>
            <Text style={{ fontSize: 14, color: '#1B7D4B', fontWeight: '600' }}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B7D4B" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleNotifPress(item)}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: item.lue ? '#fff' : '#F0FDF4',
              borderBottomWidth: 0.5,
              borderBottomColor: '#E5E7EB',
            }}
            activeOpacity={0.6}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: item.lue ? '#F3F4F6' : '#DCFCE7',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Ionicons
                name="chatbubble"
                size={18}
                color={item.lue ? '#9BA1A6' : '#1B7D4B'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: item.lue ? '400' : '600', color: '#11181C' }}>
                {item.titre}
              </Text>
              <Text style={{ fontSize: 13, color: '#687076', marginTop: 2 }} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={{ fontSize: 11, color: '#9BA1A6', marginTop: 4 }}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
            {!item.lue && (
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#1B7D4B',
                marginTop: 6,
              }} />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
            <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
            <Text style={{ fontSize: 16, color: '#687076', marginTop: 12 }}>
              Aucune notification
            </Text>
          </View>
        }
      />
    </View>
  );
}
