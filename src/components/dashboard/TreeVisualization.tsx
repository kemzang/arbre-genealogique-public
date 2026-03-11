import { memo } from 'react';
import { PlusCircle, Users, Flower } from 'lucide-react';
import { type TreeData, type Person, type Relationship } from '../../services/tree.service';

interface TreeVisualizationProps {
  treeData: TreeData | null;
  treeZoom: number;
  setTreeZoom: (zoom: number) => void;
  onAddPerson: (personId?: number, relType?: 'PARENTAL' | 'CHILD' | 'SPOUSE' | 'SIBLING') => void;
  onViewPerson?: (personId: number) => void;
  onViewRelationship?: (relationshipId: number) => void;
}

export const TreeVisualization = memo(({
  treeData,
  treeZoom,
  setTreeZoom,
  onAddPerson,
  onViewPerson,
  onViewRelationship
}: TreeVisualizationProps) => {
  if (!treeData?.persons || treeData.persons.length === 0) {
    return (
      <div className="placeholder-msg">
        <Flower size={64} color="#D4AF37" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
        <h3>Votre lignée commence ici</h3>
        <p>Appuyez sur le bouton ci-dessous pour ajouter votre premier ancêtre.</p>
        <button 
          className="primary-btn" 
          onClick={() => onAddPerson()}
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #F5D76E 100%)',
            color: '#1a1a1d',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.3)';
          }}
        >
          <PlusCircle size={24} strokeWidth={2.5} /> 
          Commencer l'arbre
        </button>
      </div>
    );
  }

  const { persons, relationships } = treeData;
  const nodePositions = new Map<number, {x: number, y: number}>();
  const placed = new Set<number>();
  
  const nodeWidth = 140;
  const nodeHeight = 160;
  const levelGap = 280;
  const spouseGap = 30;
  const siblingGap = 100;

  const unions = relationships.filter((r: Relationship) => r.type === 'UNION');
  const parentalRels = relationships.filter((r: Relationship) => r.type === 'PARENTAL');
  
  // Calculer les niveaux de génération en partant des personnes sans enfants (feuilles)
  const personLevels = new Map<number, number>();
  
  // Fonction récursive pour calculer le niveau d'une personne
  // Les personnes sans enfants sont au niveau 0 (feuilles)
  // Les parents sont au niveau = max(niveau de leurs enfants) + 1
  const calculateLevel = (personId: number, visited: Set<number> = new Set()): number => {
    if (visited.has(personId)) {
      // Cycle détecté, retourner 0 pour éviter la récursion infinie
      return 0;
    }
    visited.add(personId);
    
    if (personLevels.has(personId)) {
      return personLevels.get(personId)!;
    }
    
    // Trouver les enfants de cette personne
    const children = parentalRels
      .filter((r: Relationship) => r.personAId === personId)
      .map((r: Relationship) => r.personBId);
    
    // Si la personne n'a pas d'enfants, elle est une feuille (niveau 0)
    if (children.length === 0) {
      const level = 0;
      personLevels.set(personId, level);
      return level;
    }
    
    // Le niveau d'un parent = niveau maximum de ses enfants + 1
    const childrenLevels = children.map(childId => calculateLevel(childId, new Set(visited)));
    const maxChildLevel = childrenLevels.length > 0 ? Math.max(...childrenLevels) : 0;
    const parentLevel = maxChildLevel + 1;
    
    personLevels.set(personId, parentLevel);
    return parentLevel;
  };
  
  // Calculer les niveaux pour toutes les personnes
  persons.forEach((p: Person) => {
    if (!personLevels.has(p.id)) {
      calculateLevel(p.id);
    }
  });
  
  // Ajuster les niveaux des conjoints pour qu'ils soient au même niveau
  unions.forEach((union: Relationship) => {
    const levelA = personLevels.get(union.personAId) || 0;
    const levelB = personLevels.get(union.personBId) || 0;
    const maxLevel = Math.max(levelA, levelB);
    // Les deux conjoints doivent avoir le même niveau (le plus élevé)
    personLevels.set(union.personAId, maxLevel);
    personLevels.set(union.personBId, maxLevel);
  });
  
  // Trouver le niveau maximum pour inverser (les parents en haut)
  const maxLevel = Math.max(...Array.from(personLevels.values()), 0);
  
  // Inverser les niveaux : les parents (niveau élevé) doivent être en haut (y petit)
  // Les enfants (niveau bas) doivent être en bas (y grand)
  const normalizedLevels = new Map<number, number>();
  personLevels.forEach((level, personId) => {
    normalizedLevels.set(personId, maxLevel - level);
  });

  const getChildrenOfUnion = (pA: number, pB: number | null) => {
    const cA = parentalRels.filter((r: Relationship) => r.personAId === pA).map((r: Relationship) => r.personBId);
    if (!pB) return cA;
    const cB = parentalRels.filter((r: Relationship) => r.personAId === pB).map((r: Relationship) => r.personBId);
    return Array.from(new Set([...cA, ...cB]));
  };

  const placeSubtree = (personId: number, startX: number): number => {
    if (placed.has(personId)) return 0;
    
    // Utiliser le niveau normalisé pour le positionnement Y
    const level = normalizedLevels.get(personId) || 0;
    const y = level * levelGap;
    
    const union = unions.find((u: Relationship) => u.personAId === personId || u.personBId === personId);
    const spouseId = union ? (union.personAId === personId ? union.personBId : union.personAId) : null;
    
    const unitWidth = spouseId ? (nodeWidth * 2 + spouseGap) : nodeWidth;
    const children = getChildrenOfUnion(personId, spouseId);
    
    placed.add(personId);
    if (spouseId) {
      placed.add(spouseId);
      // Le conjoint doit être au même niveau
      const spouseLevel = normalizedLevels.get(spouseId) || level;
      const spouseY = spouseLevel * levelGap;
      if (spouseY !== y) {
        // Ajuster le niveau du conjoint pour qu'il soit au même niveau
        normalizedLevels.set(spouseId, level);
      }
    }

    let childrenTreeWidth = 0;
    
    if (children.length > 0) {
      childrenTreeWidth = children.length * 280 + (children.length - 1) * siblingGap;
    }

    const subtreeWidth = Math.max(unitWidth, childrenTreeWidth);
    const centerX = startX + subtreeWidth / 2;

    if (spouseId) {
      nodePositions.set(personId, { x: centerX - nodeWidth - spouseGap / 2, y });
      nodePositions.set(spouseId, { x: centerX + spouseGap / 2, y });
    } else {
      nodePositions.set(personId, { x: centerX - nodeWidth / 2, y });
    }

    if (children.length > 0) {
      let currentChildX = centerX - childrenTreeWidth / 2;
      children.forEach((childId: number) => {
        placeSubtree(childId, currentChildX);
        currentChildX += 280 + siblingGap;
      });
    }

    return subtreeWidth;
  };

  // Grouper les personnes par niveau pour un meilleur positionnement
  const personsByLevel = new Map<number, Person[]>();
  normalizedLevels.forEach((level, personId) => {
    const person = persons.find(p => p.id === personId);
    if (person) {
      if (!personsByLevel.has(level)) {
        personsByLevel.set(level, []);
      }
      personsByLevel.get(level)!.push(person);
    }
  });

  // Placer les personnes niveau par niveau, en commençant par le niveau le plus haut (parents)
  const sortedLevels = Array.from(personsByLevel.keys()).sort((a, b) => a - b);
  let currentX = 0;
  
  sortedLevels.forEach(level => {
    const levelPersons = personsByLevel.get(level)!;
    levelPersons.forEach((person: Person) => {
      if (!placed.has(person.id)) {
        currentX += placeSubtree(person.id, currentX) + 200;
      }
    });
  });

  // Ensure ALL persons are placed
  persons.forEach((p: Person, idx: number) => {
    if (!placed.has(p.id)) {
      nodePositions.set(p.id, { x: idx * (nodeWidth + 60), y: 1500 });
      placed.add(p.id);
    }
  });

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodePositions.forEach((pos: {x: number, y: number}) => {
    minX = Math.min(minX, pos.x); minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + nodeWidth); maxY = Math.max(maxY, pos.y + nodeHeight);
  });

  const pad = 200;
  const cw = Math.max(1200, maxX - minX + pad * 2);
  const ch = Math.max(800, maxY - minY + pad * 2);

  return (
    <>
      <div className="tree-controls" style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
        zIndex: 100, 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center' 
      }}>
        <button onClick={() => setTreeZoom(Math.max(0.2, treeZoom - 0.1))} title="Zoom -">-</button>
        <span style={{ 
          background: '#326C58', 
          padding: '4px 10px', 
          borderRadius: '4px', 
          fontSize: '0.8rem', 
          minWidth: '40px', 
          textAlign: 'center' 
        }}>
          {Math.round(treeZoom * 100)}%
        </span>
        <button onClick={() => setTreeZoom(Math.min(2, treeZoom + 0.1))} title="Zoom +">+</button>
        <button onClick={() => setTreeZoom(1)} title="Reset Zoom">⟲</button>
        
        <button 
          onClick={() => onAddPerson()}
          title="Ajouter une personne"
          style={{
            background: 'linear-gradient(135deg, #326C58 0%, #4A9B7F 100%)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <PlusCircle size={16} strokeWidth={2.5} />
          <span>Ajouter</span>
        </button>
      </div>

      <div className="zoom-container">
        <div className="tree-canvas" style={{ width: cw, height: ch, transform: `scale(${treeZoom})` }}>
          <svg className="connections" style={{ width: '100%', height: '100%', position: 'absolute' }}>
            {/* Generation guides */}
            {Array.from({ length: 8 }).map((_, i: number) => {
              const targetY = i * levelGap - (minY < Infinity ? minY : 0) + pad;
              return (
                <g key={`gen-guide-${i}`}>
                  <line 
                    x1={0} y1={targetY + 80} 
                    x2={cw} y2={targetY + 80} 
                    stroke="rgba(212, 175, 55, 0.1)" strokeWidth="1" strokeDasharray="15,10" 
                  />
                  <text 
                    x={20} 
                    y={targetY + 50} 
                    fill="#D4AF37" 
                    fontSize="12" 
                    fontWeight="900"
                    style={{ 
                      textTransform: 'uppercase', 
                      letterSpacing: '3px'
                    }}
                  >
                    Génération {i + 1}
                  </text>
                </g>
              );
            })}

            {/* Unions and their children junction lines */}
            {unions.map((u: Relationship) => {
              const p1 = nodePositions.get(u.personAId);
              const p2 = nodePositions.get(u.personBId);
              if (!p1 || !p2) return null;
              const x1 = p1.x - minX + pad + nodeWidth/2;
              const y1 = p1.y - minY + pad + 80;
              const x2 = p2.x - minX + pad + nodeWidth/2;
              const y2 = p2.y - minY + pad + 80;
              const midX = (x1 + x2) / 2;
              const children = getChildrenOfUnion(u.personAId, u.personBId);
              
              return (
                <g key={`u-${u.id}`}>
                  <line 
                    className="spouse-line" 
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    strokeDasharray="8,4" 
                    stroke="#D4AF37" 
                    strokeWidth="2" 
                    opacity="0.6"
                    style={{ cursor: onViewRelationship ? 'pointer' : 'default' }}
                    onClick={() => onViewRelationship && onViewRelationship(u.id)}
                  />
                  {children.length > 0 && (
                    <>
                      <line x1={midX} y1={y1} x2={midX} y2={y1 + 60} stroke="#D4AF37" strokeWidth="2" opacity="0.8" />
                      {children.map((cid: number) => {
                        const pc = nodePositions.get(cid);
                        if (!pc) return null;
                        const cx = pc.x - minX + pad + nodeWidth/2;
                        const cy = pc.y - minY + pad;
                        // Trouver la relation parentale correspondante
                        const parentRel = parentalRels.find((r: Relationship) => 
                          (r.personAId === u.personAId || r.personAId === u.personBId) && r.personBId === cid
                        );
                        return (
                          <g key={`u-c-${cid}`}>
                            {parentRel && (
                              <title>Cliquer pour voir/modifier la relation parentale</title>
                            )}
                            <path 
                              d={`M ${midX} ${y1 + 60} C ${midX} ${y1 + 130}, ${cx} ${cy - 80}, ${cx} ${cy}`} 
                              fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.8"
                              style={{ cursor: (onViewRelationship && parentRel) ? 'pointer' : 'default' }}
                              onClick={() => parentRel && onViewRelationship && onViewRelationship(parentRel.id)}
                            />
                          </g>
                        );
                      })}
                    </>
                  )}
                </g>
              );
            })}

            {/* Single parents - Relations parentales */}
            {persons.map((p: Person) => {
              const hasUnion = unions.some((u: Relationship) => u.personAId === p.id || u.personBId === p.id);
              if (hasUnion) return null;

              const children = parentalRels.filter((r: Relationship) => r.personAId === p.id);
              if (children.length === 0) return null;

              const posP = nodePositions.get(p.id);
              if (!posP) return null;
              const px = posP.x - minX + pad + nodeWidth/2;
              const py = posP.y - minY + pad + 80;

              return children.map((r: Relationship) => {
                const posC = nodePositions.get(r.personBId);
                if (!posC) return null;
                const cx = posC.x - minX + pad + nodeWidth/2;
                const cy = posC.y - minY + pad;
                return (
                  <g key={`s-c-${r.id}`}>
                    <title>Cliquer pour voir/modifier la relation</title>
                    <path 
                      d={`M ${px} ${py} C ${px} ${py + 100}, ${cx} ${cy - 100}, ${cx} ${cy}`} 
                      fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.7"
                      style={{ cursor: onViewRelationship ? 'pointer' : 'default' }}
                      onClick={() => onViewRelationship && onViewRelationship(r.id)}
                    />
                  </g>
                );
              });
            })}

            {/* Sibling connections */}
            {relationships.filter((r: Relationship) => r.type === 'SIBLING').map((r: Relationship) => {
              const p1 = nodePositions.get(r.personAId);
              const p2 = nodePositions.get(r.personBId);
              if (!p1 || !p2) return null;
              if (p1.y !== p2.y) return null;
              const x1 = p1.x - minX + pad + nodeWidth/2;
              const x2 = p2.x - minX + pad + nodeWidth/2;
              const y = p1.y - minY + pad - 20;
              return (
                <path key={`sib-${r.id}`} d={`M ${x1} ${y+20} L ${x1} ${y} L ${x2} ${y} L ${x2} ${y+20}`} fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4,4" opacity="0.4" />
              );
            })}
          </svg>

          {Array.from(nodePositions.entries()).map(([id, pos]: [number, {x: number, y: number}]) => {
            const p = persons.find((per: Person) => per.id === id);
            if (!p) return null;
            return (
              <div key={p.id} className="tree-node" style={{ 
                left: pos.x - minX + pad, 
                top: pos.y - minY + pad,
                borderColor: p.gender === 'F' ? '#FF69B4' : p.gender === 'M' ? '#4A90E2' : '#D4AF37'
              }}>
                <div className="avatar-wrapper">
                  <img 
                    src={p.profilePictureUrl || `https://ui-avatars.com/api/?name=${p.firstName}+${p.lastName}&background=random&size=128`} 
                    alt={`${p.firstName} ${p.lastName}`}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${p.firstName}+${p.lastName}&background=random&size=128`;
                    }}
                  />
                  <div className={`gender-badge ${p.gender === 'M' ? 'male' : p.gender === 'F' ? 'female' : 'other'}`}>
                    {p.gender === 'M' ? '♂' : p.gender === 'F' ? '♀' : '?'}
                  </div>
                </div>
                <span className="name">{p.firstName}<br/>{p.lastName}</span>
                <span className="dates">{p.birthDate ? new Date(p.birthDate).getFullYear() : '????'}</span>
                
                <div className="node-actions">
                  {onViewPerson && (
                    <button 
                      className="btn-view" 
                      title="Voir les détails" 
                      onClick={() => onViewPerson(p.id)}
                      style={{
                        background: '#326C58',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        marginBottom: '4px',
                        width: '100%'
                      }}
                    >
                      👁️ Détails
                    </button>
                  )}
                  <button className="btn-child" title="Ajouter un enfant" onClick={() => onAddPerson(p.id, 'CHILD')}>
                    <Users size={14}/> + ENFANT
                  </button>
                  <button className="btn-spouse" title="Ajouter un conjoint" onClick={() => onAddPerson(p.id, 'SPOUSE')}>
                    <PlusCircle size={14}/> + CONJOINT
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button 
        className="fab-add" 
        onClick={() => onAddPerson()}
        title="Ajouter une personne à l'arbre"
        aria-label="Ajouter une personne"
      >
        <PlusCircle size={20} strokeWidth={2.5} />
        <span>Ajouter</span>
      </button>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison pour éviter les re-renders inutiles
  return (
    prevProps.treeZoom === nextProps.treeZoom &&
    prevProps.treeData === nextProps.treeData &&
    JSON.stringify(prevProps.treeData?.persons) === JSON.stringify(nextProps.treeData?.persons) &&
    JSON.stringify(prevProps.treeData?.relationships) === JSON.stringify(nextProps.treeData?.relationships)
  );
});