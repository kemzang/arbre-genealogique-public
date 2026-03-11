import React, { memo, useState, useEffect, useRef } from 'react';
import { X, Edit2, Save, Upload } from 'lucide-react';
import { treeService, type PersonDetails, type Person } from '../../services/tree.service';
import { mediaService } from '../../services/media.service';

interface PersonDetailModalProps {
  personId: number | null;
  familyId: number;
  onClose: () => void;
  onUpdate: () => void;
  onViewRelationship?: (relationshipId: number) => void;
}

export const PersonDetailModal = memo(({
  personId,
  familyId,
  onClose,
  onUpdate,
  onViewRelationship
}: PersonDetailModalProps) => {
  const [details, setDetails] = useState<PersonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Person>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (personId) {
      loadPersonDetails();
    }
  }, [personId]);

  // Nettoyer l'URL de prévisualisation lors du démontage
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadPersonDetails = async () => {
    if (!personId) return;
    setIsLoading(true);
    try {
      const data = await treeService.getPersonDetails(personId);
      setDetails(data);
      setEditForm({
        firstName: data.person.firstName,
        lastName: data.person.lastName,
        birthDate: data.person.birthDate ? data.person.birthDate.split('T')[0] : '',
        deathDate: data.person.deathDate ? data.person.deathDate.split('T')[0] : '',
        gender: data.person.gender,
        bio: data.person.bio || '',
        profilePictureUrl: data.person.profilePictureUrl || ''
      });
    } catch (err) {
      console.error('Error loading person details:', err);
      alert('Erreur lors du chargement des détails');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (JPG, PNG, etc.)');
      return;
    }

    // Vérifier la taille (max 10MB pour les images de profil)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('L\'image est trop volumineuse. Taille maximale : 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Créer une URL de prévisualisation
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!personId) return;
    setIsSaving(true);
    
    try {
      let profilePictureUrl = editForm.profilePictureUrl;

      // Si un fichier a été sélectionné, l'uploader d'abord
      if (selectedFile) {
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
          const uploadedMedia = await mediaService.uploadFile(
            selectedFile,
            familyId,
            personId,
            undefined,
            (progress) => setUploadProgress(progress)
          );
          
          profilePictureUrl = uploadedMedia.urlPath;
          
          // Nettoyer l'URL de prévisualisation
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }
          setSelectedFile(null);
          setPreviewUrl(null);
        } catch (uploadErr) {
          console.error('Error uploading file:', uploadErr);
          alert('Erreur lors de l\'upload de l\'image');
          setIsUploading(false);
          setIsSaving(false);
          return;
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }

      // Mettre à jour la personne avec la nouvelle URL de photo
      await treeService.updatePerson(personId, {
        ...editForm,
        profilePictureUrl
      });
      
      setIsEditing(false);
      await loadPersonDetails();
      onUpdate();
      alert('Personne mise à jour avec succès !');
    } catch (err) {
      console.error('Error updating person:', err);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  if (!personId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} title="Fermer" aria-label="Fermer la fenêtre">
          <X size={24} />
        </button>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Chargement...</p>
          </div>
        ) : !details ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Erreur lors du chargement</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Détails de {details.person.firstName} {details.person.lastName}</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#326C58',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit2 size={16} />
                  Modifier
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="edit-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label>Prénom *</label>
                    <input
                      type="text"
                      value={editForm.firstName || ''}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      placeholder="Prénom"
                      aria-label="Prénom"
                      required
                    />
                  </div>
                  <div>
                    <label>Nom *</label>
                    <input
                      type="text"
                      value={editForm.lastName || ''}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      placeholder="Nom"
                      aria-label="Nom"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label>Date de naissance</label>
                    <input
                      type="date"
                      value={editForm.birthDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                      placeholder="Date de naissance"
                      aria-label="Date de naissance"
                    />
                  </div>
                  <div>
                    <label>Date de décès</label>
                    <input
                      type="date"
                      value={editForm.deathDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, deathDate: e.target.value })}
                      placeholder="Date de décès"
                      aria-label="Date de décès"
                    />
                  </div>
                  <div>
                    <label>Genre</label>
                    <select
                      value={editForm.gender || 'M'}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as 'M' | 'F' | 'O' })}
                      title="Sélectionner le genre"
                      aria-label="Sélectionner le genre"
                    >
                      <option value="M">Homme</option>
                      <option value="F">Femme</option>
                      <option value="O">Autre</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label>Biographie</label>
                  <textarea
                    value={editForm.bio || ''}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    placeholder="Biographie de la personne..."
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label>Photo de profil</label>
                  
                  {/* Aperçu de l'image actuelle ou sélectionnée */}
                  {(previewUrl || editForm.profilePictureUrl) && (
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                      <img
                        src={previewUrl || editForm.profilePictureUrl || ''}
                        alt="Aperçu"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '8px',
                          border: '2px solid #ddd',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {previewUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          style={{
                            marginTop: '0.5rem',
                            padding: '4px 12px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  )}

                  {/* Input file caché */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="profile-picture-input"
                  />

                  {/* Bouton pour sélectionner un fichier */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label
                      htmlFor="profile-picture-input"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: '#326C58',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      <Upload size={16} />
                      {selectedFile ? 'Changer la photo' : 'Sélectionner une photo'}
                    </label>
                  </div>

                  {/* Barre de progression de l'upload */}
                  {isUploading && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#e9ecef',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${uploadProgress}%`,
                          height: '100%',
                          background: '#28a745',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', textAlign: 'center' }}>
                        Upload en cours... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {editForm.profilePictureUrl && !previewUrl && (
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                      URL actuelle : {editForm.profilePictureUrl}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      loadPersonDetails();
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !editForm.firstName || !editForm.lastName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: isSaving ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isSaving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Save size={16} />
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Informations de base */}
                <div className="detail-section">
                  <h3>Informations personnelles</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <strong>Prénom :</strong> {details.person.firstName}
                    </div>
                    <div>
                      <strong>Nom :</strong> {details.person.lastName}
                    </div>
                    {details.person.birthDate && (
                      <div>
                        <strong>Date de naissance :</strong> {new Date(details.person.birthDate).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    {details.person.deathDate && (
                      <div>
                        <strong>Date de décès :</strong> {new Date(details.person.deathDate).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    <div>
                      <strong>Genre :</strong> {details.person.gender === 'M' ? 'Homme' : details.person.gender === 'F' ? 'Femme' : 'Autre'}
                    </div>
                  </div>
                  {details.person.bio && (
                    <div style={{ marginTop: '1rem' }}>
                      <strong>Biographie :</strong>
                      <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>{details.person.bio}</p>
                    </div>
                  )}
                </div>

                {/* Parents */}
                {details.parents.length > 0 && (
                  <div className="detail-section">
                    <h3>Parents</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {details.parents.map((parent) => (
                        <div 
                          key={parent.id} 
                          style={{ 
                            padding: '0.75rem', 
                            background: '#f8f9fa', 
                            borderRadius: '6px',
                            cursor: parent.relationshipInfo ? 'pointer' : 'default',
                            border: parent.relationshipInfo ? '2px solid #326C58' : '1px solid #ddd',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            if (parent.relationshipInfo && onViewRelationship) {
                              onViewRelationship(parent.relationshipInfo.id);
                            }
                          }}
                          title={parent.relationshipInfo ? "Cliquer pour voir/modifier la relation" : undefined}
                          onMouseEnter={(e) => {
                            if (parent.relationshipInfo) {
                              e.currentTarget.style.background = '#e8f5e9';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (parent.relationshipInfo) {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          <strong>{parent.firstName} {parent.lastName}</strong>
                          {parent.relationshipInfo && (
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                              {parent.relationshipInfo.isBiological ? 'Biologique' : 'Adoptif'}
                              {parent.relationshipInfo.status === 'ENDED' && ' (Terminé)'}
                              <div style={{ fontSize: '0.75rem', color: '#326C58', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                👆 Cliquer pour modifier
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enfants */}
                {details.children.length > 0 && (
                  <div className="detail-section">
                    <h3>Enfants</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {details.children.map((child) => (
                        <div 
                          key={child.id} 
                          style={{ 
                            padding: '0.75rem', 
                            background: '#f8f9fa', 
                            borderRadius: '6px',
                            cursor: child.relationshipInfo ? 'pointer' : 'default',
                            border: child.relationshipInfo ? '2px solid #326C58' : '1px solid #ddd',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            if (child.relationshipInfo && onViewRelationship) {
                              onViewRelationship(child.relationshipInfo.id);
                            }
                          }}
                          title={child.relationshipInfo ? "Cliquer pour voir/modifier la relation" : undefined}
                          onMouseEnter={(e) => {
                            if (child.relationshipInfo) {
                              e.currentTarget.style.background = '#e8f5e9';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (child.relationshipInfo) {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          <strong>{child.firstName} {child.lastName}</strong>
                          {child.relationshipInfo && (
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                              {child.relationshipInfo.isBiological ? 'Biologique' : 'Adoptif'}
                              <div style={{ fontSize: '0.75rem', color: '#326C58', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                👆 Cliquer pour modifier
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conjoints actuels */}
                {details.currentSpouses.length > 0 && (
                  <div className="detail-section">
                    <h3>Conjoint(s) actuel(s)</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {details.currentSpouses.map((spouse) => (
                        <div 
                          key={spouse.id} 
                          style={{ 
                            padding: '0.75rem', 
                            background: '#e8f5e9', 
                            borderRadius: '6px',
                            cursor: spouse.relationshipInfo ? 'pointer' : 'default',
                            border: spouse.relationshipInfo ? '2px solid #28a745' : '1px solid #c3e6c3',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            if (spouse.relationshipInfo && onViewRelationship) {
                              onViewRelationship(spouse.relationshipInfo.id);
                            }
                          }}
                          title={spouse.relationshipInfo ? "Cliquer pour voir/modifier la relation" : undefined}
                          onMouseEnter={(e) => {
                            if (spouse.relationshipInfo) {
                              e.currentTarget.style.background = '#d4edda';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (spouse.relationshipInfo) {
                              e.currentTarget.style.background = '#e8f5e9';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          <strong>{spouse.firstName} {spouse.lastName}</strong>
                          {spouse.relationshipInfo?.startDate && (
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                              Depuis {new Date(spouse.relationshipInfo.startDate).toLocaleDateString('fr-FR')}
                              <div style={{ fontSize: '0.75rem', color: '#28a745', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                👆 Cliquer pour modifier
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anciens conjoints */}
                {details.formerSpouses.length > 0 && (
                  <div className="detail-section">
                    <h3>Ancien(s) conjoint(s)</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {details.formerSpouses.map((spouse) => (
                        <div key={spouse.id} style={{ padding: '0.75rem', background: '#fff3cd', borderRadius: '6px' }}>
                          <strong>{spouse.firstName} {spouse.lastName}</strong>
                          {spouse.relationshipInfo && (
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                              {spouse.relationshipInfo.startDate && (
                                <>De {new Date(spouse.relationshipInfo.startDate).toLocaleDateString('fr-FR')}</>
                              )}
                              {spouse.relationshipInfo.endDate && (
                                <> à {new Date(spouse.relationshipInfo.endDate).toLocaleDateString('fr-FR')}</>
                              )}
                              {spouse.relationshipInfo.endReason && (
                                <div style={{ marginTop: '0.25rem', color: '#856404' }}>
                                  Raison : {spouse.relationshipInfo.endReason}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Frères et sœurs */}
                {details.siblings.length > 0 && (
                  <div className="detail-section">
                    <h3>Frères et sœurs</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {details.siblings.map((sibling) => (
                        <div key={sibling.id} style={{ padding: '0.75rem', background: '#f8f9fa', borderRadius: '6px' }}>
                          <strong>{sibling.firstName} {sibling.lastName}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistiques */}
                {details.relationshipHistory && (
                  <div className="detail-section">
                    <h3>Statistiques relationnelles</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div>
                        <strong>Mariages totaux :</strong> {details.relationshipHistory.totalMarriages}
                      </div>
                      <div>
                        <strong>Mariages actuels :</strong> {details.relationshipHistory.currentMarriages}
                      </div>
                      <div>
                        <strong>Divorces :</strong> {details.relationshipHistory.divorces}
                      </div>
                      <div>
                        <strong>Veuvages :</strong> {details.relationshipHistory.widowed}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
});
