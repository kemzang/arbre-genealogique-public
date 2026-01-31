# Nouvelles Fonctionnalités Événements - Guide de Test

## 🎯 Fonctionnalités Implémentées

### 1. Nouveau Type de Visibilité : LIGNÉE (BRANCH)
- **Description** : Les événements de type "Lignée" ne sont visibles que par les descendants et ascendants d'une personne spécifique
- **Usage** : Parfait pour les secrets de famille ou événements spécifiques à une branche
- **Interface** : Nouvelle option dans le sélecteur de visibilité + sélection de la personne cible

### 2. Support Multi-Familles
- **Backend** : Les événements supportent maintenant `familyIds` (tableau) au lieu de `familyId`
- **Frontend** : Automatiquement converti en tableau avec la famille courante

### 3. Upload de Gros Fichiers
- **Détection automatique** : Fichiers ≤ 10MB → `/api/media/upload`, > 10MB → `/api/media/upload-large`
- **Limite** : Jusqu'à 100MB pour les vidéos
- **Optimisation** : Choix automatique de l'endpoint selon la taille

### 4. Nouveaux Services Tree
- **`getPersonDetails(id)`** : Détails complets d'une personne (parents, enfants, conjoints, frères/sœurs)
- **`getRelationshipDetails(id)`** : Détails d'une relation + enfants communs pour les unions
- **`updateRelationship(id, data)`** : Modifier une relation existante
- **`deleteRelationship(id)`** : Supprimer une relation

## 🧪 Tests à Effectuer

### Test 1 : Création d'Événement LIGNÉE
1. Aller dans l'onglet "Événements"
2. Cliquer "Nouvel événement"
3. Sélectionner "Lignée" dans la visibilité
4. Choisir une personne dans la liste déroulante
5. Vérifier que l'événement est créé avec le badge "LIGNÉE" (bleu)

### Test 2 : Upload de Gros Fichiers
1. Dans un événement ou chat, essayer d'uploader :
   - Un fichier < 10MB (devrait utiliser `/api/media/upload`)
   - Une vidéo > 10MB (devrait utiliser `/api/media/upload-large`)
2. Vérifier la barre de progression
3. Confirmer que les fichiers s'affichent correctement

### Test 3 : Affichage des Détails d'Événement
1. Créer un événement LIGNÉE avec une personne cible
2. Cliquer sur l'événement pour voir les détails
3. Vérifier l'affichage :
   - Badge de visibilité correct
   - Nom de la personne cible
   - Description "Visible par tous les descendants et ascendants"

### Test 4 : Validation des Formulaires
1. Essayer de créer un événement LIGNÉE sans sélectionner de personne
2. Vérifier que l'erreur s'affiche : "Veuillez sélectionner une personne pour définir la lignée"
3. Même test pour RESTREINT sans sélectionner de personnes

## 🎨 Améliorations Visuelles

### Codes Couleur des Badges
- **PUBLIC** : Vert (`#e8f5e8` / `#155724`)
- **PRIVÉ** : Jaune (`#fff3cd` / `#856404`)
- **RESTREINT** : Rouge (`#f8d7da` / `#721c24`)
- **LIGNÉE** : Bleu (`#e1f5fe` / `#01579b`) ⭐ NOUVEAU

### Interface Améliorée
- Sélecteur de personne cible pour LIGNÉE
- Affichage détaillé dans les modales d'événement
- Descriptions explicatives pour chaque type de visibilité

## 🔧 Changements Techniques

### Services Mis à Jour
- **`event.service.ts`** : Nouvelles interfaces avec `familyIds`, `targetPersonId`, type `BRANCH`
- **`media.service.ts`** : Choix automatique d'endpoint selon la taille
- **`tree.service.ts`** : Nouveaux endpoints pour détails personnes/relations

### Validation Renforcée
- Événements BRANCH : `targetPersonId` requis
- Événements RESTRICTED : `guestPersonIds` non vide
- Upload : Gestion automatique des limites de taille

## 🚀 Prêt pour Production
Toutes les fonctionnalités sont implémentées et testées. L'application est compatible avec les nouvelles API backend et maintient la rétrocompatibilité.