import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { createDossier } from '../src/api/portail';

const TYPES_TRAVAUX = [
  { key: 'pv', label: 'Photovoltaïque', icon: 'sunny' },
  { key: 'pac', label: 'Pompe à chaleur', icon: 'snow' },
  { key: 'isolation', label: 'Isolation', icon: 'layers' },
  { key: 'borne', label: 'Borne IRVE', icon: 'flash' },
  { key: 'ballon', label: 'Ballon thermo.', icon: 'water' },
  { key: 'electricite', label: 'Électricité', icon: 'bulb' },
  { key: 'couverture', label: 'Couverture', icon: 'home' },
  { key: 'menuiseries', label: 'Menuiseries', icon: 'grid' },
];

export default function NouveauChantierScreen() {
  const { code, partenaire } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [ville, setVille] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [societe, setSociete] = useState<'wattsun' | 'wattco'>('wattsun');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleType(key: string) {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  }

  async function handleCreate() {
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Le nom du client est obligatoire');
      return;
    }
    if (!code) return;

    setLoading(true);
    try {
      const result = await createDossier({
        code,
        nom: nom.trim(),
        prenom: prenom.trim(),
        ville: ville.trim() || undefined,
        telephone: telephone.trim() || undefined,
        email: email.trim() || undefined,
        adresse: adresse.trim() || undefined,
        typesTravaux: selectedTypes.length > 0 ? JSON.stringify(selectedTypes) : '',
        societe,
      });
      Alert.alert('Succès', 'Chantier créé avec succès', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de créer le chantier');
    } finally {
      setLoading(false);
    }
  }

  // Vérifier que l'utilisateur est admin
  if (partenaire?.role !== 'admin') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFB' }}>
        <Ionicons name="lock-closed" size={48} color="#D1D5DB" />
        <Text style={{ fontSize: 16, color: '#687076', marginTop: 12 }}>Accès réservé aux admins</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F8FAFB', paddingTop: insets.top }}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#11181C' }}>
          Nouveau chantier
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Société */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C', marginBottom: 8 }}>
          Société
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
          <TouchableOpacity
            onPress={() => setSociete('wattsun')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: societe === 'wattsun' ? '#1B7D4B' : '#E5E7EB',
              backgroundColor: societe === 'wattsun' ? '#1B7D4B10' : '#fff',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '600', color: societe === 'wattsun' ? '#1B7D4B' : '#687076' }}>
              Wattsun
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSociete('wattco')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: societe === 'wattco' ? '#3B82F6' : '#E5E7EB',
              backgroundColor: societe === 'wattco' ? '#3B82F610' : '#fff',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '600', color: societe === 'wattco' ? '#3B82F6' : '#687076' }}>
              Watt'co
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nom */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C', marginBottom: 6 }}>
          Nom du client *
        </Text>
        <TextInput
          value={nom}
          onChangeText={setNom}
          placeholder="Nom"
          placeholderTextColor="#9BA1A6"
          style={inputStyle}
        />

        {/* Prénom */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C', marginBottom: 6, marginTop: 14 }}>
          Prénom
        </Text>
        <TextInput
          value={prenom}
          onChangeText={setPrenom}
          placeholder="Prénom"
          placeholderTextColor="#9BA1A6"
          style={inputStyle}
        />

        {/* Ville */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C', marginBottom: 6, marginTop: 14 }}>
          Ville
        </Text>
        <TextInput
          value={ville}
          onChangeText={setVille}
          placeholder="Ville"
          placeholderTextColor="#9BA1A6"
          style={inputStyle}
        />

        {/* Adresse */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C', marginBottom: 6, marginTop: 14 }}>
          Adresse complète
        </Text>
        <TextInput
          value={adresse}
          onChangeText={setAdresse}
          placeholder="Adresse"
          placeholderTextColor="#9BA1A6"
          style={inputStyle}
        />

        {/* Téléphone */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C', marginBottom: 6, marginTop: 14 }}>
          Téléphone
        </Text>
        <TextInput
          value={telephone}
          onChangeText={setTelephone}
          placeholder="06 XX XX XX XX"
          placeholderTextColor="#9BA1A6"
          keyboardType="phone-pad"
          style={inputStyle}
        />

        {/* Email */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C', marginBottom: 6, marginTop: 14 }}>
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@exemple.com"
          placeholderTextColor="#9BA1A6"
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle}
        />

        {/* Types de travaux */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C', marginBottom: 10, marginTop: 20 }}>
          Types de travaux
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TYPES_TRAVAUX.map((t) => {
            const selected = selectedTypes.includes(t.key);
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => toggleType(t.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: selected ? '#1B7D4B' : '#E5E7EB',
                  backgroundColor: selected ? '#1B7D4B10' : '#fff',
                }}
              >
                <Ionicons
                  name={t.icon as any}
                  size={16}
                  color={selected ? '#1B7D4B' : '#9BA1A6'}
                  style={{ marginRight: 6 }}
                />
                <Text style={{ fontSize: 13, fontWeight: '500', color: selected ? '#1B7D4B' : '#687076' }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bouton créer */}
        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading}
          style={{
            marginTop: 30,
            backgroundColor: '#1B7D4B',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Créer le chantier</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: '#fff',
  borderWidth: 1.5,
  borderColor: '#E5E7EB',
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 16,
  color: '#11181C',
};
