import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ProfilScreen() {
  const { partenaire, code, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  function handleLogout() {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // La redirection est gérée automatiquement par le useEffect dans _layout.tsx
          },
        },
      ]
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
      }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#11181C' }}>Profil</Text>
      </View>

      {/* Carte profil */}
      <View style={{
        margin: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#1B7D4B',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>
              {partenaire?.prenom?.[0]}{partenaire?.nom?.[0]}
            </Text>
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#11181C' }}>
              {partenaire?.prenom} {partenaire?.nom}
            </Text>
            <Text style={{ fontSize: 14, color: '#687076', marginTop: 2 }}>
              {partenaire?.entreprise || 'Technicien'}
            </Text>
            {partenaire?.specialites && (
              <Text style={{ fontSize: 13, color: '#9BA1A6', marginTop: 2 }}>
                {partenaire.specialites}
              </Text>
            )}
          </View>
        </View>

        <View style={{
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 0.5,
          borderTopColor: '#E5E7EB',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="key" size={16} color="#9BA1A6" />
            <Text style={{ fontSize: 14, color: '#687076', marginLeft: 8 }}>
              Code : <Text style={{ fontWeight: '600', color: '#11181C' }}>{code}</Text>
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark" size={16} color="#1B7D4B" />
            <Text style={{ fontSize: 14, color: '#1B7D4B', marginLeft: 8, fontWeight: '500' }}>
              {partenaire?.role === 'admin' ? 'Administrateur' : 'Technicien'} actif
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={{ margin: 16, marginTop: 0 }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#FEE2E2',
          }}
        >
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={{ fontSize: 15, color: '#EF4444', fontWeight: '600', marginLeft: 12 }}>
            Se déconnecter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <View style={{ position: 'absolute', bottom: 40 + insets.bottom, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#D1D5DB' }}>App Wattsun® v1.0.0</Text>
      </View>
    </View>
  );
}
