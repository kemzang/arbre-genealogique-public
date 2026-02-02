import { useState, useCallback } from 'react';
import { treeService, type Relationship, type TreeData } from '../services/tree.service';
import { type MemberStatus } from '../services/member.service';
import { useSafeAsync } from './useSafeAsync';

export const useTreeManagement = (
  currentFamily: MemberStatus | null,
  treeData: TreeData | null,
  onTreeUpdate: (tree: TreeData) => void
) => {
  const { safeSetState } = useSafeAsync();
  
  // Add Person State
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPerson, setNewPerson] = useState({
    firstName: '',
    lastName: '',
    gender: 'M',
    birthDate: ''
  });
  const [relatedPersonId, setRelatedPersonId] = useState<number | null>(null);
  const [relationshipType, setRelationshipType] = useState<'PARENTAL' | 'CHILD' | 'SPOUSE' | 'SIBLING'>('CHILD');
  const [treeZoom, setTreeZoom] = useState(1);

  const handleAddPerson = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily) return;
    if (!newPerson.firstName || !newPerson.lastName) {
      alert("Nom et Prénom requis");
      return;
    }
    
    if (treeData?.persons && treeData.persons.length > 0 && !relatedPersonId) {
      alert("Veuillez sélectionner un membre parent/enfant/conjoint pour lier la nouvelle personne.");
      return;
    }

    try {
      // Create the Person
      const createdPerson = await treeService.createPerson({
        familyId: currentFamily.familyId,
        firstName: newPerson.firstName,
        lastName: newPerson.lastName,
        gender: newPerson.gender as 'M'|'F'|'O',
        birthDate: newPerson.birthDate
      });

      // Create the Relationship(s)
      if (relatedPersonId && createdPerson.id) {
        if (relationshipType === 'SPOUSE') {
          await treeService.createRelationship({
            personAId: createdPerson.id,
            personBId: relatedPersonId,
            type: 'UNION',
            isBiological: true
          });
        } else if (relationshipType === 'SIBLING') {
          const parentRels = treeData?.relationships.filter((r: Relationship) => 
            r.type === 'PARENTAL' && r.personBId === relatedPersonId
          );
          if (parentRels && parentRels.length > 0) {
            for (const rel of parentRels) {
              await treeService.createRelationship({
                personAId: rel.personAId,
                personBId: createdPerson.id,
                type: 'PARENTAL',
                isBiological: true
              });
            }
          } else {
            await treeService.createRelationship({
              personAId: relatedPersonId,
              personBId: createdPerson.id,
              type: 'SIBLING',
              isBiological: true
            });
          }
        } else if (relationshipType === 'PARENTAL') {
          await treeService.createRelationship({
            personAId: createdPerson.id,
            personBId: relatedPersonId,
            type: 'PARENTAL',
            isBiological: true
          });
        } else if (relationshipType === 'CHILD') {
          await treeService.createRelationship({
            personAId: relatedPersonId,
            personBId: createdPerson.id,
            type: 'PARENTAL',
            isBiological: true
          });
          
          const union = treeData?.relationships.find((r: Relationship) => 
            r.type === 'UNION' && (r.personAId === relatedPersonId || r.personBId === relatedPersonId)
          );
          if (union) {
            const otherParentId = union.personAId === relatedPersonId ? union.personBId : union.personAId;
            await treeService.createRelationship({
              personAId: otherParentId,
              personBId: createdPerson.id,
              type: 'PARENTAL',
              isBiological: true
            });
          }
        }
      }

      // Reset form state
      safeSetState(() => {
        setShowAddPersonModal(false);
        setNewPerson({ firstName: '', lastName: '', gender: 'M', birthDate: '' });
        setRelatedPersonId(null);
        setRelationshipType('CHILD');
      });

      // Reload tree data
      const updatedTree = await treeService.getTree(currentFamily.familyId);
      safeSetState(() => {
        onTreeUpdate(updatedTree);
      });
      
      alert("Membre ajouté avec succès !");
      
    } catch (error) {
      console.error("Error creating person/relationship", error);
      alert("Erreur lors de l'ajout. Vérifiez les données.");
    }
  }, [currentFamily, newPerson, relatedPersonId, relationshipType, treeData, safeSetState, onTreeUpdate]);

  const openAddPersonModal = useCallback((personId?: number, relType?: 'PARENTAL' | 'CHILD' | 'SPOUSE' | 'SIBLING') => {
    setRelatedPersonId(personId || null);
    setRelationshipType(relType || 'CHILD');
    setShowAddPersonModal(true);
  }, []);

  return {
    // State
    showAddPersonModal,
    newPerson,
    relatedPersonId,
    relationshipType,
    treeZoom,
    
    // Setters
    setShowAddPersonModal,
    setNewPerson,
    setRelatedPersonId,
    setRelationshipType,
    setTreeZoom,
    
    // Actions
    handleAddPerson,
    openAddPersonModal
  };
};