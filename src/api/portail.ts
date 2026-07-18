import { trpcQuery, trpcMutation } from './client';

export interface Partenaire {
  id: number;
  nom: string;
  prenom: string;
  entreprise: string | null;
  type: string;
  specialites: string | null;
}

export interface Dossier {
  id: number;
  nom: string;
  prenom: string;
  ville: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  statut: string | null;
  typesTravaux: string | null;
  societe: string | null;
  soustraitance: string | null;
  donneurOrdre: string | null;
  notes: string | null;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface DossierDetail extends Dossier {
  commentaires: Commentaire[];
  checklist: ChecklistItem[];
  photos: Photo[];
}

export interface Commentaire {
  id: number;
  auteur: string;
  contenu: string;
  createdAt: number;
  pieceJointe: string | null;
  pieceJointeNom: string | null;
  pieceJointeMime: string | null;
}

export interface ChecklistItem {
  id: number;
  label: string;
  fait: boolean;
  dateFait: number | null;
  faitPar: string | null;
}

export interface Photo {
  id: number;
  url: string;
  legende: string | null;
  categorie: string | null;
  createdAt: number | null;
}

export interface Notification {
  id: number;
  titre: string;
  message: string;
  lien: string | null;
  lue: boolean;
  createdAt: number;
}

// Vérifier le code technicien
export async function verifyCode(code: string): Promise<Partenaire> {
  return await trpcQuery('portail.verifyCode', { code });
}

// Récupérer les dossiers du technicien
export async function getTechDossiers(code: string): Promise<Dossier[]> {
  return await trpcQuery('portail.techDossiers', { code });
}

// Récupérer le détail d'un dossier
export async function getTechDossierDetail(code: string, dossierId: number): Promise<DossierDetail> {
  return await trpcQuery('portail.techDossierDetail', { code, dossierId });
}

// Ajouter un commentaire
export async function addCommentaire(data: {
  code: string;
  dossierId: number;
  contenu: string;
  pieceJointe?: string;
  pieceJointeNom?: string;
  pieceJointeMime?: string;
}): Promise<{ id: number }> {
  return await trpcMutation('portail.addCommentaire', data);
}

// Toggle checklist
export async function toggleChecklist(data: {
  code: string;
  checklistId: number;
  fait: boolean;
}): Promise<{ success: boolean }> {
  return await trpcMutation('portail.toggleChecklist', data);
}

// Récupérer les notifications
export async function getNotifications(code: string): Promise<Notification[]> {
  return await trpcQuery('notifications.partenaireNotifs', { code });
}

// Marquer toutes les notifications comme lues
export async function markAllRead(code: string): Promise<{ success: boolean }> {
  return await trpcMutation('notifications.partenaireMarkAllRead', { code });
}

// Enregistrer la subscription push
export async function subscribePush(data: {
  partenaireId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ id: number }> {
  return await trpcMutation('pushNotifications.subscribe', data);
}
