import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Linking,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getTechDossierDetail,
  addCommentaire,
  toggleChecklist,
  DossierDetailResponse,
  Commentaire,
  ChecklistItem,
} from '../../src/api/portail';

type Tab = 'discussion' | 'infos';

function formatMessageTime(timestamp: string | number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatMessageDate(timestamp: string | number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseTypesTravaux(raw: string | null): string {
  if (!raw) return '—';
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

function formatStatut(raw: string | null): string {
  if (!raw) return '—';
  // Remplacer les underscores par des espaces
  let formatted = raw.replace(/_/g, ' ');
  // Corriger les accents manquants
  if (formatted.toLowerCase() === 'livre') return 'Livré';
  if (formatted.toLowerCase() === 'en cours') return 'En cours';
  if (formatted.toLowerCase() === 'termine') return 'Terminé';
  if (formatted.toLowerCase() === 'annule') return 'Annulé';
  if (formatted.toLowerCase() === 'cloture') return 'Clôturé';
  return capitalizeFirst(formatted);
}

function getStatutColor(statut: string | null): { bg: string; text: string } {
  if (!statut) return { bg: '#F3F4F6', text: '#6B7280' };
  const s = statut.toLowerCase();
  if (s.includes('en_cours') || s.includes('en cours')) return { bg: '#FEF3C7', text: '#92400E' };
  if (s.includes('livre') || s.includes('livré')) return { bg: '#DCFCE7', text: '#166534' };
  if (s.includes('termin') || s.includes('clotur')) return { bg: '#E0E7FF', text: '#3730A3' };
  if (s.includes('annul')) return { bg: '#FEE2E2', text: '#991B1B' };
  if (s.includes('attente') || s.includes('pause')) return { bg: '#F3F4F6', text: '#6B7280' };
  return { bg: '#F3F4F6', text: '#374151' };
}

export default function DossierScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<DossierDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('discussion');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const { code, partenaire } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const fetchDossier = useCallback(async () => {
    if (!code || !id) return;
    try {
      const data = await getTechDossierDetail(code, parseInt(id));
      setDetail(data);
    } catch (e) {
      console.error('Erreur chargement dossier:', e);
    } finally {
      setLoading(false);
    }
  }, [code, id]);

  useEffect(() => {
    fetchDossier();
    const interval = setInterval(fetchDossier, 10000);
    return () => clearInterval(interval);
  }, [fetchDossier]);

  async function handleSend() {
    if (!message.trim() || !code || !id || sending) return;
    setSending(true);
    try {
      await addCommentaire({
        code,
        dossierId: parseInt(id),
        contenu: message.trim(),
      });
      setMessage('');
      await fetchDossier();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'envoyer le message");
    } finally {
      setSending(false);
    }
  }

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      await sendImage(result.assets[0]);
    }
  }

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la caméra est nécessaire pour prendre des photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      await sendImage(result.assets[0]);
    }
  }

  async function sendImage(asset: ImagePicker.ImagePickerAsset) {
    if (!code || !id) return;
    setSending(true);
    try {
      const base64 = asset.base64;
      const mime = asset.mimeType || 'image/jpeg';
      const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
      
      // Backend attend pieceJointeBase64 (pas pieceJointe)
      await addCommentaire({
        code,
        dossierId: parseInt(id),
        contenu: ' ',
        pieceJointeBase64: base64 || '',
        pieceJointeNom: fileName,
        pieceJointeMime: mime,
      });
      await fetchDossier();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'envoyer la photo");
    } finally {
      setSending(false);
    }
  }

  function showImageOptions() {
    Alert.alert('Envoyer une photo', 'Choisissez une option', [
      { text: 'Prendre une photo', onPress: handleTakePhoto },
      { text: 'Choisir dans la galerie', onPress: handlePickImage },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  async function handleToggleChecklist(item: ChecklistItem) {
    if (!code) return;
    try {
      await toggleChecklist({
        code,
        checklistId: item.id,
        fait: !item.fait,
      });
      await fetchDossier();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de modifier la checklist');
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color="#1B7D4B" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFB' }}>
        <Text style={{ color: '#687076' }}>Dossier introuvable</Text>
      </View>
    );
  }

  const { dossier, checklists, commentaires, tachesLiees } = detail;

  // Trier les commentaires par date
  const sortedComments = [...(commentaires || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Extraire toutes les photos des commentaires (pièces jointes de type image)
  const allPhotos = commentaires
    .filter(c => c.pieceJointeUrl && c.pieceJointeType === 'image')
    .map(c => ({ id: c.id, url: c.pieceJointeUrl!, createdAt: c.createdAt }));

  // Ouvrir la galerie plein écran à l'index de la photo tapée
  function openFullscreen(url: string) {
    const idx = allPhotos.findIndex(p => p.url === url);
    setFullscreenIndex(idx >= 0 ? idx : 0);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFB', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#11181C' }} numberOfLines={1}>
            Chantier — {dossier.nom} {dossier.prenom}
          </Text>
          <Text style={{ fontSize: 12, color: '#687076' }} numberOfLines={1}>
            {parseTypesTravaux(dossier.typesTravaux)} — {dossier.ville || 'Ville non renseignée'}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
      }}>
        <TouchableOpacity
          onPress={() => setTab('discussion')}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: tab === 'discussion' ? '#1B7D4B' : 'transparent',
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: tab === 'discussion' ? '#1B7D4B' : '#9BA1A6',
          }}>
            Discussion
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('infos')}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: tab === 'infos' ? '#1B7D4B' : 'transparent',
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: tab === 'infos' ? '#1B7D4B' : '#9BA1A6',
          }}>
            Infos chantier
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'discussion' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={sortedComments}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item, index }) => {
              const isMe = item.auteurNom === `${partenaire?.prenom} ${partenaire?.nom}`;
              const showDate = index === 0 || 
                formatMessageDate(item.createdAt) !== formatMessageDate(sortedComments[index - 1].createdAt);

              return (
                <View>
                  {showDate && (
                    <View style={{ alignItems: 'center', marginVertical: 12 }}>
                      <Text style={{
                        fontSize: 12,
                        color: '#9BA1A6',
                        backgroundColor: '#F3F4F6',
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 10,
                      }}>
                        {formatMessageDate(item.createdAt)}
                      </Text>
                    </View>
                  )}
                  <View style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    marginBottom: 6,
                  }}>
                    {!isMe && (
                      <Text style={{ fontSize: 11, color: '#1B7D4B', fontWeight: '600', marginBottom: 2, marginLeft: 4 }}>
                        {item.auteurNom}
                      </Text>
                    )}
                    <View style={{
                      backgroundColor: isMe ? '#1B7D4B' : '#fff',
                      borderRadius: 16,
                      borderTopRightRadius: isMe ? 4 : 16,
                      borderTopLeftRadius: isMe ? 16 : 4,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}>
                      {/* Afficher la pièce jointe image (cliquable pour plein écran) */}
                      {item.pieceJointeUrl && item.pieceJointeType === 'image' && (
                        <TouchableOpacity
                          onPress={() => openFullscreen(item.pieceJointeUrl!)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: item.pieceJointeUrl }}
                            style={{
                              width: 220,
                              height: 165,
                              borderRadius: 8,
                              marginBottom: item.contenu.trim() ? 6 : 0,
                            }}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {/* Afficher la pièce jointe PDF */}
                      {item.pieceJointeUrl && item.pieceJointeType === 'pdf' && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(item.pieceJointeUrl!)}
                          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
                        >
                          <Ionicons name="document" size={16} color={isMe ? '#fff' : '#1B7D4B'} />
                          <Text style={{ fontSize: 13, color: isMe ? '#fff' : '#1B7D4B', marginLeft: 4, textDecorationLine: 'underline' }}>
                            {item.pieceJointeNom || 'Document PDF'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {/* N'afficher le texte que s'il y a un vrai contenu (pas juste un espace pour les photos) */}
                      {item.contenu.trim() ? (
                        <Text style={{ fontSize: 15, color: isMe ? '#fff' : '#11181C', lineHeight: 20 }}>
                          {item.contenu}
                        </Text>
                      ) : null}
                      <Text style={{
                        fontSize: 10,
                        color: isMe ? 'rgba(255,255,255,0.7)' : '#9BA1A6',
                        marginTop: 4,
                        alignSelf: 'flex-end',
                      }}>
                        {formatMessageTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="chatbubbles-outline" size={40} color="#D1D5DB" />
                <Text style={{ color: '#9BA1A6', marginTop: 8 }}>Aucun message</Text>
                <Text style={{ color: '#D1D5DB', fontSize: 13, marginTop: 4 }}>
                  Envoyez le premier message !
                </Text>
              </View>
            }
          />

          {/* Input bar */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingHorizontal: 12,
            paddingVertical: 8,
            paddingBottom: 8 + insets.bottom,
            backgroundColor: '#fff',
            borderTopWidth: 0.5,
            borderTopColor: '#E5E7EB',
          }}>
            <TouchableOpacity
              onPress={showImageOptions}
              style={{ padding: 8, marginRight: 4 }}
            >
              <Ionicons name="camera" size={24} color="#1B7D4B" />
            </TouchableOpacity>
            <View style={{
              flex: 1,
              backgroundColor: '#F3F4F6',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: Platform.OS === 'ios' ? 10 : 6,
              maxHeight: 100,
            }}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Écrire un message..."
                placeholderTextColor="#9BA1A6"
                multiline
                style={{ fontSize: 15, color: '#11181C', maxHeight: 80 }}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!message.trim() || sending}
              style={{
                padding: 8,
                marginLeft: 4,
                opacity: message.trim() ? 1 : 0.4,
              }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#1B7D4B" />
              ) : (
                <Ionicons name="send" size={22} color="#1B7D4B" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* Onglet Infos */
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Infos client */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#11181C', marginBottom: 12 }}>
              Informations client
            </Text>
            <InfoRow icon="person" label="Client" value={`${dossier.prenom || ''} ${dossier.nom || ''}`.trim() || '—'} />
            <InfoRow icon="location" label="Adresse" value={dossier.adresse || '—'} />
            <InfoRow icon="business" label="Ville" value={dossier.ville || '—'} />
            {dossier.telephone ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${dossier.telephone}`)}>
                <InfoRow icon="call" label="Téléphone" value={dossier.telephone} valueColor="#1B7D4B" />
              </TouchableOpacity>
            ) : null}
            {dossier.email ? (
              <InfoRow icon="mail" label="Email" value={dossier.email} />
            ) : null}
          </View>

          {/* Infos chantier */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#11181C', marginBottom: 12 }}>
              Détails du chantier
            </Text>
            <InfoRow icon="construct" label="Type" value={parseTypesTravaux(dossier.typesTravaux)} />
            {/* Statut avec badge coloré */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="flag" size={16} color="#9BA1A6" style={{ width: 24 }} />
              <Text style={{ fontSize: 13, color: '#687076', width: 90 }}>Statut</Text>
              <View style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: getStatutColor(dossier.statut).bg,
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: getStatutColor(dossier.statut).text,
                }}>
                  {formatStatut(dossier.statut)}
                </Text>
              </View>
            </View>
            <InfoRow icon="briefcase" label="Société" value={dossier.societe ? capitalizeFirst(dossier.societe) : '—'} />
            {dossier.donneurOrdre ? (
              <InfoRow icon="people" label="Donneur d'ordre" value={dossier.donneurOrdre} />
            ) : null}
            {dossier.notes ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#687076', marginBottom: 4 }}>Notes :</Text>
                <Text style={{ fontSize: 14, color: '#11181C', lineHeight: 20 }}>{dossier.notes}</Text>
              </View>
            ) : null}
          </View>

          {/* Checklist */}
          {checklists && checklists.length > 0 && (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#11181C', marginBottom: 12 }}>
                Checklist ({checklists.filter(c => c.fait).length}/{checklists.length})
              </Text>
              {checklists.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleToggleChecklist(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#F3F4F6',
                  }}
                >
                  <Ionicons
                    name={item.fait ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={item.fait ? '#1B7D4B' : '#D1D5DB'}
                  />
                  <Text style={{
                    fontSize: 14,
                    color: item.fait ? '#687076' : '#11181C',
                    marginLeft: 10,
                    flex: 1,
                  }}>
                    {item.titre}
                  </Text>
                  {item.faitPar && (
                    <Text style={{ fontSize: 11, color: '#9BA1A6' }}>{item.faitPar}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Photos (extraites des commentaires) */}
          {allPhotos.length > 0 && (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#11181C', marginBottom: 12 }}>
                Photos ({allPhotos.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {allPhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    onPress={() => openFullscreen(photo.url)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: photo.url }}
                      style={{ width: 100, height: 100, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Tâches liées */}
          {tachesLiees && tachesLiees.length > 0 && (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#11181C', marginBottom: 12 }}>
                Tâches ({tachesLiees.length})
              </Text>
              {tachesLiees.map((tache) => (
                <View key={tache.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 0.5,
                  borderBottomColor: '#F3F4F6',
                }}>
                  <Ionicons
                    name={tache.statut === 'termine' ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={tache.statut === 'termine' ? '#1B7D4B' : '#F59E0B'}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontSize: 14, color: '#11181C' }}>{tache.titre}</Text>
                    {tache.assigneNom && (
                      <Text style={{ fontSize: 12, color: '#687076', marginTop: 2 }}>
                        Assigné à {tache.assigneNom}
                      </Text>
                    )}
                  </View>
                  <View style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: tache.statut === 'termine' ? '#DCFCE7' : '#FEF3C7',
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: tache.statut === 'termine' ? '#166534' : '#92400E',
                    }}>
                      {tache.statut === 'termine' ? 'Terminé' : tache.statut === 'en_cours' ? 'En cours' : 'À faire'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal plein écran avec swipe gauche/droite */}
      <Modal
        visible={fullscreenIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenIndex(null)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.95)',
        }}>
          <StatusBar barStyle="light-content" />
          {/* Header: bouton fermer + compteur */}
          <View style={{
            position: 'absolute',
            top: insets.top + 10,
            left: 0,
            right: 0,
            zIndex: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
              {fullscreenIndex !== null ? `${fullscreenIndex + 1} / ${allPhotos.length}` : ''}
            </Text>
            <TouchableOpacity
              onPress={() => setFullscreenIndex(null)}
              style={{
                padding: 8,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 20,
              }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          {/* Carousel horizontal */}
          {fullscreenIndex !== null && (
            <FlatList
              key={`gallery-${fullscreenIndex}`}
              data={allPhotos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={fullscreenIndex}
              getItemLayout={(_, index) => ({
                length: Dimensions.get('window').width,
                offset: Dimensions.get('window').width * index,
                index,
              })}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                setFullscreenIndex(newIndex);
              }}
              keyExtractor={(item) => item.id.toString()}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View style={{
                  width: Dimensions.get('window').width,
                  height: Dimensions.get('window').height,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Image
                    source={{ uri: item.url }}
                    style={{
                      width: Dimensions.get('window').width,
                      height: Dimensions.get('window').height * 0.75,
                    }}
                    resizeMode="contain"
                  />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <Ionicons name={icon as any} size={16} color="#9BA1A6" style={{ width: 24 }} />
      <Text style={{ fontSize: 13, color: '#687076', width: 90 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: valueColor || '#11181C', flex: 1, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}
