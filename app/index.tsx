import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function LoginScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color="#1B7D4B" />
        <Text style={{ marginTop: 16, color: '#687076', fontSize: 16 }}>Chargement...</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  async function handleLogin() {
    if (!code.trim()) {
      setError('Veuillez entrer votre code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(code.trim().toUpperCase());
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F8FAFB' }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        {/* Logo */}
        <View style={{ marginBottom: 40, alignItems: 'center' }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: '#1B7D4B',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 36, color: '#fff', fontWeight: 'bold' }}>W</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#11181C' }}>App Wattsun</Text>
          <Text style={{ fontSize: 15, color: '#687076', marginTop: 4 }}>Espace Technicien</Text>
        </View>

        {/* Input code */}
        <View style={{ width: '100%', marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C', marginBottom: 8 }}>
            Code d'accès
          </Text>
          <TextInput
            value={code}
            onChangeText={(t) => { setCode(t); setError(''); }}
            placeholder="Ex: WE-NICO01"
            placeholderTextColor="#9BA1A6"
            autoCapitalize="characters"
            autoCorrect={false}
            style={{
              backgroundColor: '#fff',
              borderWidth: 1.5,
              borderColor: error ? '#EF4444' : '#E5E7EB',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 18,
              fontWeight: '600',
              letterSpacing: 1,
              color: '#11181C',
            }}
          />
          {error ? (
            <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{error}</Text>
          ) : null}
        </View>

        {/* Bouton connexion */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
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
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Se connecter</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <Text style={{ marginTop: 40, color: '#9BA1A6', fontSize: 12 }}>
          App Wattsun® — Espace Technicien
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
