// ═══════════════════════════════════════════════════════════════════
// 🎯 RÉSUMÉ DES CHANGEMENTS - UPLOAD DE MÉDIAS
// ═══════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────
// 1️⃣ SERVICE MÉDIA (media.service.ts)
// ───────────────────────────────────────────────────────────────────

/**
 * Fonction de détection automatique du type de média
 * Analyse l'extension du fichier et retourne le type approprié
 */
function detectMediaType(filename: string): 'IMAGE' | 'VIDEO' | 'FILE' {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'heic', 'heif'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp', 'mpeg', 'mpg'];
  
  if (imageExtensions.includes(ext)) return 'IMAGE';
  if (videoExtensions.includes(ext)) return 'VIDEO';
  return 'FILE';
}

/**
 * Fonction d'upload de fichier
 * Gère l'upload avec FormData, progression, et détection automatique
 */
async uploadFile(
  file: File,                              // Le fichier à uploader
  familyId: number,                        // ID de la famille
  personId?: number,                       // ID de la personne (optionnel)
  onProgress?: (progress: number) => void  // Callback de progression
): Promise<MediaItem> {
  
  // 1. Détection automatique du type
  const mediaType = detectMediaType(file.name);
  
  // 2. Création du FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('familyId', familyId.toString());
  formData.append('mediaType', mediaType);
  if (personId) formData.append('personId', personId.toString());
  
  // 3. Configuration avec suivi de progression
  const config = onProgress ? {
    onUploadProgress: (progressEvent: any) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    }
  } : undefined;
  
  // 4. Envoi au serveur
  const response = await api.post<MediaItem>('/media/upload', formData, config);
  return response.data;
}

// ───────────────────────────────────────────────────────────────────
// 2️⃣ COMPOSANT DASHBOARD (page.tsx)
// ───────────────────────────────────────────────────────────────────

// État pour gérer l'upload
const [uploadProgress, setUploadProgress] = useState<number>(0);
const [isUploading, setIsUploading] = useState(false);
const fileInputRef = React.useRef<HTMLInputElement>(null);

/**
 * Gestionnaire de sélection de fichier
 * Appelé quand l'utilisateur sélectionne un fichier
 */
