# Backend API Mapping Notes

## Endpoint: portail.techDossierDetail
Returns: `{ dossier, checklists, commentaires, tachesLiees }`
NOT a flat DossierDetail object!

### dossier fields:
id, nom, prenom, ville, adresse, telephone, email, statut, typesTravaux, societe, soustraitance, donneurOrdre, notes, createdAt, updatedAt

### commentaires fields (from pipeline_commentaires table):
- id
- dossierId
- contenu
- auteurNom (NOT "auteur")
- auteurUserId
- pieceJointeUrl (NOT "pieceJointe")
- pieceJointeNom
- pieceJointeType (NOT "pieceJointeMime") - values: 'image' | 'pdf'
- createdAt (Date object, NOT timestamp number)

### checklists fields (from pipeline_checklist_items table):
- id
- dossierId
- pole
- typeTravaux
- titre (NOT "label")
- fait
- faitPar
- dateFait
- ordre
- createdAt, updatedAt

### addCommentaire mutation input:
Expects: { code, dossierId, contenu, pieceJointeBase64?, pieceJointeNom?, pieceJointeMime? }
NOT "pieceJointe" for the base64 data!

## Endpoint: portail.techDossiers
Returns flat array of dossier objects with: id, nom, prenom, ville, adresse, telephone, email, statut, typesTravaux, societe, soustraitance, donneurOrdre, notes, createdAt, updatedAt
