# 🧪 Guide de Test - Upload de Médias

## ✅ Correction Appliquée

Le problème du `Content-Type` a été corrigé. Le navigateur définit maintenant automatiquement :
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

## 🎯 Comment Tester

### Étape 1 : Ouvrir l'Application
```
L'application tourne déjà avec : npm run dev
Ouvrez votre navigateur à : http://localhost:5173 (ou le port affiché)
```

### Étape 2 : Aller dans Chat & Médias
```
1. Connectez-vous à votre compte
2. Sélectionnez votre famille
3. Cliquez sur l'onglet "Chat & Médias"
```

### Étape 3 : Tester l'Upload
```
1. Cliquez sur l'icône 📷 en bas à gauche
2. Sélectionnez un fichier (image, vidéo ou document)
3. Observez la barre de progression
4. Vérifiez que le fichier apparaît dans les pièces jointes
```

## 🔍 Vérifications à Faire

### ✅ Checklist de Test

- [ ] **Le sélecteur de fichiers s'ouvre** quand on clique sur 📷
- [ ] **La barre de progression s'affiche** pendant l'upload
- [ ] **Le pourcentage augmente** de 0% à 100%
- [ ] **Le fichier apparaît** dans les pièces jointes
- [ ] **Pas d'erreur** dans la console du navigateur
- [ ] **Le bouton se réactive** après l'upload

### 🧪 Tests Spécifiques

#### Test 1 : Upload d'une Image
```
Fichier : photo.jpg (< 5MB)
Type détecté : IMAGE
Résultat attendu : ✅ Upload réussi
```

#### Test 2 : Upload d'une Vidéo
```
Fichier : video.mp4 (< 20MB)
Type détecté : VIDEO
Résultat attendu : ✅ Upload réussi
```

#### Test 3 : Upload d'un Document
```
Fichier : document.pdf (< 5MB)
Type détecté : FILE
Résultat attendu : ✅ Upload réussi
```

#### Test 4 : Fichier Trop Volumineux
```
Fichier : gros-fichier.zip (> 50MB)
Résultat attendu : ❌ Message d'erreur "Fichier trop volumineux"
```

## 🔧 Débogage

### Si l'upload ne fonctionne pas :

#### 1. Vérifier la Console du Navigateur
```
Ouvrez les DevTools (F12)
Allez dans l'onglet "Console"
Cherchez les erreurs en rouge
```

#### 2. Vérifier la Requête Réseau
```
Ouvrez les DevTools (F12)
Allez dans l'onglet "Network" (Réseau)
Uploadez un fichier
Cliquez sur la requête "upload"
Vérifiez :
  - Headers → Content-Type doit être : multipart/form-data; boundary=...
  - Request Payload → Doit contenir le fichier
  - Response → Doit retourner les données du média
```

#### 3. Vérifier le Backend
```
Le backend doit être démarré sur : http://localhost:3001
Vérifiez les logs du backend pour voir si la requête arrive
```

## 📊 Exemple de Requête Correcte

### Headers
```http
POST /api/media/upload HTTP/1.1
Host: localhost:3001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXYZ123
Content-Length: 123456
```

### Payload
```
------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="familyId"

1
------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="mediaType"

IMAGE
------WebKitFormBoundaryXYZ123--
```

### Response Attendue
```json
{
  "id": 123,
  "urlPath": "/uploads/photo-123456.jpg",
  "mediaType": "IMAGE",
  "createdAt": "2026-01-28T12:15:00.000Z",
  "uploader": {
    "id": 1,
    "displayName": "John Doe",
    "email": "john@example.com"
  }
}
```

## ❌ Erreurs Possibles

### Erreur 1 : "Content-Type incorrect"
```
Cause : Le Content-Type est défini manuellement
Solution : ✅ Déjà corrigé dans media.service.ts
```

### Erreur 2 : "Fichier trop volumineux"
```
Cause : Le fichier dépasse 50MB
Solution : Choisir un fichier plus petit
```

### Erreur 3 : "Unauthorized"
```
Cause : Token JWT manquant ou expiré
Solution : Se reconnecter
```

### Erreur 4 : "Network Error"
```
Cause : Backend non démarré
Solution : Démarrer le backend
```

## 🎯 Résultat Attendu

Après un upload réussi :

1. **Barre de progression** : 0% → 100%
2. **Pièce jointe** : Apparaît dans la liste
3. **Miniature** : S'affiche (pour les images)
4. **Bouton** : Se réactive
5. **Console** : Pas d'erreur
6. **Message** : Peut être envoyé avec le fichier attaché

## 📝 Notes

- **Formats supportés** : Images, vidéos, documents
- **Taille max** : 50 MB par fichier
- **Détection automatique** : Le type est détecté selon l'extension
- **Progression** : Affichée en temps réel

---

**Si tout fonctionne, vous devriez voir :**
```
✅ Sélecteur de fichiers s'ouvre
✅ Barre de progression s'affiche
✅ Upload se termine avec succès
✅ Fichier apparaît dans les pièces jointes
✅ Pas d'erreur dans la console
```

**Bon test ! 🚀**
