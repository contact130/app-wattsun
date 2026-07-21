import { trpcQuery, trpcMutation } from './client';

export interface Partenaire {
  id: number;
  nom: string;
  prenom: string;
  entreprise: string | null;
  type: string;
  role: 'admin' | 'technicien';
  specialites: string | null;
}

export interface TechnicienItem {
  id: number;
  nom: string;
  prenom: string;
  entreprise: string | null;
  codeAcces: string;
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
  soustraitance: boolean | null;
  donneurOrdre: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Correspond exactement aux colonnes de pipeline_commentaires
export interface Commentaire {
  id: number;
  dossierId: number;
  contenu: string;
  auteurNom: string;          // backend: auteurNom (pas "auteur")
  auteurUserId: number | null;
  pieceJointeUrl: string | null;  // backend: pieceJointeUrl (pas "pieceJointe")
  pieceJointeNom: string | null;
  pieceJointeType: string | null; // 'image' | 'pdf' (pas "pieceJointeMime")
  createdAt: string;              // Date ISO string via superjson
}

// Correspond exactement aux colonnes de pipeline_checklist_items
export interface ChecklistItem {
  id: number;
  dossierId: number;
  pole: string;
  typeTravaux: string | null;
  titre: string;              // backend: titre (pas "label")
  fait: boolean;
  faitPar: string | null;
  dateFait: number | null;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface TacheLiee {
  id: number;
  titre: string;
  description: string | null;
  assigneNom: string | null;
  statut: string;
  priorite: string;
  metier: string | null;
  dateLimite: number | null;
  dateTerminee: number | null;
  createdAt: string;
}

// Structure retournée par portail.techDossierDetail
export interface DossierDetailResponse {
  dossier: Dossier;
  checklists: ChecklistItem[];
  commentaires: Commentaire[];
  tachesLiees: TacheLiee[];
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
export async function getTechDossierDetail(code: string, dossierId: number): Promise<DossierDetailResponse> {
  return await trpcQuery('portail.techDossierDetail', { code, dossierId });
}

// Ajouter un commentaire
// Backend attend: pieceJointeBase64 (pas "pieceJointe")
export async function addCommentaire(data: {
  code: string;
  dossierId: number;
  contenu: string;
  pieceJointeBase64?: string;
  pieceJointeNom?: string;
  pieceJointeMime?: string;
}): Promise<{ id: number }> {
  return await trpcMutation('portail.addCommentaire', data);
}

// Toggle checklist
// Le backend attend { code, id, fait } (pas "checklistId")
export async function toggleChecklist(data: {
  code: string;
  checklistId: number;
  fait: boolean;
}): Promise<{ success: boolean }> {
  return await trpcMutation('portail.toggleChecklist', {
    code: data.code,
    id: data.checklistId,
    fait: data.fait,
  });
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

// ─── Admin endpoints ─────────────────────────────────────────────────

// Liste des techniciens (admin only)
export async function listTechniciens(code: string): Promise<TechnicienItem[]> {
  return await trpcQuery('portail.listTechniciens', { code });
}

// Assigner des techniciens à un dossier (admin only)
export async function assignTechniciens(data: {
  code: string;
  dossierId: number;
  partenaireIds: number[];
}): Promise<{ success: boolean }> {
  return await trpcMutation('portail.assignTechniciens', data);
}

// Récupérer les assignations d'un dossier (admin only)
export async function getDossierAssignations(code: string, dossierId: number): Promise<{ id: number; partenaireId: number; assignedAt: string }[]> {
  return await trpcQuery('portail.getDossierAssignations', { code, dossierId });
}

// Créer un nouveau dossier (admin only)
export async function createDossier(data: {
  code: string;
  nom: string;
  prenom?: string;
  ville?: string;
  typesTravaux?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  societe?: 'wattsun' | 'wattco';
}): Promise<{ id: number }> {
  return await trpcMutation('portail.createDossier', data);
}

// Récupérer le nombre de notifications non lues par dossier
export async function getUnreadByDossier(code: string): Promise<Record<string, number>> {
  return await trpcQuery('notifications.partenaireUnreadByDossier', { code });
}

// Marquer les notifications comme lues pour un dossier spécifique
export async function markReadForDossier(code: string, dossierId: number): Promise<{ success: boolean }> {
  return await trpcMutation('notifications.partenaireMarkReadForDossier', { code, dossierId });
}
