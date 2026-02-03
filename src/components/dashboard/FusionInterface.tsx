import React, { memo, useState } from 'react';
import { 
  ArrowRight, 
  PlusCircle, 
  Search, 
  X 
} from 'lucide-react';
import { type FamilyMergeRequest } from '../../services/multi-family.service';
import { type MemberStatus } from '../../services/member.service';
import { type TreeData } from '../../services/tree.service';
import { type Family } from '../../services/family.service';

interface FusionInterfaceProps {
  // Data
  currentFamily: MemberStatus | null;
  treeData: TreeData | null;
  pendingFusionRequests: FamilyMergeRequest[];
  
  // Actions
  onCreateFusionRequest: (data: {
    targetFamilyId: number;
    sourcePersonId: number;
    targetPersonId: number;
    relationshipType: 'PARENTAL' | 'UNION' | 'SIBLING';
    justification?: string;
  }) => Promise<boolean>;
  onValidateFusionRequest: (requestId: number, action: 'APPROVE' | 'REJECT') => Promise<boolean>;
  onSearchFamilies: (query: string) => Promise<Family[]>;
}

export const FusionInterface = memo(({
  // Data
  currentFamily,
  treeData,
  pendingFusionRequests,
  
  // Actions
  onCreateFusionRequest,
  onValidateFusionRequest,
  onSearchFamilies
}: FusionInterfaceProps) => {
  const [showFusionModal, setShowFusionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Family[]>([]);
  const [fusionTargetFamilyId, setFusionTargetFamilyId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [sourcePersonId, setSourcePersonId] = useState<number | null>(null);
  const [targetPersonId, setTargetPersonId] = useState<number | null>(null);
  const [relationshipType, setRelationshipType] = useState<'PARENTAL' | 'UNION' | 'SIBLING'>('UNION');
  const [justification, setJustification] = useState('');

  const handleSearchFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await onSearchFamilies(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateFusionRequest = async () => {
    if (!fusionTargetFamilyId || !sourcePersonId || !targetPersonId) {
      alert("Veuillez remplir tous les champs obligatoires (famille cible, personne source, personne cible).");
      return;
    }
    
    const success = await onCreateFusionRequest({
      targetFamilyId: fusionTargetFamilyId,
      sourcePersonId,
      targetPersonId,
      relationshipType,
      justification: justification.trim() || undefined
    });
    if (success) {
      alert("Demande de fusion envoyée !");
      setShowFusionModal(false);
      setSearchQuery('');
      setSearchResults([]);
      setFusionTargetFamilyId(null);
      setSourcePersonId(null);
      setTargetPersonId(null);
      setRelationshipType('UNION');
      setJustification('');
    } else {
      alert("Erreur lors de l'envoi de la demande");
    }
  };

  const handleValidateFusionRequest = async (requestId: number, action: 'APPROVE' | 'REJECT') => {
    const success = await onValidateFusionRequest(requestId, action);
    if (success) {
      alert(action === 'APPROVE' ? "Fusion approuvée ! Les familles sont maintenant connectées." : "Demande rejetée.");
    } else {
      alert("Erreur lors de la validation");
    }
  };

  return (
    <div className="fusion-interface">
      {/* Fusion Request Modal */}
      {showFusionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowFusionModal(false)} title="Fermer" aria-label="Fermer la fenêtre">
              <X size={24}/>
            </button>
            <h2>Demander une fusion de famille</h2>
            <p>Recherchez une famille avec laquelle vous souhaitez créer une connexion pour permettre les relations inter-familiales.</p>
            
            <form onSubmit={handleSearchFamily} className="search-form">
              <input 
                type="text" 
                placeholder="Rechercher une famille..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" disabled={isSearching} title="Rechercher une famille" aria-label="Rechercher une famille">
                <Search size={18}/>
              </button>
            </form>

            <div className="search-results">
              {isSearching ? (
                <p>Recherche en cours...</p>
              ) : (
                <>
                  {searchResults.map((fam: Family) => (
                    <div key={fam.id} className="result-item">
                      <span>{fam.familyName}</span>
                      {fam.id === currentFamily?.familyId ? (
                        <button disabled className="btn-self">Votre famille</button>
                      ) : (
                        <button 
                          onClick={() => setFusionTargetFamilyId(fam.id)}
                          className={fusionTargetFamilyId === fam.id ? 'btn-selected' : ''}
                        >
                          {fusionTargetFamilyId === fam.id ? 'Sélectionnée' : 'Sélectionner'}
                        </button>
                      )}
                    </div>
                  ))}
                  {searchResults.length === 0 && searchQuery && !isSearching && (
                    <p>Aucun résultat trouvé.</p>
                  )}
                </>
              )}
            </div>

            {fusionTargetFamilyId && (
              <div className="fusion-confirm" style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ marginBottom: '1rem' }}><strong>Famille sélectionnée :</strong> {searchResults.find(f => f.id === fusionTargetFamilyId)?.familyName}</p>
                
                {/* Sélection de la personne source (famille actuelle) */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Personne de votre famille (source) *
                  </label>
                  <select
                    value={sourcePersonId || ''}
                    onChange={(e) => setSourcePersonId(Number(e.target.value) || null)}
                    title="Sélectionner une personne de votre famille"
                    aria-label="Sélectionner une personne de votre famille"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}
                  >
                    <option value="">Sélectionner une personne</option>
                    {treeData?.persons.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.firstName} {person.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sélection de la personne cible (famille cible) */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    ID de la personne dans la famille cible *
                  </label>
                  <input
                    type="number"
                    value={targetPersonId || ''}
                    onChange={(e) => setTargetPersonId(Number(e.target.value) || null)}
                    placeholder="Entrez l'ID de la personne"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    Vous devez connaître l'ID de la personne dans la famille cible. Contactez l'administrateur si nécessaire.
                  </p>
                </div>

                {/* Sélection du type de relation */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Type de relation *
                  </label>
                  <select
                    value={relationshipType}
                    onChange={(e) => setRelationshipType(e.target.value as 'PARENTAL' | 'UNION' | 'SIBLING')}
                    title="Sélectionner le type de relation"
                    aria-label="Sélectionner le type de relation"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}
                  >
                    <option value="UNION">Union (Mariage, PACS, Concubinage)</option>
                    <option value="PARENTAL">Parental (Parent-Enfant, Adoption)</option>
                    <option value="SIBLING">Fratrie (Frère-Sœur)</option>
                  </select>
                </div>

                {/* Justification */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Justification (optionnel)
                  </label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Expliquez la raison de cette demande de fusion..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button 
                  className="primary-btn"
                  onClick={handleCreateFusionRequest}
                  disabled={!sourcePersonId || !targetPersonId}
                  style={{
                    background: (sourcePersonId && targetPersonId) ? 'linear-gradient(135deg, #326C58 0%, #4A9B7F 100%)' : '#ccc',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    width: '100%',
                    cursor: (sourcePersonId && targetPersonId) ? 'pointer' : 'not-allowed'
                  }}
                >
                  Envoyer la demande de fusion
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fusion Header */}
      <div className="fusion-header">
        <div className="fusion-title">
          <ArrowRight size={32} color="#326C58" />
          <div>
            <h2>Fusion de Familles</h2>
            <p>Connectez votre famille à d'autres familles pour créer des liens inter-familiaux</p>
          </div>
        </div>
        <button 
          className="primary-btn"
          onClick={() => setShowFusionModal(true)}
          style={{
            background: 'linear-gradient(135deg, #326C58 0%, #4A9B7F 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <PlusCircle size={20} />
          Demander une fusion
        </button>
      </div>

      {/* Fusion Content */}
      <div className="fusion-content">
        <div className="fusion-section">
          <h3>Informations sur l'arbre multi-famille</h3>
          {treeData && currentFamily && (
            <div className="tree-info">
              <p><strong>Famille principale :</strong> {currentFamily.familyName}</p>
              <p><strong>Familles connectées :</strong> {treeData.connectedFamiliesCount || 0}</p>
              <p><strong>Total personnes :</strong> {treeData.persons.length}</p>
              {treeData.connectedFamiliesCount && treeData.connectedFamiliesCount > 0 && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  background: '#e8f5e8',
                  borderRadius: '8px',
                  border: '1px solid #c3e6c3'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#155724',
                    marginBottom: '5px'
                  }}>
                    🎉 Votre famille est connectée !
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#155724'
                  }}>
                    Vous pouvez maintenant créer des relations entre personnes de différentes familles.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="fusion-section">
          <h3>Demandes de fusion en attente</h3>
          {pendingFusionRequests.length > 0 ? (
            <div className="fusion-requests">
              {pendingFusionRequests.map(request => (
                <div key={request.id} className="fusion-request-card">
                  <div className="request-info">
                    <h4>Demande de fusion</h4>
                    <p><strong>De :</strong> {request.sourceFamily?.familyName || request.sourceFamilyName}</p>
                    <p><strong>Vers :</strong> {request.targetFamily?.familyName || request.targetFamilyName}</p>
                    {request.sourcePerson && (
                      <p><strong>Personne source :</strong> {request.sourcePerson.firstName} {request.sourcePerson.lastName}</p>
                    )}
                    {request.targetPerson && (
                      <p><strong>Personne cible :</strong> {request.targetPerson.firstName} {request.targetPerson.lastName}</p>
                    )}
                    <p><strong>Type de relation :</strong> {
                      request.relationshipType === 'UNION' ? 'Union (Mariage, PACS)' :
                      request.relationshipType === 'PARENTAL' ? 'Parental' :
                      'Fratrie'
                    }</p>
                    {request.justification && (
                      <p><strong>Justification :</strong> {request.justification}</p>
                    )}
                    <p><strong>Statut :</strong> 
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: request.status === 'PENDING' ? '#fff3cd' : 
                                   request.status === 'APPROVED' ? '#d4edda' : '#f8d7da',
                        color: request.status === 'PENDING' ? '#856404' : 
                               request.status === 'APPROVED' ? '#155724' : '#721c24'
                      }}>
                        {request.status === 'PENDING' ? 'EN ATTENTE' : 
                         request.status === 'APPROVED' ? 'APPROUVÉE' : 'REJETÉE'}
                      </span>
                    </p>
                    <p><strong>Date :</strong> {new Date(request.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {request.status === 'PENDING' && request.targetFamilyId === currentFamily?.familyId && (
                    <div className="request-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleValidateFusionRequest(request.id, 'APPROVE')}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          marginRight: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}
                      >
                        Approuver
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleValidateFusionRequest(request.id, 'REJECT')}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                  {request.status === 'PENDING' && request.sourceFamilyId === currentFamily?.familyId && (
                    <div className="request-status" style={{
                      padding: '8px 12px',
                      background: '#fff3cd',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#856404'
                    }}>
                      En attente de validation par la famille cible
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#666'
            }}>
              <ArrowRight size={48} color="#ccc" style={{ marginBottom: '16px' }} />
              <p>Aucune demande de fusion en attente</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                Créez une demande de fusion pour connecter votre famille à une autre famille.
              </p>
            </div>
          )}
        </div>

        {/* Guide d'utilisation */}
        <div className="fusion-section">
          <h3>Comment fonctionne la fusion de familles ?</h3>
          <div className="fusion-guide" style={{
            display: 'grid',
            gap: '16px',
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}>
            <div className="guide-step" style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#326C58',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '700',
                flexShrink: 0
              }}>
                1
              </div>
              <div>
                <strong>Demande de fusion :</strong> En tant qu'administrateur, vous pouvez demander à connecter votre famille à une autre famille.
              </div>
            </div>
            
            <div className="guide-step" style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#326C58',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '700',
                flexShrink: 0
              }}>
                2
              </div>
              <div>
                <strong>Validation :</strong> L'administrateur de la famille cible doit approuver la demande de connexion.
              </div>
            </div>
            
            <div className="guide-step" style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#326C58',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '700',
                flexShrink: 0
              }}>
                3
              </div>
              <div>
                <strong>Connexion établie :</strong> Une fois approuvée, les deux familles peuvent créer des relations inter-familiales (mariages, adoptions, etc.).
              </div>
            </div>
            
            <div className="guide-step" style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              background: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #c3e6c3'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#28a745',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '700',
                flexShrink: 0
              }}>
                ✓
              </div>
              <div>
                <strong>Arbre unifié :</strong> L'arbre généalogique affiche automatiquement les personnes des familles connectées avec des indicateurs visuels.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});