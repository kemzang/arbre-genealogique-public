import React, { memo } from 'react';
import { X } from 'lucide-react';
import { type Person, type Relationship } from '../../services/tree.service';

interface AddPersonModalProps {
  showAddPersonModal: boolean;
  newPerson: {
    firstName: string;
    lastName: string;
    gender: string;
    birthDate: string;
  };
  relatedPersonId: number | null;
  relationshipType: 'PARENTAL' | 'CHILD' | 'SPOUSE' | 'SIBLING';
  treeData: { persons: Person[]; relationships: Relationship[] } | null;
  
  setShowAddPersonModal: (show: boolean) => void;
  setNewPerson: (person: any) => void;
  setRelatedPersonId: (id: number | null) => void;
  setRelationshipType: (type: 'PARENTAL' | 'CHILD' | 'SPOUSE' | 'SIBLING') => void;
  onAddPerson: (e: React.FormEvent) => void;
}

export const AddPersonModal = memo(({
  showAddPersonModal,
  newPerson,
  relatedPersonId,
  relationshipType,
  treeData,
  setShowAddPersonModal,
  setNewPerson,
  setRelatedPersonId,
  setRelationshipType,
  onAddPerson
}: AddPersonModalProps) => {
  if (!showAddPersonModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={() => setShowAddPersonModal(false)}>
          <X size={24}/>
        </button>
        <h2>Ajouter une personne</h2>
        <form onSubmit={onAddPerson} className="person-form">
          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input 
                type="text" 
                required 
                value={newPerson.firstName} 
                onChange={(e) => setNewPerson({...newPerson, firstName: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input 
                type="text" 
                required 
                value={newPerson.lastName} 
                onChange={(e) => setNewPerson({...newPerson, lastName: e.target.value})} 
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date de naissance</label>
              <input 
                type="date" 
                value={newPerson.birthDate} 
                onChange={(e) => setNewPerson({...newPerson, birthDate: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Sexe</label>
              <select 
                value={newPerson.gender} 
                onChange={(e) => setNewPerson({...newPerson, gender: e.target.value})}
              >
                <option value="M">Homme</option>
                <option value="F">Femme</option>
                <option value="O">Autre</option>
              </select>
            </div>
          </div>

          {treeData?.persons && treeData.persons.length > 0 && (
            <>
              <h3>Relation avec un membre existant</h3>
              
              <div className="form-group">
                <label>
                  Membre existant : 
                  <strong>
                    {treeData.persons.find((p: Person) => p.id === relatedPersonId)?.firstName} {treeData.persons.find((p: Person) => p.id === relatedPersonId)?.lastName}
                  </strong>
                </label>
                <select 
                  value={relatedPersonId || ''} 
                  onChange={(e) => setRelatedPersonId(Number(e.target.value))}
                  required
                >
                  <option value="" disabled>Sélectionner...</option>
                  {treeData.persons.map((p: Person) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>La nouvelle personne est...</label>
                <select 
                  value={relationshipType} 
                  onChange={(e) => setRelationshipType(e.target.value as any)}
                >
                  <option value="CHILD">Enfant de</option>
                  <option value="PARENTAL">Parent de</option>
                  <option value="SPOUSE">Conjoint(e) de</option>
                  <option value="SIBLING">Frère/Sœur de</option>
                </select>
                {relationshipType === 'CHILD' && relatedPersonId && (
                  <p style={{fontSize: '0.8rem', color: '#666', marginTop: '5px'}}>
                    {(() => {
                      const union = treeData.relationships.find((r: Relationship) => 
                        r.type === 'UNION' && (r.personAId === relatedPersonId || r.personBId === relatedPersonId)
                      );
                      if (union) {
                        const spouseId = union.personAId === relatedPersonId ? union.personBId : union.personAId;
                        const spouse = treeData.persons.find((p: Person) => p.id === spouseId);
                        return `Note : L'enfant sera lié à ${treeData.persons.find((p: Person) => p.id === relatedPersonId)?.firstName} ET à son conjoint ${spouse?.firstName}.`;
                      }
                      return "Note : L'enfant sera lié à ce parent unique.";
                    })()}
                  </p>
                )}
              </div>
            </>
          )}

          <button type="submit" style={{marginTop: '1rem', width: '100%'}}>
            Ajouter & Lier
          </button>
        </form>
      </div>
    </div>
  );
});