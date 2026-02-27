
import { useState, useRef } from 'react';
import { authService } from '../../services/auth.service';
import { profileService } from '../../services/profile.service';

export default function RegisterPage({onSwitch}: {onSwitch: () => void}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    try {
      // Validation via le service
      if (!file.type.startsWith('image/')) {
        alert("Seules les images sont autorisées pour la photo de profil.");
        return;
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert("La photo de profil ne peut pas dépasser 5MB.");
        return;
      }
      
      setProfilePicture(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la sélection de la photo');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Tous les champs sont requis.');
      return;
    }

    setIsLoading(true);

    try {
      const profilePictureUrl = await profileService.generateProfilePictureUrl(name, profilePicture || undefined);

      await authService.register({
        name,
        email,
        password,
        profilePictureUrl,
      });

      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      setIsLoading(false);
      onSwitch();
    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      setErrorMessage('Erreur lors de l\'inscription. L\'email est peut-être déjà utilisé ou le serveur est indisponible.');
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container sign-up-container">
      <form onSubmit={handleRegister}>
        <h1>Créer un compte</h1>
        
        {/* Photo de profil */}
        <div className="profile-picture-section">
          <label>Photo de profil</label>
          <div className="profile-picture-upload">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleProfilePictureSelect}
              style={{ display: 'none' }}
            />
            <div 
              className="profile-picture-preview"
              onClick={() => fileInputRef.current?.click()}
            >
              {profilePicturePreview ? (
                <img src={profilePicturePreview} alt="Aperçu" />
              ) : (
                <div className="placeholder">
                  <span>📷</span>
                  <p>Cliquez pour ajouter une photo</p>
                </div>
              )}
            </div>
            {profilePicture && (
              <button 
                type="button" 
                className="remove-picture"
                onClick={() => {
                  setProfilePicture(null);
                  setProfilePicturePreview('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                ✕ Supprimer
              </button>
            )}
          </div>
          <small>Optionnel - Un avatar sera généré automatiquement si aucune photo n'est fournie</small>
        </div>

        <input 
          type="text" 
          placeholder="Nom complet *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          required
        />
        <input 
          type="email" 
          placeholder="Email *" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        <input 
          type="password" 
          placeholder="Mot de passe *" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />
        
        {errorMessage && (
          <p className="form-error" style={{ margin: '8px 0 0', fontSize: 13, color: '#c0392b' }}>
            {errorMessage}
          </p>
        )}
        <button type="submit" disabled={isLoading}>
            {isLoading ? <><span className="loader"></span> Inscription...</> : 'S\'inscrire'}
        </button>
        <button type="button" className="ghost mobile-only" onClick={onSwitch}>Se connecter</button>
      </form>
    </div>
  )
}
