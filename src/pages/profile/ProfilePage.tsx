import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, X } from 'lucide-react';
import { profileService, type UserProfile, type UpdateProfileRequest } from '../../services/profile.service';
import { authService } from '../../services/auth.service';
import { useToastContext } from '../../hooks/useToastContext';
import { Loader, ButtonLoader } from '../../components/Loader';
import './profile.scss';

export default function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  
  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      setDisplayName(data.displayName);
      setProfilePictureUrl(data.profilePictureUrl || '');
      setProfilePicturePreview(data.profilePictureUrl || '');
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast.error('Impossible de charger le profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith('image/')) {
      toast.warning('Seules les images sont autorisées');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.warning('La photo ne peut pas dépasser 5MB');
      return;
    }

    setProfilePictureFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePicturePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.warning('Le nom d\'affichage est requis');
      return;
    }

    // Validation du mot de passe
    if (showPasswordChange) {
      if (!currentPassword || !newPassword) {
        toast.warning('Veuillez remplir tous les champs du mot de passe');
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.warning('Les mots de passe ne correspondent pas');
        return;
      }

      if (newPassword.length < 6) {
        toast.warning('Le nouveau mot de passe doit contenir au moins 6 caractères');
        return;
      }
    }

    setSaving(true);

    try {
      let finalProfilePictureUrl = profilePictureUrl;

      // Upload de la nouvelle photo si sélectionnée
      if (profilePictureFile && profile) {
        try {
          finalProfilePictureUrl = await profileService.uploadProfilePicture(profilePictureFile, profile.id);
        } catch (error) {
          console.error('Erreur upload photo:', error);
          // Générer un avatar si l'upload échoue
          finalProfilePictureUrl = await profileService.generateProfilePictureUrl(displayName, profilePictureFile);
        }
      }

      const updateData: UpdateProfileRequest = {
        displayName: displayName.trim(),
        profilePictureUrl: finalProfilePictureUrl
      };

      if (showPasswordChange && currentPassword && newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const updatedProfile = await profileService.updateProfile(updateData);
      
      // Mettre à jour le localStorage directement
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          displayName: updatedProfile.displayName,
          profilePictureUrl: updatedProfile.profilePictureUrl
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setProfile(updatedProfile);
      setProfilePictureFile(null);
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast.success('Profil mis à jour avec succès !');
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error);
      const errorMsg = error.userMessage || 
        error.response?.data?.message || 
        'Erreur lors de la mise à jour du profil';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <Loader size="large" text="Chargement du profil..." fullScreen />;
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <p>Impossible de charger le profil</p>
        <button onClick={() => navigate('/dashboard')}>Retour au dashboard</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Retour
        </button>
        <h1>Mon Profil</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          {/* Photo de profil */}
          <div className="profile-picture-section">
            <div className="profile-picture-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureSelect}
                style={{ display: 'none' }}
              />
              <div
                className="profile-picture-large"
                onClick={() => fileInputRef.current?.click()}
              >
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Photo de profil" />
                ) : (
                  <div className="placeholder">
                    <Camera size={48} />
                    <p>Cliquez pour ajouter une photo</p>
                  </div>
                )}
                <div className="overlay">
                  <Camera size={32} />
                </div>
              </div>
              {profilePictureFile && (
                <button
                  className="remove-picture-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfilePictureFile(null);
                    setProfilePicturePreview(profile.profilePictureUrl || '');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X size={16} /> Annuler
                </button>
              )}
            </div>
          </div>

          {/* Informations du profil */}
          <div className="profile-form">
            <div className="form-group">
              <label>Nom d'affichage</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="disabled-input"
              />
              <small>L'email ne peut pas être modifié</small>
            </div>

            <div className="form-group">
              <label>Membre depuis</label>
              <input
                type="text"
                value={new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                disabled
                className="disabled-input"
              />
            </div>

            {profile.isSuperAdmin && (
              <div className="admin-badge">
                <span>🛡️ Super Administrateur</span>
              </div>
            )}

            {/* Changement de mot de passe */}
            <div className="password-section">
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
              >
                {showPasswordChange ? 'Annuler le changement de mot de passe' : 'Changer le mot de passe'}
              </button>

              {showPasswordChange && (
                <div className="password-fields">
                  <div className="form-group">
                    <label>Mot de passe actuel</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Mot de passe actuel"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nouveau mot de passe (min. 6 caractères)"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmer le mot de passe"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bouton de sauvegarde */}
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <ButtonLoader />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
