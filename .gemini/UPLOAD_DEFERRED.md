# 🔄 Amélioration : Upload Différé des Médias

## 🎯 Changement Effectué

**AVANT** : Les fichiers étaient uploadés **immédiatement** lors de la sélection
**MAINTENANT** : Les fichiers sont uploadés **seulement lors de l'envoi** du message

---

## ❌ Problème avec l'Ancien Système

### Flux Précédent :
```
1. Utilisateur clique sur 📷
2. Sélectionne un fichier
3. ⚡ UPLOAD IMMÉDIAT vers le serveur
4. Fichier stocké dans pendingAttachments
5. Utilisateur écrit son message
6. Utilisateur clique sur Envoyer
7. Message envoyé avec les IDs des médias déjà uploadés
```

### Problèmes :
- ❌ Upload inutile si l'utilisateur annule
- ❌ Fichiers uploadés même si le message n'est jamais envoyé
- ❌ Gaspillage de bande passante
- ❌ Fichiers orphelins sur le serveur
- ❌ Pas de possibilité d'annuler l'upload

---

## ✅ Nouveau Système

### Flux Amélioré :
```
1. Utilisateur clique sur 📷
2. Sélectionne un fichier
3. 📦 STOCKAGE LOCAL du fichier (File object)
4. Prévisualisation affichée (URL.createObjectURL)
5. Utilisateur écrit son message
6. Utilisateur clique sur Envoyer
7. ⚡ UPLOAD des fichiers vers le serveur
8. Message envoyé avec les IDs des médias uploadés
```

### Avantages :
- ✅ Upload seulement si le message est envoyé
- ✅ Possibilité de retirer des fichiers avant envoi
- ✅ Pas de fichiers orphelins
- ✅ Économie de bande passante
- ✅ Meilleure expérience utilisateur

---

## 🔧 Modifications Techniques

### 1. **Changement d'État**

#### Avant :
```typescript
const [pendingAttachments, setPendingAttachments] = useState<MediaItem[]>([]);
// Stockait les médias déjà uploadés
```

#### Après :
```typescript
const [pendingFiles, setPendingFiles] = useState<File[]>([]);
// Stocke les fichiers locaux (pas encore uploadés)
```

---

### 2. **Fonction handleFileSelect**

#### Avant (Upload Immédiat) :
```typescript
const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || files.length === 0 || !currentFamily) return;
  
  const file = files[0];
  
  // Validation
  if (file.size > maxSize) {
    alert("Fichier trop volumineux");
    return;
  }
  
  try {
    setIsUploading(true);
    
    // ⚡ UPLOAD IMMÉDIAT
    const newMedia = await mediaService.uploadFile(
      file,
      currentFamily.familyId,
      undefined,
      (progress) => setUploadProgress(progress)
    );
    
    setPendingAttachments([...pendingAttachments, newMedia]);
    await loadMedia(currentFamily.familyId);
    
  } catch (err) {
    alert("Erreur lors de l'upload");
  } finally {
    setIsUploading(false);
  }
};
```

