# 🔧 Fix : Upload de Fichiers avec FormData

## ❌ Problème Identifié

Lors de l'upload de fichiers avec `FormData`, le backend recevait un `Content-Type` incorrect, ce qui empêchait le traitement correct des fichiers.

## 🎯 Cause du Problème

### Configuration Axios par défaut
```typescript
// api.ts
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',  // ← Problème ici !
  },
});
```

Axios définit `Content-Type: application/json` par défaut pour TOUTES les requêtes.

### Pourquoi c'est un problème pour FormData ?

Quand on envoie du `FormData` (pour les fichiers), le navigateur DOIT ajouter automatiquement :
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

Le `boundary` est une chaîne aléatoire générée par le navigateur qui sépare les différentes parties du formulaire.

**Si on définit manuellement `Content-Type: multipart/form-data`**, on n'aura PAS le `boundary`, et le backend ne pourra pas parser les données !

## ✅ Solution Appliquée

### Dans `media.service.ts`

```typescript
async uploadFile(
  file: File, 
  familyId: number, 
  personId?: number,
  onProgress?: (progress: number) => void
): Promise<MediaItem> {
  const mediaType = detectMediaType(file.name);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('familyId', familyId.toString());
  formData.append('mediaType', mediaType);
  if (personId) {
    formData.append('personId', personId.toString());
  }

  // ✅ SOLUTION : Supprimer explicitement le Content-Type
  const config: any = {
    headers: {
      'Content-Type': undefined  // ← Le navigateur le définira automatiquement
    }
  };

  // Ajout du callback de progression
  if (onProgress) {
    config.onUploadProgress = (progressEvent: any) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    };
  }

  const response = await api.post<MediaItem>('/media/upload', formData, config);
  return response.data;
}
```

## 📊 Comparaison

### ❌ AVANT (Ne fonctionnait pas)

```typescript
// Le Content-Type était hérité de la config Axios
const config = onProgress ? {
  onUploadProgress: (progressEvent: any) => {
    onProgress(percentCompleted);
  }
} : undefined;

// Résultat : Content-Type: application/json
// ❌ Le backend ne peut pas parser le fichier !
```

### ✅ APRÈS (Fonctionne)

```typescript
// On force Content-Type à undefined
const config: any = {
  headers: {
    'Content-Type': undefined  // Le navigateur ajoutera le bon header
  }
};

if (onProgress) {
  config.onUploadProgress = (progressEvent: any) => {
    onProgress(percentCompleted);
  };
}

// Résultat : Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
// ✅ Le backend peut parser le fichier correctement !
```

## 🔍 Détails Techniques

### Ce que le navigateur envoie maintenant :

```http
POST /api/media/upload HTTP/1.1
Host: localhost:3001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXYZ123
Content-Length: 123456

------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

[binary data of the file]
------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="familyId"

1
------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="mediaType"

IMAGE
------WebKitFormBoundaryXYZ123--
```

### Points clés :

1. **`boundary=----WebKitFormBoundaryXYZ123`** : Généré automatiquement par le navigateur
2. **Chaque partie** est séparée par `------WebKitFormBoundaryXYZ123`
3. **Le fichier** est envoyé en données binaires
4. **Les métadonnées** (familyId, mediaType) sont envoyées en texte

## 🎯 Règle Générale

### Pour les requêtes JSON (normales)
```typescript
// ✅ Laisser le Content-Type par défaut
await api.post('/endpoint', { data: 'value' });
// Content-Type: application/json
```

### Pour les uploads de fichiers (FormData)
```typescript
// ✅ Supprimer explicitement le Content-Type
const formData = new FormData();
formData.append('file', file);

await api.post('/upload', formData, {
  headers: {
    'Content-Type': undefined  // Laisse le navigateur gérer
  }
});
// Content-Type: multipart/form-data; boundary=...
```

## ✅ Résultat

L'upload de fichiers fonctionne maintenant correctement :
- ✅ Le `Content-Type` est correctement défini avec le `boundary`
- ✅ Le backend peut parser les fichiers
- ✅ La progression est suivie en temps réel
- ✅ Les métadonnées sont correctement envoyées

## 🧪 Pour Tester

1. Ouvrez l'application
2. Allez dans Chat & Médias
3. Cliquez sur l'icône 📷
4. Sélectionnez un fichier
5. Observez la barre de progression
6. Le fichier devrait être uploadé avec succès !

## 📝 Note Importante

**Ne JAMAIS définir manuellement `Content-Type: multipart/form-data`** lors de l'envoi de FormData !

Le navigateur DOIT le faire automatiquement pour ajouter le bon `boundary`.

---

**Fix appliqué le : 28/01/2026**
**Fichier modifié : `src/services/media.service.ts`**
