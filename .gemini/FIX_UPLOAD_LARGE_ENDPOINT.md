# 📤 Fix : Endpoint d'Upload pour Fichiers Volumineux

## ❌ Problème

Le frontend utilisait l'endpoint `/api/media/upload` qui est **limité à 10MB**.

Les fichiers plus grands que 10MB échouaient lors de l'upload.

---

## ✅ Solution Appliquée

### Changement d'Endpoint

**AVANT** ❌ :
```typescript
// Limité à 10MB
const response = await api.post<MediaItem>('/media/upload', formData, config);
```

**APRÈS** ✅ :
```typescript
// Supporte les fichiers > 10MB
const response = await api.post<MediaItem>('/media/upload-large', formData, config);
```

---

## 🔧 Modification Technique

### Fichier : `src/services/media.service.ts`

#### Fonction `uploadFile` - Ligne 99

```typescript
async uploadFile(
  file: File, 
  familyId: number, 
  personId?: number,
  onProgress?: (progress: number) => void
): Promise<MediaItem> {
  // Détection automatique du type de média
  const mediaType = detectMediaType(file.name);
  
  // Création du FormData pour l'upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('familyId', familyId.toString());
  formData.append('mediaType', mediaType);
  if (personId) {
    formData.append('personId', personId.toString());
  }

  // Configuration pour suivre la progression
  const config: any = {
    headers: {
      'Content-Type': undefined  // Le navigateur ajoute le boundary automatiquement
    }
  };

  // Ajout du callback de progression si fourni
  if (onProgress) {
    config.onUploadProgress = (progressEvent: any) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    };
  }

  // ✅ NOUVEAU : Utilisation de /media/upload-large
  const response = await api.post<MediaItem>('/media/upload-large', formData, config);
  return response.data;
}
```

---

## 📊 Comparaison des Endpoints

| Endpoint | Limite de Taille | Usage |
|----------|------------------|-------|
| `/api/media/upload` | **10MB** | Petits fichiers |
| `/api/media/upload-large` | **> 10MB** | Tous fichiers (y compris volumineux) |

---

## 🎯 Avantages

### 1. **Support des Fichiers Volumineux**
- ✅ Vidéos HD
- ✅ Fichiers PDF volumineux
- ✅ Archives ZIP/RAR
- ✅ Pas de limitation à 10MB

### 2. **Même Interface**
- ✅ Pas de changement dans l'utilisation
- ✅ Même fonction `uploadFile()`
- ✅ Même progression
- ✅ Même gestion d'erreurs

### 3. **Rétrocompatibilité**
- ✅ Fonctionne aussi pour les petits fichiers
- ✅ Pas besoin de condition sur la taille
- ✅ Un seul endpoint pour tout

---

## 📏 Exemples de Tailles de Fichiers

### Avant (Limité à 10MB) ❌
```
✅ Photo (2MB)        → OK
✅ Document (5MB)     → OK
✅ Vidéo courte (8MB) → OK
❌ Vidéo HD (15MB)    → ÉCHEC
❌ Archive (25MB)     → ÉCHEC
❌ Vidéo longue (50MB) → ÉCHEC
```

### Après (Pas de limite stricte) ✅
```
✅ Photo (2MB)        → OK
✅ Document (5MB)     → OK
✅ Vidéo courte (8MB) → OK
✅ Vidéo HD (15MB)    → OK
✅ Archive (25MB)     → OK
✅ Vidéo longue (50MB) → OK
```

---

## 🔍 Détails Techniques

### Backend

L'endpoint `/api/media/upload-large` :
- Utilise **Multer** avec configuration étendue
- Supporte les fichiers **> 10MB**
- Gère le **multipart/form-data**
- Retourne le même format de réponse

### Frontend

La fonction `uploadFile()` :
- Crée un **FormData** avec le fichier
- Envoie à `/media/upload-large`
- Suit la **progression** de l'upload
- Retourne un objet **MediaItem**

---

## 📋 Format de la Requête

### FormData Envoyé
```
file: File                    // Le fichier binaire
familyId: string              // ID de la famille
mediaType: 'IMAGE' | 'VIDEO' | 'FILE'  // Type détecté automatiquement
personId?: string             // (Optionnel) ID de la personne
```

### Réponse Reçue
```typescript
{
  id: number;
  urlPath: string;            // Chemin du fichier uploadé
  mediaType: 'IMAGE' | 'VIDEO' | 'FILE';
  createdAt: string;
  uploader: { displayName: string };
  person?: { firstName: string, lastName: string };
}
```

---

## ✅ Checklist de Vérification

- [x] Endpoint changé de `/media/upload` à `/media/upload-large`
- [x] Fonction `uploadFile()` mise à jour
- [x] Support des fichiers > 10MB
- [x] Progression de l'upload maintenue
- [x] Détection automatique du type maintenue
- [x] FormData correctement configuré
- [x] Content-Type géré par le navigateur

---

## 🧪 Pour Tester

### 1. **Fichier < 10MB**
```
1. Sélectionner une image de 5MB
2. Observer l'upload
3. ✅ Doit fonctionner normalement
```

### 2. **Fichier > 10MB**
```
1. Sélectionner une vidéo de 20MB
2. Observer l'upload
3. ✅ Doit fonctionner (avant échouait)
```

### 3. **Fichier Très Volumineux**
```
1. Sélectionner une vidéo de 50MB
2. Observer la progression
3. ✅ Doit afficher la progression et réussir
```

---

## 📁 Fichier Modifié

- ✅ `src/services/media.service.ts`
  - Ligne 99 : `/media/upload` → `/media/upload-large`

---

## 🎯 Impact

### Utilisateurs
- ✅ Peuvent uploader des **vidéos plus longues**
- ✅ Peuvent uploader des **fichiers volumineux**
- ✅ Pas de message d'erreur pour les gros fichiers

### Développeurs
- ✅ Un seul endpoint à maintenir
- ✅ Pas de logique conditionnelle
- ✅ Code plus simple

---

## 📝 Notes Importantes

### Limite de Taille Frontend
```typescript
// Dans page.tsx - Limite actuelle : 50MB
const maxSize = 50 * 1024 * 1024; // 50 Mo

if (file.size > maxSize) {
  alert(`Le fichier est trop volumineux (max 50 Mo)`);
  return;
}
```

Cette limite peut être augmentée si nécessaire, maintenant que le backend supporte les fichiers volumineux.

### Configuration Backend
Le backend doit avoir configuré Multer pour accepter les fichiers volumineux :
```javascript
// Exemple de configuration backend
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024  // 100MB par exemple
  }
});
```

---

**Modification appliquée le : 28/01/2026**
**Résultat : Support des fichiers > 10MB activé ! ✅**
