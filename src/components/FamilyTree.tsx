import { Plus, Flower } from 'lucide-react';
import type { Person, Relationship, TreeData } from '../services/tree.service';

interface FamilyTreeProps {
  treeData: TreeData | null;
  treeZoom: number;
  setTreeZoom: (zoom: number) => void;
  setShowAddPersonModal: (show: boolean) => void;
  getMediaUrl: (urlPath: string) => string;
}

export default function FamilyTree({ 
  treeData, 
  treeZoom, 
  setTreeZoom, 
  setShowAddPersonModal, 
  getMediaUrl 
}: FamilyTreeProps) {
  if (!treeData || !treeData.persons || treeData.persons.length === 0) {
    return (
      <div className="empty-tree">
        <Flower size={48} color="#D4AF37" />
        <h3>Votre arbre généalogique</h3>
        <p>Commencez par ajouter des membres de votre famille</p>
        <button className="add-first-person-btn" onClick={() => setShowAddPersonModal(true)}>
          <Plus size={20} />
          Ajouter la première personne
        </button>
      </div>
    );
  }

  const { persons, relationships } = treeData;
  const unions = relationships.filter((r: Relationship) => r.type === 'UNION');
  const parentalRels = relationships.filter((r: Relationship) => r.type === 'PARENTAL');

  // Fonction pour obtenir le conjoint d'une personne
  const getSpouse = (personId: number) => {
    const union = unions.find((u: Relationship) => 
      u.personAId === personId || u.personBId === personId
    );
    if (!union) return null;
    return union.personAId === personId ? union.personBId : union.personAId;
  };

  // Fonction pour obtenir les enfants d'une personne
  const getChildren = (parentId: number) => {
    return parentalRels
      .filter((r: Relationship) => r.personAId === parentId)
      .map((r: Relationship) => r.personBId);
  };

  // Organiser les personnes par niveau (simple)
  const childrenIds = new Set(parentalRels.map((r: Relationship) => r.personBId));
  const roots = persons.filter((p: Person) => !childrenIds.has(p.id));
  
  // Créer des générations simples
  const generations: Person[][] = [];
  const processed = new Set<number>();

  // Génération 0 : les racines
  if (roots.length > 0) {
    generations[0] = roots;
    roots.forEach(p => processed.add(p.id));
  }

  // Générations suivantes (enfants)
  let currentGen = 0;
  while (currentGen < 5 && generations[currentGen]) { // Limite de sécurité
    const nextGenChildren: Person[] = [];
    
    generations[currentGen].forEach(parent => {
      const children = getChildren(parent.id);
      children.forEach(childId => {
        if (!processed.has(childId)) {
          const child = persons.find(p => p.id === childId);
          if (child) {
            nextGenChildren.push(child);
            processed.add(childId);
          }
        }
      });
    });

    if (nextGenChildren.length > 0) {
      generations[currentGen + 1] = nextGenChildren;
    }
    currentGen++;
  }

  return (
    <div className="family-tree">
      {/* Contrôles de l'arbre */}
      <div className="tree-controls">
        <button 
          className="zoom-btn" 
          onClick={() => setTreeZoom(Math.max(0.5, treeZoom - 0.1))}
          disabled={treeZoom <= 0.5}
        >
          -
        </button>
        <span className="zoom-level">{Math.round(treeZoom * 100)}%</span>
        <button 
          className="zoom-btn" 
          onClick={() => setTreeZoom(Math.min(2, treeZoom + 0.1))}
          disabled={treeZoom >= 2}
        >
          +
        </button>
        <button 
          className="add-person-btn" 
          onClick={() => setShowAddPersonModal(true)}
        >
          <Plus size={16} />
          Ajouter une personne
        </button>
      </div>

      {/* Arbre par générations */}
      <div className="generations-container" style={{ transform: `scale(${treeZoom})`, transformOrigin: 'top center' }}>
        {generations.map((generation, genIndex) => (
          <div key={genIndex} className="generation" data-generation={genIndex}>
            <div className="generation-label">
              Génération {genIndex + 1}
              {genIndex === 0 && " (Ancêtres)"}
              {genIndex === generations.length - 1 && genIndex > 0 && " (Descendants)"}
            </div>
            
            <div className="generation-members">
              {generation.map((person) => {
                const spouseId = getSpouse(person.id);
                const spouse = spouseId ? persons.find(p => p.id === spouseId) : null;
                const children = getChildren(person.id);
                
                // Éviter de dupliquer les couples
                if (spouse && spouseId && person.id > spouseId) return null;

                return (
                  <div key={person.id} className="family-unit">
                    {/* Couple ou personne seule */}
                    <div className="couple-container">
                      {/* Personne principale */}
                      <div className={`person-card ${person.gender.toLowerCase()}`}>
                        <div className="person-avatar">
                          {person.photoUrl ? (
                            <img src={getMediaUrl(person.photoUrl)} alt={person.firstName} />
                          ) : (
                            <div className="avatar-initials">
                              {person.firstName[0]}{person.lastName[0]}
                            </div>
                          )}
                          <div className="gender-indicator">
                            {person.gender === 'M' ? '♂' : person.gender === 'F' ? '♀' : '⚧'}
                          </div>
                        </div>
                        <div className="person-info">
                          <h4>{person.firstName} {person.lastName}</h4>
                          {person.birthDate && (
                            <p className="birth-date">
                              Né(e) le {new Date(person.birthDate).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                          {person.deathDate && (
                            <p className="death-date">
                              Décédé(e) le {new Date(person.deathDate).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Conjoint si présent */}
                      {spouse && (
                        <>
                          <div className="marriage-link">💕</div>
                          <div className={`person-card ${spouse.gender.toLowerCase()}`}>
                            <div className="person-avatar">
                              {spouse.photoUrl ? (
                                <img src={getMediaUrl(spouse.photoUrl)} alt={spouse.firstName} />
                              ) : (
                                <div className="avatar-initials">
                                  {spouse.firstName[0]}{spouse.lastName[0]}
                                </div>
                              )}
                              <div className="gender-indicator">
                                {spouse.gender === 'M' ? '♂' : spouse.gender === 'F' ? '♀' : '⚧'}
                              </div>
                            </div>
                            <div className="person-info">
                              <h4>{spouse.firstName} {spouse.lastName}</h4>
                              {spouse.birthDate && (
                                <p className="birth-date">
                                  Né(e) le {new Date(spouse.birthDate).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                              {spouse.deathDate && (
                                <p className="death-date">
                                  Décédé(e) le {new Date(spouse.deathDate).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Ligne de descendance vers les enfants */}
                    {children.length > 0 && (
                      <div className="children-connection">
                        <div className="vertical-line"></div>
                        <div className="children-indicator">
                          {children.length} enfant{children.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="tree-legend">
        <div className="legend-item">
          <span className="legend-symbol">💕</span>
          <span>Couple marié/uni</span>
        </div>
        <div className="legend-item">
          <span className="legend-symbol">♂</span>
          <span>Homme</span>
        </div>
        <div className="legend-item">
          <span className="legend-symbol">♀</span>
          <span>Femme</span>
        </div>
        <div className="legend-item">
          <span className="legend-line"></span>
          <span>Lien de filiation</span>
        </div>
      </div>
    </div>
  );
}