#### Après (Stockage Local) :
```typescript
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  const file = files[0];
  
  // Validation
  if (file.size > maxSize) {
    alert("Fichier trop volumineux");
    return;
  }
  
  // 📦 STOCKAGE LOCAL (pas d'upload)
  setPendingFiles([...pendingFiles, file]);
  
  // Reset input
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

---

### 3. **Fonction handleSendMessage**

#### Avant (Médias Déjà Uploadés) :
```typescript
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if ((!newMessage.trim() && pendingAttachments.length === 0) || !activeRoomId) return;
  
  // Les médias sont déjà uploadés, on récupère juste les IDs
  const attachmentIds = pendingAttachments.map(m => m.id);
  
  // Envoi du message
  await chatService.sendMessage({ 
    chatRoomId: activeRoomId, 
    content: newMessage,
    attachmentIds
  });
  
  setNewMessage('');
  setPendingAttachments([]);
};
```

#### Après (Upload Lors de l'Envoi) :
```typescript
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if ((!newMessage.trim() && pendingFiles.length === 0) || !activeRoomId || !currentFamily) return;
  
  try {
    setIsUploading(true);
    
    // 1. ⚡ UPLOAD DES FICHIERS
    const uploadedMedia: MediaItem[] = [];
    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      const media = await mediaService.uploadFile(
        file,
        currentFamily.familyId,
        undefined,
        (progress) => {
          // Progression globale
          const globalProgress = Math.round(((i * 100) + progress) / pendingFiles.length);
          setUploadProgress(globalProgress);
        }
      );
      uploadedMedia.push(media);
    }
    
    const attachmentIds = uploadedMedia.map(m => m.id);
    
    // 2. Optimistic Update
    const tempMsg: Message = {
      id: Date.now(),
      content: newMessage,
      sentAt: new Date().toISOString(),
      sender: { 
        id: user?.id || 0, 
        displayName: user?.displayName || user?.email || 'Moi', 
        email: user?.email || '' 
      },
      attachments: uploadedMedia
    };
    setMessages([...messages, tempMsg]);
    setNewMessage('');
    setPendingFiles([]);
    
    // 3. Envoi du message au serveur
    await chatService.sendMessage({ 
      chatRoomId: activeRoomId, 
      content: newMessage,
      attachmentIds
    });
    
    // 4. Rafraîchir la liste des médias
    await loadMedia(currentFamily.familyId);
    
  } catch (err) {
    console.error("Failed to send message", err);
    alert("Erreur lors de l'envoi du message");
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};
```

---

### 4. **Prévisualisation avec URL.createObjectURL**

```typescript
{pendingFiles.map((file, index) => {
  // Créer une URL temporaire pour la prévisualisation
  const previewUrl = URL.createObjectURL(file);
  const isImage = file.type.startsWith('image/');
  
  return (
    <div key={index} className="att-item">
      {isImage ? (
        <img 
          src={previewUrl} 
          alt={file.name} 
          onLoad={() => URL.revokeObjectURL(previewUrl)}  // Libérer la mémoire
        />
      ) : (
        <div className="file-icon">
          {file.type.startsWith('video/') ? 'VIDEO' : 'FILE'}
        </div>
      )}
      <button 
        className="remove-btn"
        onClick={() => setPendingFiles(pendingFiles.filter((_, i) => i !== index))}
      >x</button>
    </div>
  );
})}
```

**Points clés** :
- `URL.createObjectURL(file)` : Crée une URL temporaire pour le fichier local
- `onLoad={() => URL.revokeObjectURL(previewUrl)}` : Libère la mémoire après chargement
- `file.type.startsWith('image/')` : Détecte si c'est une image
- Possibilité de retirer des fichiers avant envoi

---

## 📊 Comparaison

| Aspect | Avant | Après |
|--------|-------|-------|
| **Moment de l'upload** | Immédiat (sélection) | Différé (envoi) |
| **Annulation possible** | ❌ Non | ✅ Oui |
| **Fichiers orphelins** | ✅ Possible | ❌ Impossible |
| **Bande passante** | ❌ Gaspillée si annulation | ✅ Optimisée |
| **Prévisualisation** | URL serveur | URL locale (Blob) |
| **Progression** | Par fichier | Globale (tous fichiers) |

---

## 🎯 Flux Utilisateur

### Scénario 1 : Envoi Normal
```
1. Clic sur 📷
2. Sélection de "photo.jpg"
3. ✅ Prévisualisation s'affiche (local)
4. Écriture du message : "Regardez cette photo !"
5. Clic sur Envoyer ➤
6. 📤 Upload de "photo.jpg" (barre de progression)
7. 📨 Envoi du message avec la photo
8. ✅ Message affiché avec la photo
```

### Scénario 2 : Annulation
```
1. Clic sur 📷
2. Sélection de "video.mp4"
3. ✅ Prévisualisation s'affiche (local)
4. Changement d'avis
5. Clic sur "x" pour retirer
6. ✅ Fichier retiré (pas d'upload)
7. Aucun fichier orphelin sur le serveur
```

### Scénario 3 : Plusieurs Fichiers
```
1. Clic sur 📷 → Sélection de "photo1.jpg"
2. Clic sur 📷 → Sélection de "photo2.jpg"
3. Clic sur 📷 → Sélection de "document.pdf"
4. ✅ 3 prévisualisations affichées
5. Retrait de "photo2.jpg" (clic sur x)
6. Écriture du message
7. Clic sur Envoyer ➤
8. 📤 Upload de "photo1.jpg" (0-50%)
9. 📤 Upload de "document.pdf" (50-100%)
10. 📨 Envoi du message
11. ✅ Message affiché avec 2 pièces jointes
```

---

## ✅ Avantages Finaux

1. **Performance** : Pas d'upload inutile
2. **Flexibilité** : Possibilité de retirer des fichiers
3. **Économie** : Bande passante optimisée
4. **Propreté** : Pas de fichiers orphelins
5. **UX** : Meilleure expérience utilisateur
6. **Progression** : Barre de progression globale pour plusieurs fichiers

---

**Modification appliquée le : 28/01/2026**
**Fichier modifié : `src/pages/dashboard/page.tsx`**
