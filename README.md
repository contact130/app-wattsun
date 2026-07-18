# App Wattsun® — Application Mobile Technicien

Application mobile React Native (Expo) pour les techniciens Wattsun Énergie et Watt'co Énergie.

## Fonctionnalités

- **Connexion par code** : chaque technicien se connecte avec son code personnel (ex: WE-NICO01)
- **Liste des chantiers** : vue style WhatsApp avec aperçu du dernier message et statut
- **Fil de discussion** : messagerie en temps réel par chantier (texte + photos)
- **Fiche chantier** : informations client, adresse, type de travaux, checklist
- **Notifications push** : alertes natives à chaque nouveau commentaire
- **Envoi de photos** : prise de photo sur le chantier ou sélection depuis la galerie

## Architecture

L'app se connecte au backend existant : `https://appwattsun.manus.space/api/trpc`

```
app/                    # Expo Router (file-based routing)
  _layout.tsx           # Layout principal + AuthProvider
  index.tsx             # Écran de connexion
  (tabs)/               # Navigation par onglets
    _layout.tsx         # Configuration des tabs
    index.tsx           # Liste des chantiers
    notifications.tsx   # Notifications
    profil.tsx          # Profil technicien
  dossier/
    [id].tsx            # Détail dossier (discussion + infos)
src/
  api/
    client.ts           # Client HTTP (axios)
    portail.ts          # Fonctions API portail technicien
  contexts/
    AuthContext.tsx      # Contexte d'authentification
  hooks/
    usePushNotifications.ts  # Hook notifications push Expo
```

## Installation

```bash
# Installer les dépendances
pnpm install

# Lancer en mode développement
pnpm start
```

## Test sur téléphone

1. Installer **Expo Go** sur votre téléphone (App Store / Play Store)
2. Lancer `pnpm start` sur votre machine
3. Scanner le QR code affiché dans le terminal avec Expo Go

## Build pour production

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter à Expo
eas login

# Build Android (APK)
eas build --platform android --profile preview

# Build iOS (nécessite un compte Apple Developer)
eas build --platform ios --profile preview
```

## Configuration

L'URL du backend est configurée dans `src/api/client.ts` :
```typescript
const API_BASE_URL = 'https://appwattsun.manus.space';
```

## Codes d'accès techniciens

| Technicien | Code |
|---|---|
| Biret Thomas | BIRET2026 |
| Damaye Antoine | WE-AP4WGJ |
| Degouy Nicolas | WE-NICO01 |
| Deko Mahmoud | WE-P2RYGY |
| Denimal Albin | WE-CCK4A6 |
| EI-YACHINE Oihid | WE-BP3YCX |
| Gache Kévin | WE-YEHJX7 |
| Machado Hugo | WE-4S36L3 |
| Rabaud Baptiste | WE-N75G4J |
| Théau Xavier | WE-RTN6FB |
| Willay Alex | WSD-ALEX |

## Stack technique

- **Framework** : Expo SDK 54 + React Native 0.81
- **Routing** : Expo Router 6 (file-based)
- **Navigation** : React Navigation (Bottom Tabs)
- **HTTP** : Axios
- **Notifications** : Expo Notifications
- **Caméra** : Expo Image Picker
- **Stockage local** : AsyncStorage + SecureStore