const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || files.length === 0 || !currentFamily) return;
  
  const file = files[0];
  
  // Validation de la taille (50MB max)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("Le fichier est trop volumineux. Taille maximale : 50MB");
    return;
  }
  
  try {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Upload avec callback de progression
    const newMedia = await mediaService.uploadFile(
      file,
      currentFamily.familyId,
      undefined,
      (progress) => setUploadProgress(progress)  // Mise à jour en temps réel
    );
    
    // Ajout aux pièces jointes
    setPendingAttachments([...pendingAttachments, newMedia]);
    
    // Rafraîchissement de la liste
    await loadMedia(currentFamily.familyId);
    
  } catch (err) {
    console.error("Failed to upload file", err);
    alert("Erreur lors de l'upload du fichier. Vérifiez votre connexion.");
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
    // Reset de l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};

// ───────────────────────────────────────────────────────────────────
// 3️⃣ INTERFACE UTILISATEUR (JSX)
// ───────────────────────────────────────────────────────────────────

// Input file caché (déclenché par le bouton)
<input 
  ref={fileInputRef}
  type="file" 
  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
  onChange={handleFileSelect}
  style={{ display: 'none' }}
/>

// Barre de progression (affichée pendant l'upload)
{isUploading && (
  <div className="upload-progress">
    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
      <span style={{fontSize: '0.85rem', color: '#666'}}>Upload en cours...</span>
      <span style={{fontSize: '0.85rem', fontWeight: 'bold', color: '#326C58'}}>
        {uploadProgress}%
      </span>
    </div>
    <div style={{
      width: '100%',
      height: '6px',
      background: '#ddd',
      borderRadius: '3px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${uploadProgress}%`,
        height: '100%',
        background: 'linear-gradient(90deg, #326C58, #4A9B7F)',
        transition: 'width 0.3s ease'
      }} />
    </div>
  </div>
)}

// Bouton d'attachement
<button 
  type="button" 
  className="attach-btn" 
  onClick={() => fileInputRef.current?.click()}  // Ouvre le sélecteur
  disabled={isUploading}                         // Désactivé pendant upload
  title="Joindre un fichier"
  style={{
    opacity: isUploading ? 0.5 : 1,
    cursor: isUploading ? 'not-allowed' : 'pointer'
  }}
>
  <Image size={20}/>
</button>

// ───────────────────────────────────────────────────────────────────
// 4️⃣ STYLES SCSS (dashboard.scss)
// ───────────────────────────────────────────────────────────────────

.upload-progress {
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  animation: slideDown 0.3s ease-out;
  
  // Animation d'apparition
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #326C58 0%, #4A9B7F 50%, #5DB89E 100%);
    border-radius: 4px;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    // Effet shimmer animé
    &::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// 📊 EXEMPLES D'UTILISATION
// ═══════════════════════════════════════════════════════════════════

// Exemple 1 : Upload d'une image
// ────────────────────────────────
// Fichier sélectionné : "photo-famille.jpg"
// Détection automatique : IMAGE
// Progression : 0% → 25% → 50% → 75% → 100%
// Résultat : Ajouté aux pièces jointes

// Exemple 2 : Upload d'une vidéo
// ────────────────────────────────
// Fichier sélectionné : "anniversaire.mp4"
// Détection automatique : VIDEO
// Progression : 0% → 15% → 30% → ... → 100%
// Résultat : Ajouté aux pièces jointes

// Exemple 3 : Upload d'un document
// ────────────────────────────────
// Fichier sélectionné : "acte-naissance.pdf"
// Détection automatique : FILE
// Progression : 0% → 100%
// Résultat : Ajouté aux pièces jointes

// Exemple 4 : Fichier trop volumineux
// ────────────────────────────────────
// Fichier sélectionné : "video-4k.mp4" (80MB)
// Validation : ÉCHEC
// Message : "Le fichier est trop volumineux. Taille maximale : 50MB"

// ═══════════════════════════════════════════════════════════════════
// 🎯 FLUX COMPLET
// ═══════════════════════════════════════════════════════════════════

/*
1. Utilisateur clique sur 📷
   └─> fileInputRef.current?.click()
   
2. Sélecteur de fichiers s'ouvre
   └─> Interface native du système d'exploitation
   
3. Utilisateur sélectionne un fichier
   └─> handleFileSelect() est appelé
   
4. Validation de la taille
   └─> Si > 50MB : Alert et arrêt
   └─> Si ≤ 50MB : Continue
   
5. Détection du type
   └─> detectMediaType(file.name)
   └─> Retourne : IMAGE | VIDEO | FILE
   
6. Upload avec progression
   └─> setIsUploading(true)
   └─> setUploadProgress(0)
   └─> mediaService.uploadFile(...)
   └─> Callback : setUploadProgress(%) à chaque chunk
   
7. Succès
   └─> Ajout aux pendingAttachments
   └─> Rafraîchissement de la liste des médias
   └─> setIsUploading(false)
   └─> Reset de l'input
   
8. L'utilisateur peut envoyer le message
   └─> Le fichier est attaché au message
*/

// ═══════════════════════════════════════════════════════════════════
// ✅ CHECKLIST DE VÉRIFICATION
// ═══════════════════════════════════════════════════════════════════

// ✓ Détection automatique du type de média
// ✓ Sélecteur de fichiers natif
// ✓ Validation de taille (50MB)
// ✓ Barre de progression en temps réel
// ✓ Gestion des erreurs
// ✓ Désactivation du bouton pendant l'upload
// ✓ Animations fluides
// ✓ Reset automatique après upload
// ✓ Rafraîchissement de la liste des médias
// ✓ Design professionnel et moderne
