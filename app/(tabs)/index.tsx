import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { getTechDossiers, Dossier, getUnreadByDossier } from '../../src/api/portail';

// Couleurs par type de travaux
function getTypeColor(type: string | null): string {
  if (!type) return '#9BA1A6';
  const t = type.toLowerCase();
  if (t.includes('pac') || t.includes('pompe')) return '#3B82F6';
  if (t.includes('photo') || t.includes('pv') || t.includes('solaire')) return '#F59E0B';
  if (t.includes('isol') || t.includes('ite') || t.includes('iti')) return '#8B5CF6';
  if (t.includes('ballon') || t.includes('ecs') || t.includes('thermo')) return '#06B6D4';
  return '#1B7D4B';
}

function getTypeIcon(type: string | null): string {
  if (!type) return 'construct';
  const t = type.toLowerCase();
  if (t.includes('pac') || t.includes('pompe')) return 'snow';
  if (t.includes('photo') || t.includes('pv') || t.includes('solaire')) return 'sunny';
  if (t.includes('isol') || t.includes('ite') || t.includes('iti')) return 'layers';
  if (t.includes('ballon') || t.includes('ecs') || t.includes('thermo')) return 'water';
  return 'construct';
}

function formatDate(timestamp: number | string | null): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Hier';
  if (days < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTypesTravaux(raw: string | null): string {
  if (!raw) return 'Chantier';
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr.map((t: string) => capitalizeFirst(t.trim())).join(', ');
    }
    return capitalizeFirst(raw);
  } catch {
    return capitalizeFirst(raw);
  }
}

function formatStatutLabel(raw: string | null): string {
  if (!raw) return '';
  // Remplacer les underscores par des espaces
  let formatted = raw.replace(/_/g, ' ');
  // Corriger les accents manquants
  if (formatted.toLowerCase() === 'livre') formatted = 'Livré';
  if (formatted.toLowerCase() === 'en cours') formatted = 'En cours';
  if (formatted.toLowerCase() === 'termine') formatted = 'Terminé';
  if (formatted.toLowerCase() === 'annule') formatted = 'Annulé';
  if (formatted.toLowerCase() === 'cloture') formatted = 'Clôturé';
  return capitalizeFirst(formatted);
}

function getStatutBadgeColor(statut: string | null): { bg: string; text: string } {
  if (!statut) return { bg: '#F3F4F6', text: '#6B7280' };
  const s = statut.toLowerCase();
  if (s.includes('en_cours') || s.includes('en cours')) return { bg: '#FEF3C7', text: '#92400E' };
  if (s.includes('livre') || s.includes('livré')) return { bg: '#DCFCE7', text: '#166534' };
  if (s.includes('termin') || s.includes('clotur')) return { bg: '#E0E7FF', text: '#3730A3' };
  if (s.includes('annul')) return { bg: '#FEE2E2', text: '#991B1B' };
  if (s.includes('attente') || s.includes('pause')) return { bg: '#F3F4F6', text: '#6B7280' };
  return { bg: '#F3F4F6', text: '#374151' };
}

export default function ChantiersList() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { code, partenaire } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Nettoyer les données quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!code) {
      setDossiers([]);
      setUnreadCounts({});
      setLoading(false);
    }
  }, [code]);

  const fetchDossiers = useCallback(async () => {
    if (!code) return;
    try {
      const [data, unread] = await Promise.all([
        getTechDossiers(code),
        getUnreadByDossier(code).catch(() => ({})),
      ]);
      // Trier par updatedAt décroissant (comme WhatsApp - dernière activité en haut)
      data.sort((a, b) => {
        const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tB - tA;
      });
      setDossiers(data);
      setUnreadCounts(unread);
    } catch (e) {
      console.error('Erreur chargement dossiers:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [code]);

  useEffect(() => {
    fetchDossiers();
    // Polling toutes les 15 secondes
    const interval = setInterval(fetchDossiers, 15000);
    return () => clearInterval(interval);
  }, [fetchDossiers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDossiers();
  }, [fetchDossiers]);

  function renderDossier({ item }: { item: Dossier }) {
    const color = getTypeColor(item.typesTravaux);
    const icon = getTypeIcon(item.typesTravaux);
    const unreadCount = unreadCounts[String(item.id)] || 0;
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/dossier/${item.id}`)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: unreadCount > 0 ? '#F0FDF4' : '#fff',
          borderBottomWidth: 0.5,
          borderBottomColor: '#E5E7EB',
        }}
        activeOpacity={0.6}
      >
        {/* Avatar / Icône type */}
        <View style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: color + '15',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>

        {/* Infos */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: unreadCount > 0 ? '700' : '600', color: '#11181C' }} numberOfLines={1}>
              {item.nom} {item.prenom}
            </Text>
            <Text style={{ fontSize: 12, color: '#9BA1A6' }}>
              {formatDate(item.updatedAt)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
            <Text style={{ fontSize: 13, color: '#687076', flex: 1 }} numberOfLines={1}>
              {formatTypesTravaux(item.typesTravaux)} — {item.ville || 'Ville non renseignée'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            {item.statut && (
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor: getStatutBadgeColor(item.statut).bg,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: getStatutBadgeColor(item.statut).text,
                }}>
                  {formatStatutLabel(item.statut)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Badge non lus + Chevron */}
        <View style={{ alignItems: 'center', marginLeft: 8 }}>
          {unreadCount > 0 ? (
            <View style={{
              minWidth: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#1B7D4B',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 6,
              marginBottom: 4,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color="#1B7D4B" />
      </View>
    );
  }

  const isAdmin = partenaire?.role === 'admin';

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
            {isAdmin ? 'Tous les chantiers' : 'Mes chantiers'}
          </Text>
          <Text style={{ fontSize: 13, color: '#687076', marginTop: 2 }}>
            {partenaire?.prenom} {partenaire?.nom} {isAdmin ? '(Admin)' : ''} — {dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => router.push('/nouveau-chantier')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#1B7D4B',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Liste */}
      <FlatList
        data={dossiers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDossier}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B7D4B" />
        }
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
            <Ionicons name="construct-outline" size={48} color="#D1D5DB" />
            <Text style={{ fontSize: 16, color: '#687076', marginTop: 12 }}>
              Aucun chantier assigné
            </Text>
          </View>
        }
      />
    </View>
  );
}
