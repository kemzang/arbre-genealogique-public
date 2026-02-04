import { memo, useState, useEffect } from 'react';
import { X, Edit2, Save, XCircle, Trash2 } from 'lucide-react';
import { treeService, type RelationshipDetails, type EndRelationshipRequest } from '../../services/tree.service';

interface RelationshipDetailModalProps {
  relationshipId: number | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const RelationshipDetailModal = memo(({
  relationshipId,
  onClose,
  onUpdate
}: RelationshipDetailModalProps) => {
  const [details, setDetails] = useState<RelationshipDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [editForm, setEditForm] = useState<{
    type?: 'PARENTAL' | 'UNION' | 'SIBLING';
    isBiological?: boolean;
  }>({});
  const [endForm, setEndForm] = useState<EndRelationshipRequest>({
    endReason: '',
    endDate: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (relationshipId) {
      loadRelationshipDetails();
    }
  }, [relationshipId]);

  const loadRelationshipDetails = async () => {
    if (!relationshipId) return;
    setIsLoading(true);
    try {
      const data = await treeService.getRelationshipDetails(relationshipId);
      setDetails(data);
      setEditForm({
        type: data.relationship.type,
        isBiological: data.relationship.isBiological
      });
    } catch (err) {
      console.error('Error loading relationship details:', err);
      alert('Erreur lors du chargement des détails');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!relationshipId) return;
    setIsSaving(true);
    try {
      await treeService.updateRelationship(relationshipId, editForm);
      setIsEditing(false);
      await loadRelationshipDetails();
      onUpdate();
      alert('Relation mise à jour avec succès !');
    } catch (err) {
      console.error('Error updating relationship:', err);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndRelationship = async () => {
    if (!relationshipId || !endForm.endReason.trim()) {
      alert('Veuillez indiquer la raison de la fin de la relation');
      return;
    }
    setIsSaving(true);
    try {
      const result = await treeService.endRelationship(relationshipId, {
        endReason: endForm.endReason,
        endDate: endForm.endDate || undefined,
        notes: endForm.notes || undefined
      });
      
      if (result.warning) {
        alert(`⚠️ ${result.warning}`);
      }
      
      setShowEndModal(false);
      setEndForm({ endReason: '', endDate: '', notes: '' });
      await loadRelationshipDetails();
      onUpdate();
      alert('Relation terminée avec succès');
    } catch (err) {
      console.error('Error ending relationship:', err);
      alert('Erreur lors de la terminaison de la relation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!relationshipId) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette relation ? Cette action est irréversible.')) {
      return;
    }
    setIsSaving(true);
    try {
      await treeService.deleteRelationship(relationshipId);
      onUpdate();
      onClose();
      alert('Relation supprimée avec succès');
    } catch (err) {
      console.error('Error deleting relationship:', err);
      alert('Erreur lors de la suppression');
    } finally {
      setIsSaving(false);
    }
  };

  if (!relationshipId) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>
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
                <h2>Détails de la relation</h2>
                {!isEditing && details.relationship.status === 'ACTIVE' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                      title="Modifier le type de relation ou le caractère biologique"
                    >
                      <Edit2 size={16} />
                      Modifier la relation
                    </button>
                  </div>
                )}
              </div>
              
              {!isEditing && details.relationship.status === 'ACTIVE' && (
                <div style={{ 
                  marginBottom: '1.5rem', 
                  padding: '12px', 
                  background: '#e7f3ff', 
                  borderRadius: '6px',
                  border: '1px solid #b3d9ff'
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#004085' }}>
                    <strong>💡 Astuce :</strong> Vous pouvez modifier le type de relation (Parental, Union, Fratrie) et le caractère biologique. 
                    Pour changer les personnes impliquées, vous devrez supprimer cette relation et en créer une nouvelle.
                  </p>
                </div>
              )}

              {/* Informations sur les personnes */}
              <div className="detail-section">
                <h3>Personnes concernées</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '6px' }}>
                    <strong>{details.relationship.personA.firstName} {details.relationship.personA.lastName}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                      {details.relationship.personA.gender === 'M' ? 'Homme' : details.relationship.personA.gender === 'F' ? 'Femme' : 'Autre'}
                    </div>
                    {details.relationship.type === 'PARENTAL' && (
                      <div style={{ fontSize: '0.75rem', color: '#326C58', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        (Parent)
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '6px' }}>
                    <strong>{details.relationship.personB.firstName} {details.relationship.personB.lastName}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                      {details.relationship.personB.gender === 'M' ? 'Homme' : details.relationship.personB.gender === 'F' ? 'Femme' : 'Autre'}
                    </div>
                    {details.relationship.type === 'PARENTAL' && (
                      <div style={{ fontSize: '0.75rem', color: '#326C58', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        (Enfant)
                      </div>
                    )}
                  </div>
                </div>
                {details.relationship.type === 'PARENTAL' && (
                  <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                    ⚠️ Note : Pour inverser la relation (changer qui est le parent et qui est l'enfant), 
                    vous devrez supprimer cette relation et en créer une nouvelle avec les rôles inversés.
                  </p>
                )}
              </div>

              {isEditing ? (
                <div className="edit-form">
                  <div style={{ marginBottom: '1rem' }}>
                    <label>Type de relation *</label>
                    <select
                      value={editForm.type || 'UNION'}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'PARENTAL' | 'UNION' | 'SIBLING' })}
                    >
                      <option value="UNION">Union (Mariage, PACS, Concubinage)</option>
                      <option value="PARENTAL">Parental (Parent-Enfant)</option>
                      <option value="SIBLING">Fratrie (Frère-Sœur)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={editForm.isBiological ?? true}
                        onChange={(e) => setEditForm({ ...editForm, isBiological: e.target.checked })}
                      />
                      {' '}Relation biologique
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        loadRelationshipDetails();
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
                      disabled={isSaving}
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
                  {/* Informations sur la relation */}
                  <div className="detail-section">
                    <h3>Informations sur la relation</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <strong>Type :</strong>{' '}
                        {details.relationship.type === 'UNION' ? 'Union (Mariage, PACS, Concubinage)' :
                         details.relationship.type === 'PARENTAL' ? 'Parental (Parent-Enfant)' :
                         'Fratrie (Frère-Sœur)'}
                      </div>
                      <div>
                        <strong>Statut :</strong>{' '}
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          background: details.relationship.status === 'ACTIVE' ? '#d4edda' :
                                     details.relationship.status === 'ENDED' ? '#fff3cd' :
                                     '#f8d7da',
                          color: details.relationship.status === 'ACTIVE' ? '#155724' :
                                 details.relationship.status === 'ENDED' ? '#856404' :
                                 '#721c24'
                        }}>
                          {details.relationship.status === 'ACTIVE' ? 'Active' :
                           details.relationship.status === 'ENDED' ? 'Terminée' :
                           'Décédé'}
                        </span>
                      </div>
                      <div>
                        <strong>Biologique :</strong> {details.relationship.isBiological ? 'Oui' : 'Non'}
                      </div>
                      {details.relationship.startDate && (
                        <div>
                          <strong>Date de début :</strong> {new Date(details.relationship.startDate).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      {details.relationship.endDate && (
                        <div>
                          <strong>Date de fin :</strong> {new Date(details.relationship.endDate).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      {details.relationship.endReason && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <strong>Raison de la fin :</strong> {details.relationship.endReason}
                        </div>
                      )}
                      {details.relationship.notes && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <strong>Notes :</strong> {details.relationship.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enfants (si union) */}
                  {details.relationship.type === 'UNION' && details.children && details.children.length > 0 && (
                    <div className="detail-section">
                      <h3>Enfants communs</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {details.children.map((child) => (
                          <div key={child.id} style={{ padding: '0.75rem', background: '#e8f5e9', borderRadius: '6px' }}>
                            <strong>{child.firstName} {child.lastName}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {details.relationship.status === 'ACTIVE' && (
                    <div className="detail-section">
                      <h3>Actions</h3>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setShowEndModal(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: '#ffc107',
                            color: '#000',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <XCircle size={16} />
                          Terminer la relation
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={isSaving}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isSaving ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal pour terminer la relation */}
      {showEndModal && (
        <div className="modal-overlay" onClick={() => setShowEndModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowEndModal(false)}>
              <X size={24} />
            </button>
            <h2>Terminer la relation</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label>Raison de la fin *</label>
              <input
                type="text"
                value={endForm.endReason}
                onChange={(e) => setEndForm({ ...endForm, endReason: e.target.value })}
                placeholder="Ex: Divorce, Séparation, Décès..."
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Date de fin</label>
              <input
                type="date"
                value={endForm.endDate}
                onChange={(e) => setEndForm({ ...endForm, endDate: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Notes additionnelles</label>
              <textarea
                value={endForm.notes || ''}
                onChange={(e) => setEndForm({ ...endForm, notes: e.target.value })}
                rows={3}
                placeholder="Informations complémentaires..."
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEndModal(false);
                  setEndForm({ endReason: '', endDate: '', notes: '' });
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
                onClick={handleEndRelationship}
                disabled={isSaving || !endForm.endReason.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: isSaving || !endForm.endReason.trim() ? '#ccc' : '#ffc107',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSaving || !endForm.endReason.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                <XCircle size={16} />
                {isSaving ? 'Traitement...' : 'Terminer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
