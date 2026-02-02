import { memo } from 'react';
import { PlusCircle, Users, Flower } from 'lucide-react';
import { type TreeData, type Person, type Relationship } from '../../services/tree.service';

interface TreeVisualizationProps {
  treeData: TreeData | null;
  treeZoom: number;
  setTreeZoom: (zoom: number) => void;
  onAddPerson: (personId?: number, relType?: 'PARENTAL' | 'CHILD' | 'SPOUSE' | 'SIBLING') => void;
}

export const TreeVisualization = memo(({
  treeData,
  treeZoom,
  setTreeZoom,
  onAddPerson
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
  const childrenIds = new Set(parentalRels.map((r: Relationship) => r.personBId));
  const roots = persons.filter((p: Person) => !childrenIds.has(p.id));

  const getChildrenOfUnion = (pA: number, pB: number | null) => {
    const cA = parentalRels.filter((r: Relationship) => r.personAId === pA).map((r: Relationship) => r.personBId);
    if (!pB) return cA;
    const cB = parentalRels.filter((r: Relationship) => r.personAId === pB).map((r: Relationship) => r.personBId);
    return Array.from(new Set([...cA, ...cB]));
  };

  const placeSubtree = (personId: number, startX: number, level: number): number => {
    if (placed.has(personId)) return 0;
    
    const y = level * levelGap;
    const union = unions.find((u: Relationship) => u.personAId === personId || u.personBId === personId);
    const spouseId = union ? (union.personAId === personId ? union.personBId : union.personAId) : null;
    
    const unitWidth = spouseId ? (nodeWidth * 2 + spouseGap) : nodeWidth;
    const children = getChildrenOfUnion(personId, spouseId);
    
    placed.add(personId);
    if (spouseId) placed.add(spouseId);

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
        placeSubtree(childId, currentChildX, level + 1);
        currentChildX += 280 + siblingGap;
      });
    }

    return subtreeWidth;
  };

  let currentX = 0;
  roots.forEach((root: Person) => {
    if (!placed.has(root.id)) {
      currentX += placeSubtree(root.id, currentX, 0) + 200;
    }
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
                  <foreignObject x={20} y={targetY - 30} width={250} height={50}>
                    <div className="generation-label" style={{ 
                      color: '#D4AF37', 
                      fontSize: '0.7rem', 
                      fontWeight: 900, 
                      textTransform: 'uppercase', 
                      letterSpacing: '3px',
                      background: 'rgba(26, 26, 29, 0.8)',
                      padding: '4px 15px',
                      borderRadius: '30px',
                      width: 'fit-content',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                    }}>
                      Génération {i + 1}
                    </div>
                  </foreignObject>
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
                  <line className="spouse-line" x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray="8,4" stroke="#D4AF37" strokeWidth="2" opacity="0.6" />
                  {children.length > 0 && (
                    <>
                      <line x1={midX} y1={y1} x2={midX} y2={y1 + 60} stroke="#D4AF37" strokeWidth="2" opacity="0.8" />
                      {children.map((cid: number) => {
                        const pc = nodePositions.get(cid);
                        if (!pc) return null;
                        const cx = pc.x - minX + pad + nodeWidth/2;
                        const cy = pc.y - minY + pad; 
                        return (
                          <path 
                            key={`u-c-${cid}`} 
                            d={`M ${midX} ${y1 + 60} C ${midX} ${y1 + 130}, ${cx} ${cy - 80}, ${cx} ${cy}`} 
                            fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.8" 
                          />
                        );
                      })}
                    </>
                  )}
                </g>
              );
            })}

            {/* Single parents */}
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
                  <path 
                    key={`s-c-${r.id}`} 
                    d={`M ${px} ${py} C ${px} ${py + 100}, ${cx} ${cy - 100}, ${cx} ${cy}`} 
                    fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.7" 
                  />
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
});